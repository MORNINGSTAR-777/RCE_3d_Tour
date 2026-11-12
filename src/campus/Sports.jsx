import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BUILDINGS } from './config';
import { BuildingLabel, interactionProps } from './Building';

const TAU = Math.PI * 2;
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
const toTexture = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const hit = { cyan: '#22d3ee' };

// ─────────────────────────────── Cricket ground ───────────────────────────────
// Turf only: mown stripes, 30-yard circle, painted boundary line. NO wall – the edge is marked by coloured flags.
function cricketTexture(R) {
  const S = 1024, h = S / 2, c = canvasOf(S, S), g = c.getContext('2d'), circle = (r) => { g.beginPath(); g.arc(h, h, r, 0, TAU); };
  for (let i = 18; i > 0; i--) { g.fillStyle = i % 2 ? '#4d9a3a' : '#5ca846'; circle((h * i) / 18); g.fill(); }
  for (let i = 0; i < 5000; i++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * h;
    g.fillStyle = `hsla(${90 + Math.random() * 25},45%,${28 + Math.random() * 18}%,.25)`; g.fillRect(h + Math.cos(a) * r, h + Math.sin(a) * r, 2, 3);
  }
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([14, 12]); circle((h * 7.4) / R); g.stroke(); g.setLineDash([]); // 30-yard circle
  g.strokeStyle = '#fff'; g.lineWidth = 6; circle(h - 4); g.stroke();                                                                      // boundary line
  return toTexture(c);
}

const FLAG_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#00acc1'];
const POLE_H = 1.25, FLAG_H = 0.44;
const poleGeo = new THREE.CylinderGeometry(0.025, 0.03, POLE_H, 6).translate(0, POLE_H / 2, 0);
const flagGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.75, FLAG_H / 2); s.lineTo(0, FLAG_H); s.closePath(); return new THREE.ShapeGeometry(s); })();
const poleMat = new THREE.MeshStandardMaterial({ color: '#f1f1f1', roughness: 0.6 });
const flagMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide });

/** A ring of poles with multi-coloured pennants that flutter in the wind. */
function BoundaryFlags({ R, count = 96 }) {
  const poles = useRef(), flags = useRef();
  const pts = useMemo(() => Array.from({ length: count }, (_, i) => { const a = (i / count) * TAU; return { x: Math.cos(a) * (R - 0.15), z: Math.sin(a) * (R - 0.15), a }; }), [R, count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    pts.forEach((p, i) => {
      dummy.position.set(p.x, 0.03, p.z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); poles.current.setMatrixAt(i, dummy.matrix);
      flags.current.setColorAt(i, c.set(FLAG_COLORS[i % FLAG_COLORS.length]));
    });
    poles.current.instanceMatrix.needsUpdate = true; flags.current.instanceColor.needsUpdate = true;
  }, [pts, dummy]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    pts.forEach((p, i) => {
      dummy.position.set(p.x, 0.03 + POLE_H - FLAG_H - 0.03, p.z);
      dummy.rotation.set(0, Math.sin(t * 2.4 + i * 0.9) * 0.4 - 0.15, Math.sin(t * 3.1 + i * 1.7) * 0.06);
      dummy.updateMatrix(); flags.current.setMatrixAt(i, dummy.matrix);
    });
    flags.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={poles} args={[poleGeo, poleMat, count]} />
      <instancedMesh ref={flags} args={[flagGeo, flagMat, count]} frustumCulled={false} />
    </group>
  );
}

const pitchMat = new THREE.MeshStandardMaterial({ color: '#cdb98a', roughness: 1 });
const creaseMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const stumpMat = new THREE.MeshStandardMaterial({ color: '#f3e6c2', roughness: 0.6 });
const stumpGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6).translate(0, 0.12, 0);

function Pitch() {
  const L = 5.5, W = 0.9; // 22 yards × 10 ft at 3.7 m / unit
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.04, 0]} material={pitchMat} receiveShadow><boxGeometry args={[W, 0.02, L]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0.05, s * (L / 2 - 0.3)]}>
          <mesh material={creaseMat} position={[0, 0.006, 0]}><boxGeometry args={[W * 0.95, 0.01, 0.025]} /></mesh>
          <mesh material={creaseMat} position={[0, 0.006, -s * 0.33]}><boxGeometry args={[1.0, 0.01, 0.025]} /></mesh>
          {[-0.03, 0, 0.03].map((x) => <mesh key={x} geometry={stumpGeo} material={stumpMat} position={[x, 0, s * 0.3]} castShadow />)}
        </group>
      ))}
    </group>
  );
}

export function CricketGround({ status, selected, onSelect, onHover, showLabel = true }) {
  const cfg = BUILDINGS.cricket, R = cfg.width / 2;
  const tex = useMemo(() => cricketTexture(R), [R]);
  return (
    <group position={[cfg.x, 0, cfg.z]} {...interactionProps(cfg.id, onSelect, onHover)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[R, 96]} /><meshStandardMaterial map={tex} roughness={1} /></mesh>
      <Pitch />
      <BoundaryFlags R={R} />
      {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}><ringGeometry args={[R + 1.0, R + 1.3, 96]} /><meshBasicMaterial color={hit.cyan} /></mesh>}
      {showLabel && <BuildingLabel cfg={cfg} y={3.5} status={status} selected={selected} />}
    </group>
  );
}

