import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BOUNDS, BUILDING_LIST, ENTRANCE, GATE2, GARDENS, PARKING, PATHS, ROADS, PALETTE } from './config';
import { grassTexture } from './textures';

const inRect = (x, z, r, pad = 0) => Math.abs(x - r.x) < r.width / 2 + pad && Math.abs(z - r.z) < r.depth / 2 + pad;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function CampusGround() {
  const g = useMemo(() => grassTexture(), []);
  const xa = BOUNDS.x0 - 5, xb = BOUNDS.x1 + 3, za = BOUNDS.z0 - 3, zb = BOUNDS.z1 + 3;
  const w = xb - xa, d = zb - za;
  g.repeat.set(w / 3, d / 3.7);
  // north-east lawn under the cricket ground (outside the wall line, open to the north)
  const ne = { x0: BOUNDS.northWallEnd - 3, x1: xb, z0: za - 34, z1: za };
  const g2 = useMemo(() => { const t = g.clone(); t.repeat.set((ne.x1 - ne.x0) / 3, (ne.z1 - ne.z0) / 3.7); t.needsUpdate = true; return t; }, [g]); // eslint-disable-line
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow><planeGeometry args={[420, 420]} /><meshStandardMaterial color="#a39766" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(xa + xb) / 2, -0.02, (za + zb) / 2]} receiveShadow>
        <planeGeometry args={[w, d]} /><meshStandardMaterial map={g} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(ne.x0 + ne.x1) / 2, -0.02, (ne.z0 + ne.z1) / 2]} receiveShadow>
        <planeGeometry args={[ne.x1 - ne.x0, ne.z1 - ne.z0]} /><meshStandardMaterial map={g2} roughness={1} />
      </mesh>
    </group>
  );
}

const asphalt = new THREE.MeshStandardMaterial({ color: '#3b3e42', roughness: 0.95 });
const paving = new THREE.MeshStandardMaterial({ color: '#cbc4b0', roughness: 0.95 });
const yellow = new THREE.MeshStandardMaterial({ color: '#e6c34a', roughness: 0.8 });

export function InternalRoads() {
  return (
    <group>
      {ROADS.map((r) => (
        <group key={r.id}>
          <mesh position={[r.x, 0.02, r.z]} material={asphalt} receiveShadow><boxGeometry args={[r.width, 0.04, r.depth]} /></mesh>
          {/* yellow edge lines like the entrance road */}
          {r.depth > r.width
            ? [-1, 1].map((s) => <mesh key={s} position={[r.x + s * (r.width / 2 - 0.2), 0.045, r.z]} material={yellow}><boxGeometry args={[0.07, 0.01, r.depth]} /></mesh>)
            : [-1, 1].map((s) => <mesh key={s} position={[r.x, 0.045, r.z + s * (r.depth / 2 - 0.2)]} material={yellow}><boxGeometry args={[r.width, 0.01, 0.07]} /></mesh>)}
        </group>
      ))}
      {PATHS.map((p) => <mesh key={p.id} position={[p.x, 0.035, p.z]} material={paving} receiveShadow><boxGeometry args={[p.width, 0.05, p.depth]} /></mesh>)}
    </group>
  );
}

export function BoundaryWall() {
  const { x0, x1, z0, z1 } = BOUNDS, nEnd = BOUNDS.northWallEnd ?? x1, t = 0.14, h = 0.75;
  const gaps = [ENTRANCE, GATE2].map((g) => ({ a: g.z - (g.halfSpan * (g.scale ?? 1) + 0.6), b: g.z + (g.halfSpan * (g.scale ?? 1) + 0.6) })).sort((p, q) => p.a - q.a);
  const west = []; let cur = z0;
  gaps.forEach((g) => { west.push([cur, g.a]); cur = g.b; }); west.push([cur, z1]);
  const segs = [
    { x: (x0 + nEnd) / 2, z: z0, w: nEnd - x0, d: t }, // north wall ends before the (wall-less) cricket ground
    { x: (x0 + x1) / 2, z: z1, w: x1 - x0, d: t },
    { x: x1, z: (z0 + z1) / 2, w: t, d: z1 - z0 },
    ...west.map(([a, b]) => ({ x: x0, z: (a + b) / 2, w: t, d: b - a })),
  ];
  return (
    <group>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]}>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[s.w, h, s.d]} /><meshStandardMaterial color={PALETTE.wall} roughness={0.9} /></mesh>
          <mesh position={[0, h + 0.04, 0]}><boxGeometry args={[s.w + 0.02, 0.08, s.d + 0.1]} /><meshStandardMaterial color={PALETTE.pilaster} roughness={0.9} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ── Trees ───────────────────────────────────────────────────────────────────
