// Ingest PDFs and .txt files from ./corpus into Supabase (documents + chunks).
//
//   node --env-file=.env.local scripts/ingest.mjs --dry      # preview only, writes nothing
//   node --env-file=.env.local scripts/ingest.mjs            # insert new files
//   node --env-file=.env.local scripts/ingest.mjs --replace  # delete and re-insert existing files
//
// Optional metadata per file in corpus/manifest.json (a file may also list "parts": page ranges, each its own document):
//   { "2006_09_14_EIA.pdf": { "title": "...", "doc_type": "rule", "year": 2006,
//                              "sector": null, "state": null, "url": "https://...",
//                              "license_note": "Government of India notification" } }
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-side only, never commit).

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const REPLACE = args.has("--replace");
const DIR = "corpus";
const TARGET_WORDS = 320; // chunk size
const MAX_WORDS = 450; // hard cap for a single paragraph block
const OVERLAP_WORDS = 40; // carried into the next chunk so sentences are not cut off from context

const DOC_TYPES = ["rule", "eia_report", "ec_letter", "judgment", "notice", "monitoring_report", "other"];

/* ───────────── text extraction ───────────── */

async function pdfPages(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    // Rebuild lines from text items using their y position.
    let lines = [];
    let line = "";
    let lastY = null;
    for (const it of content.items) {
      if (!("str" in it)) continue;
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line);
        line = "";
      }
      line += it.str + (it.hasEOL ? "\n" : "");
      lastY = y;
    }
    lines.push(line);
    pages.push({ page: n, text: lines.join("\n") });
  }
  return pages;
}

function txtPages(file) {
  const t = fs.readFileSync(file, "utf8");
  // Form feeds mark pages if present; otherwise there is no page information.
  if (t.includes("\f")) return t.split("\f").map((text, i) => ({ page: i + 1, text }));
  return [{ page: null, text: t }];
}

/* ───────────── cleaning and chunking ───────────── */

function clean(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/-\n(?=[a-z])/g, "") // join words hyphenated across lines
    .replace(/[ ]*\n[ ]*/g, "\n")
    .trim();
}

const HEADING_RES = [
  /^(\d+(\.\d+)*\.?)\s+[A-Z][^\n]{2,120}$/, // "4. Prohibited activities..."
  /^(SCHEDULE|ANNEXURE|APPENDIX|CHAPTER|PART)\b[^\n]{0,100}$/i,
  /^[A-Z][A-Z0-9 ,&()\-\/:.]{6,100}$/, // ALL CAPS lines
];
const isHeading = (l) => {
  if (/^(PRONOUNCED|RESERVED|DATED|DATE OF|DECIDED|HEARD|JUDGMENT RESERVED)\b/i.test(l)) return false;
  if (l.length > 130 || !HEADING_RES.some((re) => re.test(l))) return false;
  // Sentences are not headings ("Schedule the Terms of Reference shall be conveyed along with ...")
  if (!/^\d+(\.\d+)*\.?\s/.test(l) && (wc(l) > 12 || /\b(shall|must|will|should|may be|conveyed|submitted)\b/.test(l))) return false;
  // Numbered lines are headings only when short and not a full sentence ("4. The Chairperson shall be ...")
  if (/^\d+(\.\d+)*\.?\s/.test(l)) {
    if (wc(l) > 9 || /\b(shall|may|must|is|are|will)\b/i.test(l) || /[,;]$/.test(l)) return false;
  }
  return true;
};
const wc = (s) => (s.match(/\S+/g) ?? []).length;

// Lines that repeat on every page and must never become headings or chunk text
const PAGE_NOISE = [/^\d{4}\s+NGTeJ\s+\d+$/i, /^\d{1,4}$/];

