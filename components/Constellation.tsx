"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Soft round sprite generated in code (no image files). */
function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

/** Seeded PRNG so the graph is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function Graph({ count, reduce }: { count: number; reduce: boolean }) {
  const group = useRef<THREE.Group>(null);

  const { positions, linePositions } = useMemo(() => {
    const r = rng(7);
    const pos = new Float32Array(count * 3);
    // A handful of cluster centres so the cloud reads as a graph, not noise.
    const centres = Array.from({ length: 9 }, () => [
      (r() - 0.5) * 9,
      (r() - 0.5) * 5,
      (r() - 0.5) * 6,
    ]);
    for (let i = 0; i < count; i++) {
      const c = centres[Math.floor(r() * centres.length)];
      const spread = 0.4 + r() * 1.5;
      const u = r() * Math.PI * 2;
      const v = Math.acos(2 * r() - 1);
      const rad = Math.cbrt(r()) * spread;
      pos[i * 3] = c[0] + rad * Math.sin(v) * Math.cos(u);
      pos[i * 3 + 1] = c[1] + rad * Math.sin(v) * Math.sin(u);
      pos[i * 3 + 2] = c[2] + rad * Math.cos(v);
    }
    // Edges: link a subset of nodes to their nearest neighbour.
    const edges: number[] = [];
    const stride = Math.max(1, Math.floor(count / 420));
    for (let i = 0; i < count; i += stride) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < count; j += 3) {
        if (j === i) continue;
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = j; }
      }
      if (best >= 0 && bd < 1.4) {
        edges.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[best * 3], pos[best * 3 + 1], pos[best * 3 + 2]);
      }
    }
    return { positions: pos, linePositions: new Float32Array(edges) };
  }, [count]);

  const sprite = useMemo(() => makeSprite(), []);

  useFrame((state, dt) => {
    if (reduce) return;
    if (group.current) group.current.rotation.y += dt * 0.035;
    // Mouse parallax on the camera
    const { pointer, camera } = state;
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color="#c8a96a"
          size={0.09}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={linePositions} count={linePositions.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#c8a96a" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export default function Constellation({ count, reduce }: { count: number; reduce: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9], fov: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      frameloop={reduce ? "demand" : "always"}
      style={{ background: "transparent" }}
    >
      <Graph count={count} reduce={reduce} />
    </Canvas>
  );
}