function blocked(x, z) {
  return BUILDING_LIST.some((b) => inRect(x, z, b, 1.6))
    || ROADS.some((r) => inRect(x, z, r, 0.5)) || PATHS.some((p) => inRect(x, z, p, 0.5))
    || PARKING.some((p) => inRect(x, z, p, 0.6)) || GARDENS.some((g) => inRect(x, z, g, 0.3))
    || ([ENTRANCE, GATE2].some((g) => Math.abs(z - g.z) < (g.halfSpan * (g.scale ?? 1) + 0.6) && x < BOUNDS.x0 + 5));
}
function scatterTrees() {
  const r = rng(7), palms = [], trees = [];
  const push = (arr, x, z, jitter = 0.3) => { const px = x + (r() - 0.5) * jitter * 2, pz = z + (r() - 0.5) * jitter * 2; if (!blocked(px, pz)) arr.push({ x: px, z: pz, s: 0.85 + r() * 0.5, a: r() * 6.28 }); };
  const wx = ROADS[0].x;
  for (let z = -24; z < 55; z += 4.5) { push(palms, wx - 2.6, z); push(palms, BOUNDS.x0 + 2.2, z); }
  [ENTRANCE, GATE2].forEach((g) => [-1, 1].forEach((k) => { const o = g.halfSpan * (g.scale ?? 1) + 1.4; push(palms, BOUNDS.x0 + 2.4, g.z + k * o, 0); push(palms, wx - 2.4, g.z + k * o, 0); }));
  for (let x = -12; x < 42; x += 6) { push(palms, x, 1.1, 0.6); push(trees, x + 2, 6.2, 0.6); }
  for (let x = -31; x < 43; x += 4.2) push(trees, x, -25.6, 0.5);
  for (let i = 0; i < 26; i++) push(trees, -31 + r() * 15, 8 + r() * 11, 0);        // lawn W of A block
  for (let i = 0; i < 14; i++) push(trees, -17 + r() * 24, -14 + r() * 9, 0);       // between admin / canteen
  for (let i = 0; i < 10; i++) push(palms, 11 + r() * 14, -23 + r() * 5, 0);         // N of open auditorium
  for (let i = 0; i < 9; i++) push(trees, 26 + r() * 16, 8 + r() * 12, 0);           // E of B block / between blocks
  for (let i = 0; i < 8; i++) push(palms, -31 + r() * 9, -25 + r() * 3, 0);
  for (let z = -24; z < 55; z += 5) push(palms, BOUNDS.x1 - 2.2, z);                 // east boundary
  for (let x = -30; x < 49; x += 5) push(palms, x, BOUNDS.z1 - 1.6, 0.3);            // south boundary
  for (let i = 0; i < 30; i++) push(trees, -31 + r() * 78, 29 + r() * 24, 0);        // southern extension lawns
  // eastern extension (sports side): separate RNG, original tree layout above stays exactly as before
  const r2 = rng(23), put = (arr, x, z) => { const s = 0.85 + r2() * 0.5, a = r2() * 6.28; if (!blocked(x, z)) arr.push({ x, z, s, a }); };
  for (let x = 49; x < BOUNDS.x1 - 1; x += 5) put(palms, x, BOUNDS.z1 - 1.6);
  for (let i = 0; i < 24; i++) put(trees, 52 + r2() * 37, 9 + r2() * 44);
  for (let x = 50; x < BOUNDS.x1 - 2; x += 6) put(palms, x, 7.6);                   // along the courts walk
  return { palms, trees };
}
const palmTrunkGeo = new THREE.CylinderGeometry(0.07, 0.13, 1, 7);
const frondGeo = new THREE.BoxGeometry(0.16, 0.03, 1.5).translate(0, 0, 0.75);
const roundTrunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 6);
const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
const trunkMat = new THREE.MeshStandardMaterial({ color: '#8a7a68', roughness: 1 });
const frondMat = new THREE.MeshStandardMaterial({ color: '#3f7d37', roughness: 0.9, side: THREE.DoubleSide });
const canopyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
const brown = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 1 });