// ─────────────────────────────────── Courts ───────────────────────────────────
// Slab plan: x = court width, z = court length (long axis N–S, as drawn on the map). Markings use real proportions.
const PPU = 48;
const SPEC = {
  volleyball: { surround: '#2f67a6', floor: '#d9743f', inner: [8, 16] },     // 9 m × 18 m
  badminton:  { surround: '#1f6b45', floor: '#3a9a63', inner: [5.6, 12.3] }, // 6.1 m × 13.4 m (doubles)
  kabaddi:    { surround: '#8d4a2f', floor: '#e6b04c', inner: [5.2, 6.8] },  // 10 m × 13 m
};
function courtTexture(kind, w, d) {
  const { surround, floor, inner: [iw, ih] } = SPEC[kind];
  const c = canvasOf(w * PPU, d * PPU), g = c.getContext('2d');
  g.fillStyle = surround; g.fillRect(0, 0, c.width, c.height);
  const W = iw * PPU, H = ih * PPU, x0 = (c.width - W) / 2, y0 = (c.height - H) / 2, cy = y0 + H / 2, x1 = x0 + W, y1 = y0 + H;
  g.fillStyle = floor; g.fillRect(x0, y0, W, H);
  g.strokeStyle = '#fff'; g.lineWidth = 3;
  const ln = (a, b, e, f) => { g.beginPath(); g.moveTo(a, b); g.lineTo(e, f); g.stroke(); };
  g.strokeRect(x0, y0, W, H);
  if (kind === 'volleyball') {
    ln(x0, cy, x1, cy);                                              // centre line under the net
    [-1, 1].forEach((s) => ln(x0, cy + (s * H) / 6, x1, cy + (s * H) / 6)); // attack lines, 3 m from the net
  } else if (kind === 'badminton') {
    const m = W / 6.1;
    ln(x0 + 0.46 * m, y0, x0 + 0.46 * m, y1); ln(x1 - 0.46 * m, y0, x1 - 0.46 * m, y1);       // singles side lines
    [y0 + 0.76 * m, y1 - 0.76 * m].forEach((y) => ln(x0, y, x1, y));                           // doubles long-service lines
    [-1, 1].forEach((s) => ln(x0, cy + s * 1.98 * m, x1, cy + s * 1.98 * m));                  // short-service lines
    ln(x0 + W / 2, y0, x0 + W / 2, cy - 1.98 * m); ln(x0 + W / 2, cy + 1.98 * m, x0 + W / 2, y1); // centre lines
    ln(x0, cy, x1, cy);
  } else {
    const m = H / 13;
    ln(x0, cy, x1, cy);                                                                         // mid line
    [-1, 1].forEach((s) => { ln(x0, cy + s * 3.75 * m, x1, cy + s * 3.75 * m); ln(x0, cy + s * 4.75 * m, x1, cy + s * 4.75 * m); }); // baulk + bonus lines
    ln(x0 + m, y0, x0 + m, y1); ln(x1 - m, y0, x1 - m, y1);                                     // lobby lines
  }
  return toTexture(c);
}

const slabSide = new THREE.MeshStandardMaterial({ color: '#4b4f55', roughness: 1 });
const postMat = new THREE.MeshStandardMaterial({ color: '#8d949c', metalness: 0.6, roughness: 0.4 });
const netMat = new THREE.MeshBasicMaterial({ color: '#101215', transparent: true, opacity: 0.5, side: THREE.DoubleSide });
const tapeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

function Net({ span, height }) {
  const nh = height * 0.4;
  return (
    <group position={[0, 0.1, 0]}>
      {[-1, 1].map((s) => <mesh key={s} material={postMat} position={[s * (span / 2 + 0.12), height / 2, 0]} castShadow><cylinderGeometry args={[0.04, 0.045, height, 8]} /></mesh>)}
      <mesh material={netMat} position={[0, height - nh / 2, 0]}><planeGeometry args={[span + 0.2, nh]} /></mesh>
      <mesh material={tapeMat} position={[0, height, 0]}><boxGeometry args={[span + 0.2, 0.035, 0.02]} /></mesh>
    </group>
  );
}

function Court({ id, kind, status, selected, onSelect, onHover, showLabel = true }) {
  const cfg = BUILDINGS[id], { width: w, depth: d } = cfg;
  const mats = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({ map: courtTexture(kind, w, d), roughness: 0.85 });
    return [slabSide, slabSide, top, slabSide, slabSide, slabSide]; // +x −x +y −y +z −z
  }, [kind, w, d]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2)), [w, d]);
  return (
    <group position={[cfg.x, 0, cfg.z]} {...interactionProps(id, onSelect, onHover)}>
      <mesh position={[0, 0.05, 0]} material={mats} receiveShadow castShadow><boxGeometry args={[w, 0.1, d]} /></mesh>
      {kind === 'volleyball' && <Net span={SPEC.volleyball.inner[0]} height={0.66} />}
      {kind === 'badminton' && <Net span={SPEC.badminton.inner[0]} height={0.42} />}
      {selected && <lineSegments geometry={edges} position={[0, 0.15, 0]}><lineBasicMaterial color={hit.cyan} /></lineSegments>}
      {showLabel && <BuildingLabel cfg={cfg} y={2.2} status={status} selected={selected} />}
    </group>
  );
}

export const VolleyballCourt = (p) => <Court id="volleyball" kind="volleyball" {...p} />;
export const BadmintonCourt = (p) => <Court id="badminton" kind="badminton" {...p} />;
export const KabaddiCourt = (p) => <Court id="kabaddi" kind="kabaddi" {...p} />;
