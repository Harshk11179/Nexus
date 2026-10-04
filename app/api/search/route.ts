import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_Q = 300;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

// Best-effort per-IP rate limit (in-memory; each serverless instance counts separately).
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

type Row = {
  chunk_id: number;
  document_id: string;
  title: string | null;
  doc_type: string | null;
  year: number | null;
  bench: string | null;
  decided_on: string | null;
  url: string | null;
  page_number: number | null;
  section_heading: string | null;
  snippet: string;
  rank: number;
};

function cleanSnippet(raw: string) {
  const matched = new Set<string>();
  for (const m of raw.matchAll(/<<(.+?)>>/g)) matched.add(m[1].toLowerCase());
  const text = raw.replace(/<<|>>/g, "").replace(/\s+/g, " ").trim();
  return { text, matched: [...matched] };
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const k = Math.min(Math.max(parseInt(searchParams.get("k") ?? "8", 10) || 8, 1), 20);

  if (q.length < 2) return NextResponse.json({ error: "Enter a longer question." }, { status: 400 });
  if (q.length > MAX_Q) return NextResponse.json({ error: `Keep the question under ${MAX_Q} characters.` }, { status: 400 });

  const started = Date.now();
  const { data, error } = await supabaseAdmin().rpc("search_cited", { q, k });
  if (error) {
    console.error("search_cited failed:", error.message);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }

  const results = (data as Row[]).map((r, i) => {
    const { text, matched } = cleanSnippet(r.snippet);
    return {
      n: i + 1,
      chunkId: r.chunk_id,
      score: Math.round(r.rank * 1000) / 1000,
      snippet: text,
      matched,
      page: r.page_number,
      heading: r.section_heading,
      document: {
        id: r.document_id,
        title: r.title,
        type: r.doc_type,
        year: r.year,
        bench: r.bench,
        decidedOn: r.decided_on,
        url: r.url,
      },
      citation: `${r.title ?? "Untitled"}${r.page_number != null ? ` · p. ${r.page_number}` : ""}`,
    };
  });

  return NextResponse.json({ query: q, count: results.length, latencyMs: Date.now() - started, results });
}