export function TreesAndLandscaping() {
  const { palms, trees } = useMemo(scatterTrees, []);
  const pt = useRef(), fr = useRef(), tt = useRef(), tc = useRef();
  const F = 7;
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    palms.forEach((p, i) => {
      const H = 2.8 * p.s;
      o.position.set(p.x, H / 2, p.z); o.rotation.set(0, 0, 0); o.scale.set(1, H, 1); o.updateMatrix(); pt.current.setMatrixAt(i, o.matrix);
      for (let k = 0; k < F; k++) {
        o.position.set(p.x, H, p.z); o.rotation.set(0.55, p.a + (k * Math.PI * 2) / F, 0, 'YXZ'); o.scale.setScalar(p.s); o.updateMatrix();
        fr.current.setMatrixAt(i * F + k, o.matrix);
      }
    });
    trees.forEach((t, i) => {
      const H = 1.3 * t.s, R = 1.05 * t.s;
      o.position.set(t.x, H / 2, t.z); o.rotation.set(0, 0, 0); o.scale.set(1, H, 1); o.updateMatrix(); tt.current.setMatrixAt(i, o.matrix);
      o.position.set(t.x, H + R * 0.6, t.z); o.scale.set(R, R * 0.85, R); o.updateMatrix(); tc.current.setMatrixAt(i, o.matrix);
      tc.current.setColorAt(i, c.setHSL(0.27 + ((i * 37) % 10) * 0.006, 0.45, 0.28 + ((i * 13) % 10) * 0.01));
    });
    [pt, fr, tt, tc].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; });
    tc.current.instanceColor.needsUpdate = true;
  }, [palms, trees]);
  return (
    <group>
      <instancedMesh ref={pt} args={[palmTrunkGeo, trunkMat, palms.length]} castShadow />
      <instancedMesh ref={fr} args={[frondGeo, frondMat, palms.length * F]} castShadow />
      <instancedMesh ref={tt} args={[roundTrunkGeo, brown, trees.length]} castShadow />
      <instancedMesh ref={tc} args={[canopyGeo, canopyMat, trees.length]} castShadow receiveShadow />
      {GARDENS.map((g) => <Garden key={g.id} g={g} />)}
    </group>
  );
}
const lawn = new THREE.MeshStandardMaterial({ color: '#7fb34f', roughness: 1 });
const hedge = new THREE.MeshStandardMaterial({ color: '#2f6a2b', roughness: 1 });
function Garden({ g }) {
  return (
    <group position={[g.x, 0, g.z]}>
      <mesh position={[0, 0.03, 0]} material={lawn} receiveShadow><boxGeometry args={[g.width, 0.06, g.depth]} /></mesh>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[0, 0.2, s * (g.depth / 2 - 0.15)]} material={hedge} castShadow><boxGeometry args={[g.width, 0.32, 0.3]} /></mesh>
          <mesh position={[s * (g.width / 2 - 0.15), 0.2, 0]} material={hedge} castShadow><boxGeometry args={[0.3, 0.32, g.depth]} /></mesh>
        </React.Fragment>
      ))}
      <mesh position={[0, 0.12, 0]} material={hedge} castShadow><cylinderGeometry args={[Math.min(g.width, g.depth) * 0.22, Math.min(g.width, g.depth) * 0.22, 0.22, 24]} /></mesh>
      <mesh position={[0, 0.25, 0]} material={lawn}><cylinderGeometry args={[Math.min(g.width, g.depth) * 0.16, Math.min(g.width, g.depth) * 0.16, 0.06, 24]} /></mesh>
    </group>
  );
}

