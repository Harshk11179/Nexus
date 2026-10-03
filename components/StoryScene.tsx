"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { story } from "@/lib/content";
import {
  ease,
  seg,
  smooth,
  rng,
  makeSprite,
  makeLabelTexture,
  makeAnswerTexture,
  makeTagTexture,
  loadFonts,
  wrapLines,
} from "@/lib/three-utils";

/** Scroll progress 0..1 across the whole pinned story. Written by ScrollStory. */
export type Progress = { p: number };

/*
 * SCENE TIMELINE (p = scrubbed scroll progress 0..1, one stage = 0.2)
 *
 *   0.03 – 0.20  DECOMPOSE   sentence particles scatter, gather into 3 orbs
 *   0.21 – 0.40  ROUTE       orbs fly along curved lines to PDF / SQL / Web
 *   0.41 – 0.60  RETRIEVE    chunk cards stream back, then re-rank: low ones
 *                            fade, the top three per source lock into columns
 *   0.61 – 0.80  CONNECT     entity nodes appear, gold edges draw between
 *                            matches across sources
 *   0.81 – 1.00  SYNTHESIZE  everything converges on F, the answer card
 *                            reveals left to right, citation tags pop in
 */

const GOLD = new THREE.Color("#c8a96a");
const IVORY = new THREE.Color("#f1ede4");
const GRAPHITE = new THREE.Color("#1a1a1f");
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Where the three orbs gather after decomposition
const A = [V(-1.5, 1.15, 0), V(-1.5, 0, 0.2), V(-1.5, -1.15, 0)];
// Where the three sources sit
const B = [V(2.7, 1.5, -0.3), V(3.0, 0, 0.3), V(2.6, -1.5, -0.2)];
// Bezier control points for each route
const CTRL = [V(0.6, 2.4, 1.0), V(0.7, 1.0, 1.7), V(0.6, -2.4, 1.0)];
// Final convergence point (the answer card)
const F = V(0.6, 0, 1.0);

const COL_X = [-0.5, 0.6, 1.7];
const ROW_Y = [1.0, 0, -1.0];

function bez(out: THREE.Vector3, a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
}

/** Shrink a group toward F as c goes 0 → 1 (world-space children converge). */
function converge(g: THREE.Object3D, c: number) {
  const s = Math.max(0.0001, 1 - c);
  g.scale.setScalar(s);
  g.position.copy(F).multiplyScalar(1 - s);
  g.visible = c < 0.999;
}

/* ───────────── 01 · sentence particles ───────────── */