/** Turn pages into paragraphs tagged with page and the latest heading. */
function toBlocks(pages) {
  const blocks = [];
  let heading = null;
  for (const p of pages) {
    const text = clean(p.text);
    if (!text) continue;
    // Paragraphs: blank line OR a line ending with a period followed by a capitalised/numbered line
    const lines = text.split("\n");
    let buf = [];
    const flush = () => {
      const t = buf.join(" ").replace(/\s+/g, " ").trim();
      if (t) blocks.push({ page: p.page, heading, text: t });
      buf = [];
    };
    for (const raw of lines) {
      const l = raw.trim();
      if (PAGE_NOISE.some((re) => re.test(l))) continue; // running headers, bare page numbers
      if (!l) { flush(); continue; }
      if (isHeading(l)) {
        flush();
        heading = l.replace(/\s+/g, " ").slice(0, 160);
        // keep the heading text inside the following content too, so search can hit it
        buf.push(l);
        continue;
      }
      buf.push(l);
      if (/[.;:]$/.test(l) && wc(buf.join(" ")) > 120) flush();
    }
    flush();
  }
  return blocks;
}

/** Pack blocks into ~TARGET_WORDS chunks. Each chunk records the page and heading where it starts. */
function chunkBlocks(blocks) {
  const chunks = [];
  let cur = null;
  let tail = "";
  const start = (b) => ({ page: b.page, heading: b.heading, parts: tail ? [tail] : [], words: wc(tail) });
  const close = () => {
    if (!cur || cur.words === 0) return;
    const content = cur.parts.join("\n\n").trim();
    if (content) chunks.push({ content, page_number: cur.page, section_heading: cur.heading });
    const w = content.split(/\s+/);
    tail = w.slice(-OVERLAP_WORDS).join(" ");
    cur = null;
  };
  for (const b of blocks) {
    // Split oversized paragraphs on sentence boundaries
    let pieces = [b.text];
    if (wc(b.text) > MAX_WORDS) {
      const sentences = b.text.split(/(?<=[.;])\s+/);
      pieces = [];
      let s = "";
      for (const sent of sentences) {
        if (wc(s) + wc(sent) > TARGET_WORDS && s) { pieces.push(s); s = sent; }
        else s = s ? `${s} ${sent}` : sent;
      }
      if (s) pieces.push(s);
    }
    for (const piece of pieces) {
      if (!cur) cur = start(b);
      if (cur.words + wc(piece) > TARGET_WORDS && cur.words > 60) {
        close();
        cur = start(b);
      }
      cur.parts.push(piece);
      cur.words += wc(piece);
    }
  }
  close();
  // Drop near-empty junk chunks (page numbers, stray lines)
  return chunks.filter((c) => wc(c.content) >= 15);
}

/* ───────────── metadata ───────────── */

function guessMeta(name) {
  const n = name.toLowerCase();
  let doc_type = "other";
  if (/notification|rule|regulation|\bom\b|circular|guideline/.test(n)) doc_type = "rule";
  else if (/\bngt\b|judg|order|tribunal/.test(n)) doc_type = "judgment";
  else if (/eia|emp|summary|report/.test(n)) doc_type = "eia_report";
  else if (/\bec\b|clearance|letter/.test(n)) doc_type = "ec_letter";
  const year = (n.match(/(19|20)\d{2}/) ?? [])[0];
  return {
    title: name.replace(/\.(pdf|txt)$/i, "").replace(/[_-]+/g, " ").trim(),
    doc_type,
    year: year ? Number(year) : null,
  };
}

/* ───────────── main ───────────── */