// ── Parking: yellow college buses, cars, two-wheelers ───────────────────────
const busGeo = new THREE.BoxGeometry(2.7, 0.85, 0.75);
const busWinGeo = new THREE.BoxGeometry(2.5, 0.28, 0.77);
const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.13, 14).rotateX(Math.PI / 2);
const mirrorGeo = new THREE.BoxGeometry(0.04, 0.2, 0.11);
const armGeo = new THREE.BoxGeometry(0.03, 0.03, 0.16);
const screenGeo = new THREE.BoxGeometry(0.02, 0.36, 0.66);
const tyreMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 });
const mirrorMat = new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.4, metalness: 0.5 });
// Car = body + glass cabin + roof + four tyres (all in world axes: length along Z).
const carBodyGeo = new THREE.BoxGeometry(0.42, 0.26, 0.85);
const carCabinGeo = new THREE.BoxGeometry(0.36, 0.15, 0.56);
const carRoofGeo = new THREE.BoxGeometry(0.38, 0.03, 0.32);
const carWheelGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.06, 12).rotateZ(Math.PI / 2);
const carGlassMat = new THREE.MeshStandardMaterial({ color: '#2b3b4a', roughness: 0.08, metalness: 0.7 });
const bikeGeo = new THREE.BoxGeometry(0.4, 0.2, 0.12);
const busMat = new THREE.MeshStandardMaterial({ color: '#f2bf1f', roughness: 0.55 });
const winMat = new THREE.MeshStandardMaterial({ color: '#1b2630', roughness: 0.25, metalness: 0.5 });
const carMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.3 });
const slabMat = new THREE.MeshStandardMaterial({ color: '#4a4d51', roughness: 0.95 });
const lineMat = new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.9 });
const palette = ['#d9d9d9', '#b21f2a', '#2d4a8a', '#1e1e22', '#ffffff', '#6b7078'];