function Sentence({ prog, count, reduce }: { prog: Progress; count: number; reduce: boolean }) {
  const sprite = useMemo(() => makeSprite(), []);
  const invalidate = useThree((s) => s.invalidate);
  const [built, setBuilt] = useState<{
    points: THREE.Points;
    start: Float32Array;
    target: Float32Array;
    dir: Float32Array;
  } | null>(null);

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    loadFonts().then(() => {
      if (!alive) return;
      const W = 1200;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = 620;
      const g = c.getContext("2d")!;
      g.font = "300 92px 'Cormorant Garamond', Georgia, serif";
      const lines = wrapLines(g, story.question, 1100);
      g.fillStyle = "#fff";
      g.textBaseline = "top";
      g.lineWidth = 3; g.strokeStyle = "#fff"; lines.forEach((l, i) => { g.strokeText(l, 40, 20 + i * 112); g.fillText(l, 40, 20 + i * 112); });
      const img = g.getImageData(0, 0, c.width, c.height).data;
      const px: number[] = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let y = 0; y < c.height; y += 2) {
        for (let x = 0; x < W; x += 2) {
          if (img[(y * W + x) * 4 + 3] > 128) {
            px.push(x, y);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (px.length === 0) return;
      const r = rng(11);
      const total = px.length / 2;
      // Seeded shuffle of sample indices
      const idx = Array.from({ length: total }, (_, i) => i);
      for (let i = total - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      const k = 5.0 / (maxX - minX || 1);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const start = new Float32Array(count * 3);
      const target = new Float32Array(count * 3);
      const dir = new Float32Array(count * 3);
      for (let n = 0; n < count; n++) {
        const s = idx[n % total];
        start[n * 3] = 0.4 + (px[s * 2] - cx) * k;
        start[n * 3 + 1] = -(px[s * 2 + 1] - cy) * k;
        start[n * 3 + 2] = 0;
        // Gather into one of the three orbs, in a small sphere
        const o = A[n % 3];
        const u = r() * Math.PI * 2;
        const v = Math.acos(2 * r() - 1);
        const rad = Math.cbrt(r()) * 0.17;
        target[n * 3] = o.x + rad * Math.sin(v) * Math.cos(u);
        target[n * 3 + 1] = o.y + rad * Math.sin(v) * Math.sin(u);
        target[n * 3 + 2] = o.z + rad * Math.cos(v);
        // Random burst direction for the shatter
        const bu = r() * Math.PI * 2;
        const bv = Math.acos(2 * r() - 1);
        const bl = 0.6 + r() * 1.6;
        dir[n * 3] = bl * Math.sin(bv) * Math.cos(bu);
        dir[n * 3 + 1] = bl * Math.sin(bv) * Math.sin(bu);
        dir[n * 3 + 2] = bl * Math.cos(bv);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(start), 3));
      const mat = new THREE.PointsMaterial({
        map: sprite,
        color: IVORY,
        size: 0.045,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      setBuilt({ points: new THREE.Points(geo, mat), start, target, dir });
      invalidate();
    });
    return () => {
      alive = false;
    };
  }, [count, reduce, sprite, invalidate]);

  useFrame(() => {
    if (!built) return;
    const p = prog.p;
    const t1 = seg(p, 0.03, 0.2);
    const e = ease(t1);
    const burst = Math.sin(Math.PI * t1);
    const arr = built.points.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = built.start[i] + (built.target[i] - built.start[i]) * e + built.dir[i] * burst;
    }
    built.points.geometry.attributes.position.needsUpdate = true;
    const mat = built.points.material as THREE.PointsMaterial;
    mat.opacity = 1 - seg(p, 0.17, 0.23);
    mat.color.copy(IVORY).lerp(GOLD, e);
    built.points.visible = mat.opacity > 0.01;
  });

  return built ? <primitive object={built.points} /> : null;
}

/* ───────────── 02 · orbs and routes ───────────── */

function Orbs({ prog, reduce }: { prog: Progress; reduce: boolean }) {
  const sprite = useMemo(() => makeSprite(), []);
  const built = useMemo(() => {
    const root = new THREE.Group();
    const orbs = [0, 1, 2].map(() => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 24, 24),
        new THREE.MeshBasicMaterial({ color: IVORY }),
      );
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: sprite,
          color: GOLD,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.9,
        }),
      );
      halo.scale.setScalar(0.9);
      g.add(core, halo);
      root.add(g);
      return g;
    });
    const lines = [0, 1, 2].map((i) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 48; k++) pts.push(bez(new THREE.Vector3(), A[i], CTRL[i], B[i], k / 48));
      const l = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55 }),
      );
      root.add(l);
      return l;
    });
    return { root, orbs, lines };
  }, [sprite]);

  useFrame((state) => {
    const p = prog.p;
    const s1 = ease(seg(p, 0.15, 0.21));
    const e2 = ease(seg(p, 0.21, 0.4));
    const shrink = 1 - 0.6 * ease(seg(p, 0.36, 0.42));
    const pulse = reduce ? 1 : 1 + 0.08 * Math.sin(state.clock.elapsedTime * 3);
    built.orbs.forEach((g, i) => {
      bez(g.position, A[i], CTRL[i], B[i], e2);
      g.scale.setScalar(Math.max(s1 * shrink * pulse, 0.0001));
      g.visible = s1 > 0.001;
    });
    built.lines.forEach((l) => {
      l.geometry.setDrawRange(0, Math.floor(49 * e2));
      l.visible = e2 > 0.01;
      (l.material as THREE.LineBasicMaterial).opacity = 0.55 * (1 - seg(p, 0.45, 0.6));
    });
    converge(built.root, ease(seg(p, 0.81, 1)));
  });

  return <primitive object={built.root} />;
}