async function main() {
  if (!fs.existsSync(DIR)) throw new Error(`Folder "${DIR}" not found. Run this from the project root.`);
  const files = fs.readdirSync(DIR).filter((f) => /\.(pdf|txt)$/i.test(f)).sort();
  if (files.length === 0) throw new Error(`No .pdf or .txt files in ${DIR}/`);

  let manifest = {};
  const mp = path.join(DIR, "manifest.json");
  if (fs.existsSync(mp)) manifest = JSON.parse(fs.readFileSync(mp, "utf8"));

  let sb = null;
  if (!DRY) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    sb = createClient(url, key, { auth: { persistSession: false } });
  }

  // One file can become several documents when the manifest lists "parts"
  // (page ranges, 1-based PDF pages). "page_offset" shifts stored page numbers,
  // e.g. -14 turns PDF page 15 into the journal's own page 1 so citations match print.
  const jobs = [];
  for (const f of files) {
    const full = path.join(DIR, f);
    const m = manifest[f] ?? {};
    const all = /\.pdf$/i.test(f) ? await pdfPages(full) : txtPages(full);
    const offset = m.page_offset ?? 0;
    const withOffset = (arr) => arr.map((p) => ({ ...p, page: p.page == null ? null : p.page + offset }));
    if (Array.isArray(m.parts) && m.parts.length) {
      for (const part of m.parts) {
        const slice = all.filter((p) => p.page >= part.from_page && p.page <= part.to_page);
        const { parts: _p, page_offset: _o, from_page, to_page, ...partMeta } = part;
        const { parts: _p2, page_offset: _o2, ...fileMeta } = m;
        jobs.push({ source: `${f}#p${from_page}`, pages: withOffset(slice), meta: { ...guessMeta(f), ...fileMeta, ...partMeta } });
      }
    } else {
      const { parts: _p, page_offset: _o, ...fileMeta } = m;
      jobs.push({ source: f, pages: withOffset(all), meta: { ...guessMeta(f), ...fileMeta } });
    }
  }

  for (const job of jobs) {
    const { source, pages, meta } = job;
    const chunks = chunkBlocks(toBlocks(pages));
    if (meta.doc_type && !DOC_TYPES.includes(meta.doc_type)) {
      throw new Error(`${source}: doc_type "${meta.doc_type}" must be one of ${DOC_TYPES.join(", ")}`);
    }
    const iso = meta.decided_on && /^\d{2}\.\d{2}\.\d{4}$/.test(meta.decided_on)
      ? meta.decided_on.split(".").reverse().join("-")
      : meta.decided_on ?? null;
    const words = chunks.reduce((n, c) => n + wc(c.content), 0);
    console.log(`\n${source}  ${meta.title ?? ""}\n  pages: ${pages.length}  chunks: ${chunks.length}  words: ${words}  type: ${meta.doc_type}  year: ${meta.year ?? "-"}`);

    if (DRY) {
      if (jobs.length <= 6) {
        for (const i of [0, Math.floor(chunks.length / 2), chunks.length - 1]) {
          const c = chunks[i];
          if (!c) continue;
          console.log(`  [chunk ${i}] page ${c.page_number ?? "-"} | ${c.section_heading ?? "(no heading)"}`);
          console.log("    " + c.content.slice(0, 220).replace(/\n/g, " ") + "…");
        }
      }
      continue;
    }
    if (chunks.length === 0) {
      console.log("  no text found (scanned PDF?), skipping");
      continue;
    }

    const { data: existing, error: e1 } = await sb.from("documents").select("id").eq("source", source);
    if (e1) throw e1;
    if (existing.length && !REPLACE) {
      console.log("  already ingested, skipping (use --replace to redo)");
      continue;
    }
    if (existing.length) {
      const { error } = await sb.from("documents").delete().in("id", existing.map((d) => d.id));
      if (error) throw error;
    }

    const { data: doc, error: e2 } = await sb
      .from("documents")
      .insert({
        source,
        title: meta.title,
        doc_type: meta.doc_type ?? null,
        sector: meta.sector ?? null,
        state: meta.state ?? null,
        year: meta.year ?? null,
        project_name: meta.project_name ?? null,
        url: meta.url ?? null,
        license_note: meta.license_note ?? null,
        bench: meta.bench ?? null,
        decided_on: iso,
      })
      .select("id")
      .single();
    if (e2) throw e2;

    for (let i = 0; i < chunks.length; i += 100) {
      const rows = chunks.slice(i, i + 100).map((c) => ({ document_id: doc.id, chunk_type: "text", ...c }));
      const { error } = await sb.from("chunks").insert(rows);
      if (error) throw error;
    }
    console.log(`  inserted ${doc.id} with ${chunks.length} chunks`);
  }
  console.log(DRY ? "\nDry run complete. Nothing was written." : "\nDone.");
}

main().catch((e) => {
  console.error("\nIngest failed:", e.message ?? e);
  process.exit(1);
});