export function ParkingAndVehicles() {
  const bus = useRef(), bw = useRef(), wheels = useRef(), mir = useRef(), arm = useRef(), scr = useRef(), bikes = useRef(), cars = useRef(), cabins = useRef(), roofs = useRef(), carWheels = useRef(), lines = useRef();
  const lay = useMemo(() => {
    const buses = [], bk = [], cs = [], ln = [], r = rng(11);
    PARKING.forEach((p) => {
      if (p.kind === 'bus') {
        const n = Math.floor((p.width - 0.6) / 3.0);
        for (let row = 0; row < 3; row++) for (let i = 0; i < n; i++) buses.push([p.x - p.width / 2 + 1.8 + i * 3.0, p.z - 2.2 + row * 1.9]);
      } else if (p.kind === 'bike') {
        for (let i = 0; i < 28; i++) bk.push([p.x - p.width / 2 + 0.4 + i * 0.5, p.z + ((i % 2) - 0.5) * 0.3]);
      } else if (p.kind === 'lot') {
        const n = Math.floor((p.width - 1) / 0.72), x0 = p.x - ((n - 1) * 0.72) / 2;
        [-3.2, -2.3, 2.3, 3.2].forEach((dz) => { for (let i = 0; i < n; i++) if (r() < 0.78) cs.push([x0 + i * 0.72, p.z + dz]); });
        [-2.75, 2.75].forEach((dz) => { for (let i = 0; i <= n; i++) ln.push([x0 - 0.36 + i * 0.72, p.z + dz]); });
        const m = Math.floor((p.width - 1) / 0.5);
        [-4.6, 4.6].forEach((dz) => { for (let i = 0; i < m; i++) if (r() < 0.8) bk.push([p.x - (m * 0.5) / 2 + i * 0.5, p.z + dz + ((i % 2) - 0.5) * 0.2]); });
      }
    });
    return { buses, bk, cs, ln };
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    lay.buses.forEach(([x, z], i) => {
      o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
      o.position.set(x, 0.6, z); o.updateMatrix(); bus.current.setMatrixAt(i, o.matrix);
      o.position.set(x, 0.82, z); o.updateMatrix(); bw.current.setMatrixAt(i, o.matrix);
      o.position.set(x + 1.36, 0.8, z); o.updateMatrix(); scr.current.setMatrixAt(i, o.matrix);
      let k = 0;
      for (const ax of [0.9, -0.8]) for (const sz of [-1, 1]) { o.position.set(x + ax, 0.19, z + sz * 0.33); o.updateMatrix(); wheels.current.setMatrixAt(i * 4 + k++, o.matrix); }
      [-1, 1].forEach((sz, m) => {
        o.position.set(x + 1.3, 0.88, z + sz * 0.5); o.updateMatrix(); mir.current.setMatrixAt(i * 2 + m, o.matrix);
        o.position.set(x + 1.3, 0.97, z + sz * 0.43); o.updateMatrix(); arm.current.setMatrixAt(i * 2 + m, o.matrix);
      });
    });
    o.scale.set(1, 1, 1);
    lay.bk.forEach(([x, z], i) => { o.position.set(x, 0.15, z); o.rotation.set(0, Math.PI / 2, 0); o.updateMatrix(); bikes.current.setMatrixAt(i, o.matrix); });
    o.rotation.set(0, 0, 0);
    lay.cs.forEach(([x, z], i) => {
      c.set(palette[i % palette.length]);
      o.position.set(x, 0.255, z); o.updateMatrix(); cars.current.setMatrixAt(i, o.matrix); cars.current.setColorAt(i, c);
      o.position.set(x, 0.46, z); o.updateMatrix(); cabins.current.setMatrixAt(i, o.matrix);
      o.position.set(x, 0.55, z); o.updateMatrix(); roofs.current.setMatrixAt(i, o.matrix); roofs.current.setColorAt(i, c);
      let k = 0;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { o.position.set(x + sx * 0.2, 0.14, z + sz * 0.28); o.updateMatrix(); carWheels.current.setMatrixAt(i * 4 + k++, o.matrix); }
    });
    lay.ln.forEach(([x, z], i) => { o.position.set(x, 0.058, z); o.rotation.set(0, 0, 0); o.updateMatrix(); lines.current.setMatrixAt(i, o.matrix); });
    [bus, bw, wheels, mir, arm, scr, bikes, cars, cabins, roofs, carWheels, lines].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
    if (cars.current.instanceColor) cars.current.instanceColor.needsUpdate = true;
    if (roofs.current.instanceColor) roofs.current.instanceColor.needsUpdate = true;
  }, [lay]);
  const stallGeo = useMemo(() => new THREE.BoxGeometry(0.025, 0.01, 1.9), []);
  return (
    <group>
      {PARKING.map((p) => <mesh key={p.id} position={[p.x, 0.025, p.z]} material={slabMat} receiveShadow><boxGeometry args={[p.width, 0.05, p.depth]} /></mesh>)}
      <instancedMesh ref={bus} args={[busGeo, busMat, lay.buses.length]} castShadow />
      <instancedMesh ref={bw} args={[busWinGeo, winMat, lay.buses.length]} />
      <instancedMesh ref={scr} args={[screenGeo, winMat, lay.buses.length]} />
      <instancedMesh ref={wheels} args={[wheelGeo, tyreMat, lay.buses.length * 4]} castShadow />
      <instancedMesh ref={mir} args={[mirrorGeo, mirrorMat, lay.buses.length * 2]} castShadow />
      <instancedMesh ref={arm} args={[armGeo, mirrorMat, lay.buses.length * 2]} />
      <instancedMesh ref={bikes} args={[bikeGeo, winMat, lay.bk.length]} castShadow />
      <instancedMesh ref={cars} args={[carBodyGeo, carMat, lay.cs.length]} castShadow />
      <instancedMesh ref={cabins} args={[carCabinGeo, carGlassMat, lay.cs.length]} castShadow />
      <instancedMesh ref={roofs} args={[carRoofGeo, carMat, lay.cs.length]} castShadow />
      <instancedMesh ref={carWheels} args={[carWheelGeo, tyreMat, lay.cs.length * 4]} />
      <instancedMesh ref={lines} args={[stallGeo, lineMat, lay.ln.length]} />
    </group>
  );
}