/* ───────────── 02 · sources ───────────── */

function Sources({ prog, reduce }: { prog: Progress; reduce: boolean }) {
  const built = useMemo(() => {
    const root = new THREE.Group();
    const edgeMat = () => new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.75 });
    const solid = (geo: THREE.BufferGeometry) => {
      const m = new THREE.Group();
      m.add(
        new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: GRAPHITE })),
        new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), edgeMat()),
      );
      return m;
    };
    const holders = B.map((b) => {
      const h = new THREE.Group();
      h.position.copy(b);
      root.add(h);
      return h;
    });

    // PDF stack: four thin pages, slightly rotated
    const pdf = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const page = solid(new THREE.BoxGeometry(0.8, 0.04, 0.6));
      page.position.y = k * 0.085 - 0.13;
      page.rotation.y = k * 0.14 - 0.2;
      pdf.add(page);
    }
    pdf.rotation.x = 0.5;
    holders[0].add(pdf);

    // Database cylinder: three stacked discs
    const db = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const d = solid(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 32));
      d.position.y = (k - 1) * 0.27;
      db.add(d);
    }
    db.rotation.x = 0.35;
    holders[1].add(db);

    // Globe: wireframe sphere with a tilted ring
    const globe = new THREE.Group();
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.44, 32, 24), new THREE.MeshBasicMaterial({ color: GRAPHITE })));
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.445, 16, 12),
        new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.5 }),
      ),
    );
    holders[2].add(globe);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.004, 8, 80),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.6 }),
    );
    ring.rotation.x = 1.25;
    holders[2].add(ring);

    // Mono labels under each source
    story.labels.forEach((text, i) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeLabelTexture(text), transparent: true, depthWrite: false }),
      );
      s.scale.set(0.8, 0.2, 1);
      s.position.set(0, -0.82, 0);
      holders[i].add(s);
    });

    return { root, holders, pdf, db, globe };
  }, []);

  useFrame((_, dt) => {
    const p = prog.p;
    const a = ease(seg(p, 0.22, 0.4));
    built.holders.forEach((h) => {
      h.scale.setScalar(Math.max(a, 0.0001));
      h.visible = a > 0.001;
    });
    if (!reduce) {
      built.globe.rotation.y += dt * 0.35;
      built.pdf.rotation.y += dt * 0.08;
      built.db.rotation.y += dt * 0.12;
    }
    converge(built.root, ease(seg(p, 0.81, 1)));
  });

  return <primitive object={built.root} />;
}

/* ───────────── 03 · retrieved chunks and re-rank ───────────── */

function Cards({ prog }: { prog: Progress }) {
  const built = useMemo(() => {
    const r = rng(21);
    const root = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry(0.62, 0.38);
    const edgeGeo = new THREE.EdgesGeometry(planeGeo);
    const l1 = new THREE.PlaneGeometry(0.42, 0.025);
    const l2 = new THREE.PlaneGeometry(0.3, 0.025);
    const cards: {
      group: THREE.Group;
      fill: THREE.MeshBasicMaterial;
      edge: THREE.LineBasicMaterial;
      tx: THREE.MeshBasicMaterial;
      src: number;
      locked: boolean;
      delay: number;
      mid: THREE.Vector3;
      lock: THREE.Vector3;
      rot: THREE.Vector3;
    }[] = [];

    for (let s = 0; s < 3; s++) {
      // Six chunks per source, ranked by relevance. Top three get locked.
      const rel = Array.from({ length: 6 }, () => 0.15 + r() * 0.85).sort((a, b) => b - a);
      rel.forEach((_, rank) => {
        const group = new THREE.Group();
        const fill = new THREE.MeshBasicMaterial({ color: GRAPHITE, transparent: true, opacity: 0 });
        const edge = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
        const tx = new THREE.MeshBasicMaterial({ color: IVORY, transparent: true, opacity: 0 });
        const a = new THREE.Mesh(l1, tx);
        a.position.set(0.03, 0.03, 0.002);
        const b = new THREE.Mesh(l2, tx);
        b.position.set(-0.04, -0.05, 0.002);
        group.add(new THREE.Mesh(planeGeo, fill), new THREE.LineSegments(edgeGeo, edge), a, b);
        root.add(group);
        cards.push({
          group,
          fill,
          edge,
          tx,
          src: s,
          locked: rank < 3,
          delay: r() * 0.3,
          mid: V(-0.9 + r() * 3.0, -1.9 + r() * 3.8, -0.3 + r() * 1.3),
          lock: V(COL_X[s], ROW_Y[Math.min(rank, 2)], 0.3),
          rot: V((r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.8),
        });
      });
    }
    return { root, cards };
  }, []);

  useFrame(() => {
    const p = prog.p;
    const t3 = seg(p, 0.41, 0.6);
    const b = ease(seg(t3, 0.64, 1));
    built.cards.forEach((c) => {
      const a = ease(seg(t3, c.delay, c.delay + 0.55));
      const appear = smooth(seg(t3, c.delay, c.delay + 0.12));
      const g = c.group;
      g.position.copy(B[c.src]).lerp(c.mid, a);
      if (c.locked) g.position.lerp(c.lock, b);
      else g.position.y -= 0.5 * b;
      const k = c.locked ? 1 : 1 - b; // opacity factor: low-relevance cards fade
      const rotK = c.locked ? 1 - b : 1; // top cards level out as they lock
      g.rotation.set(c.rot.x * rotK, c.rot.y * rotK, c.rot.z * rotK);
      g.scale.setScalar(Math.max(appear * (0.55 + 0.45 * a) * (c.locked ? 1 : 1 - 0.3 * b), 0.0001));
      c.fill.opacity = 0.92 * appear * k;
      c.edge.opacity = (0.35 + (c.locked ? 0.5 * b : 0)) * appear * k;
      c.tx.opacity = 0.45 * appear * k;
      g.visible = appear * k > 0.002;
    });
    converge(built.root, ease(seg(p, 0.81, 1)));
  });

  return <primitive object={built.root} />;
}

/* ───────────── 04 · entity graph ───────────── */

function Graph({ prog }: { prog: Progress }) {
  const sprite = useMemo(() => makeSprite(), []);
  const built = useMemo(() => {
    const r = rng(5);
    const root = new THREE.Group();
    // One entity dot per locked card (3 sources x 3 ranks), index = src*3 + rank
    const entities: THREE.Vector3[] = [];
    for (let s = 0; s < 3; s++) for (let k = 0; k < 3; k++) entities.push(V(COL_X[s] - 0.22, ROW_Y[k] + 0.1, 0.34));
    const fillers = Array.from({ length: 18 }, () => V(-2.6 + r() * 6.2, -2.2 + r() * 4.4, -1.4 + r() * 1.0));
    const nodes = [...entities, ...fillers];

    const pos = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => n.toArray(pos, i * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({
      map: sprite,
      color: GOLD,
      size: 0.14,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    root.add(new THREE.Points(geo, pm));

    // Faint background edges: every node to its two nearest neighbours
    const segs: number[] = [];
    nodes.forEach((n, i) => {
      nodes
        .map((m, j) => ({ j, d: n.distanceToSquared(m) }))
        .filter((o) => o.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
        .forEach((o) => {
          const m = nodes[o.j];
          segs.push(n.x, n.y, n.z, m.x, m.y, m.z);
        });
    });
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs), 3));
    const bgMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
    root.add(new THREE.LineSegments(bgGeo, bgMat));

    // Bright path: matching entities across the three sources, drawn in order
    const pairs: [number, number][] = [
      [1, 3],
      [3, 8],
      [1, 8],
    ];
    const paths = pairs.map(([i, j]) => {
      const a = entities[i];
      const b = entities[j];
      const c = a.clone().add(b).multiplyScalar(0.5).add(V(0, 0.45, 0.8));
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 32; k++) pts.push(bez(new THREE.Vector3(), a, c, b, k / 32));
      const l = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95 }),
      );
      root.add(l);
      return l;
    });

    // Glows on the nodes the path passes through
    const halos = [1, 3, 8].map((i) => {
      const h = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: sprite,
          color: GOLD,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      h.position.copy(entities[i]);
      root.add(h);
      return h;
    });
    return { root, pm, bgMat, paths, halos };
  }, [sprite]);

  useFrame(() => {
    const p = prog.p;
    const t4 = seg(p, 0.61, 0.8);
    built.pm.opacity = 0.85 * ease(seg(p, 0.6, 0.7));
    built.bgMat.opacity = 0.16 * ease(seg(p, 0.62, 0.75));
    built.paths.forEach((l, j) => {
      const u = ease(seg(t4, j * 0.22, j * 0.22 + 0.42));
      l.geometry.setDrawRange(0, Math.floor(33 * u));
      l.visible = u > 0.01;
    });
    built.halos.forEach((h, j) => {
      const u = ease(seg(t4, j * 0.22, j * 0.22 + 0.3));
      (h.material as THREE.SpriteMaterial).opacity = 0.85 * u;
      h.scale.setScalar(0.2 + 0.45 * u);
    });
    converge(built.root, ease(seg(p, 0.81, 1)));
  });

  return <primitive object={built.root} />;
}

/* ───────────── 05 · answer card ───────────── */

function Answer({ prog, reduce }: { prog: Progress; reduce: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const sprite = useMemo(() => makeSprite(), []);
  const [tex, setTex] = useState<{ answer: THREE.CanvasTexture; tags: THREE.CanvasTexture[] } | null>(null);

  useEffect(() => {
    let alive = true;
    loadFonts().then(() => {
      if (!alive) return;
      setTex({
        answer: makeAnswerTexture(story.answerLabel, story.answer, story.support, story.confidence),
        tags: ["[1]", "[2]", "[3]"].map(makeTagTexture),
      });
      invalidate();
    });
    return () => {
      alive = false;
    };
  }, [invalidate]);

  const built = useMemo(() => {
    if (!tex) return null;
    const W = 2.7;
    const H = 1.5577;
    const root = new THREE.Group();
    root.position.copy(F);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sprite,
        color: GOLD,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.setScalar(5.2);
    glow.position.z = -0.1;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: tex.answer, transparent: true, opacity: 0 }),
    );
    // Cover plane hides the text, then slides away so the answer "reads" in
    const cover = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: GRAPHITE, transparent: true, opacity: 0 }),
    );
    cover.position.z = 0.004;
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, H)),
      new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 }),
    );
    border.position.z = 0.008;
    root.add(glow, card, cover, border);
    const tags = tex.tags.map((t, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
      s.scale.set(0.34, 0.17, 1);
      s.position.set(-1.0 + i * 0.42, -0.58, 0.02);
      root.add(s);
      return s;
    });
    return { root, glow, card, cover, border, tags, W, H };
  }, [tex, sprite]);

  useFrame(() => {
    if (!built) return;
    const p = prog.p;
    const o = ease(seg(p, 0.84, 0.9));
    built.root.scale.setScalar(0.35 + 0.65 * ease(seg(p, 0.84, 0.96)));
    built.root.visible = o > 0.001;
    (built.card.material as THREE.MeshBasicMaterial).opacity = o;
    (built.cover.material as THREE.MeshBasicMaterial).opacity = o;
    (built.border.material as THREE.LineBasicMaterial).opacity = 0.85 * o;
    (built.glow.material as THREE.SpriteMaterial).opacity = 0.22 * o;
    const rv = ease(seg(p, 0.9, 0.985));
    const w = Math.max(built.W * (1 - rv), 0.0001);
    built.cover.scale.set(w, built.H, 1);
    built.cover.position.x = built.W / 2 - w / 2;
    built.tags.forEach((s, i) => {
      const u = ease(seg(p, 0.955 + i * 0.012, 0.985 + i * 0.012));
      (s.material as THREE.SpriteMaterial).opacity = u;
      const k = 0.6 + 0.4 * u;
      s.scale.set(0.34 * k, 0.17 * k, 1);
    });
    if (!reduce) built.root.rotation.y = Math.sin(performance.now() / 2600) * 0.03;
  });

  return built ? <primitive object={built.root} /> : null;
}

/* ───────────── camera + layout ───────────── */

type K = [number, number, number];
// Six equally spaced keyframes (p = 0, .2, .4, .6, .8, 1): the camera dollies
// in, drifts right on the route, swings left on connect, then pushes in on the answer.
const POS_KEYS: K[] = [
  [0.6, 0.1, 7.6],
  [0.2, 0.35, 6.8],
  [1.4, 0.25, 7.7],
  [0.5, -0.25, 6.6],
  [-0.2, 0.45, 6.9],
  [0.55, 0.05, 5.4],
];
const LOOK_KEYS: K[] = [
  [0.4, 0, 0],
  [0.2, 0, 0],
  [1.0, 0, 0],
  [0.6, 0, 0.2],
  [0.5, 0, 0],
  [0.6, 0, 0.9],
];

function CameraRig({ prog, reduce }: { prog: Progress; reduce: boolean }) {
  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(POS_KEYS.map((k) => V(...k)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(LOOK_KEYS.map((k) => V(...k)), false, "centripetal"),
    }),
    [],
  );
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, pointer }) => {
    const u = Math.min(1, Math.max(0, prog.p));
    curves.pos.getPoint(u, tp);
    curves.look.getPoint(u, tl);
    if (!reduce) {
      tp.x += pointer.x * 0.25;
      tp.y += pointer.y * 0.15;
    }
    camera.position.copy(tp);
    camera.lookAt(tl);
  });
  return null;
}

/** Shifts the scene right on wide screens (text sits left), up on portrait. */
function Layout({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ size }) => {
    const g = ref.current;
    if (!g) return;
    const aspect = size.width / size.height;
    const wide = aspect > 1.2;
    const s = wide ? Math.min(0.92, aspect * 0.52) : Math.min(0.9, Math.max(0.34, aspect * 0.85));
    g.scale.setScalar(s);
    g.position.set(wide ? 1.55 * s : 0, wide ? 0 : 0.95, 0);
  });
  return <group ref={ref}>{children}</group>;
}

export default function StoryScene({
  prog,
  reduce,
  mobile,
}: {
  prog: Progress;
  reduce: boolean;
  mobile: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 40, position: [0.6, 0.1, 7.6], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reduce ? "demand" : "always"}
      style={{ background: "transparent" }}
    >
      <CameraRig prog={prog} reduce={reduce} />
      <Layout>
        <Sentence prog={prog} count={mobile ? 900 : 2200} reduce={reduce} />
        <Orbs prog={prog} reduce={reduce} />
        <Sources prog={prog} reduce={reduce} />
        <Cards prog={prog} />
        <Graph prog={prog} />
        <Answer prog={prog} reduce={reduce} />
      </Layout>
    </Canvas>
  );
}
