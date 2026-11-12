import React, { useMemo } from 'react';
import * as THREE from 'three';
import Building, { FACE_ROT, M } from './Building';
import { BUILDINGS, FLOOR_HEIGHT as FH } from './config';
import { slateMaterial, panelMaterial, curtainMaterial, grilleMaterial, lettersTexture } from './textures';

/**
 * Admin Block (RUDRA / RAMACHANDRA entrance). Four storeys.
 * Building supplies the walls, roof, solar and label; this adds the front facade, read left → right
 * (as seen from outside): plaster wing · grey pier · entrance bay · slate column · plaster bay · white-panel wing.
 *
 *   ground floor : slate piers either side of the glazed entrance, RAMACHANDRA panel above the doors
 *   canopy       : projecting grey slab at the top of the ground floor, RUDRA lettering, glass balcony on top
 *   upper floors : curtained windows, wide ones over the entrance, white sills
 */

// widths are fractions of the facade width, left → right
const BAYS = [
  { id: 'wing', kind: 'plaster', frac: 0.24, windows: 2 },
  { id: 'pier', kind: 'pier', frac: 0.12 },
  { id: 'entrance', kind: 'entrance', frac: 0.24 },
  { id: 'slate', kind: 'slate', frac: 0.11 },
  { id: 'side', kind: 'plaster', frac: 0.13, windows: 1 },
  { id: 'panels', kind: 'panels', frac: 0.16, windows: 1 },
];
const TONES = ['light', 'grey', 'light', 'glass']; // curtain / glass variation between windows

const SKIN = 0.05;          // wall-skin thickness on top of the building body
const PIER_DEPTH = 0.18;    // grey pier projects further than the skin
const CANOPY = { depth: 1.0, thick: 0.22, y: FH - 0.11 };
const WINDOW_H = 0.52;

const glassMat = new THREE.MeshStandardMaterial({ color: '#a9c8d4', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.3 });

/** Box from y0 to y1, `depth` out from the wall face, centred across on x. */
function Slab({ x, w, y0 = 0, y1, depth, material }) {
  return (
    <mesh material={material} position={[x, (y0 + y1) / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[w, y1 - y0, depth]} />
    </mesh>
  );
}

/** Framed window with curtain (or bare glass) and a white sill. */
function Window({ x, y, w, h = WINDOW_H, tone = 'light' }) {
  return (
    <group position={[x, y, SKIN]}>
      <mesh material={M.dark}><boxGeometry args={[w, h, 0.06]} /></mesh>
      <mesh material={curtainMaterial(tone, w)} position={[0, 0, 0.035]}><boxGeometry args={[w - 0.08, h - 0.08, 0.02]} /></mesh>
      <mesh material={M.white} position={[0, -h / 2 - 0.025, 0.06]} castShadow><boxGeometry args={[w + 0.16, 0.05, 0.16]} /></mesh>
    </group>
  );
}

/** Louvred ground-floor window. */
function GrilleWindow({ x, w }) {
  const h = 0.6;
  return (
    <mesh material={grilleMaterial(w, h)} position={[x, 0.55, SKIN + 0.02]}><boxGeometry args={[w, h, 0.05]} /></mesh>
  );
}

/** A bay's windows: one band per upper floor, plus grilles on the ground floor. */
function BayWindows({ bay, floors }) {
  const count = bay.windows ?? 0;
  const width = Math.min(1.0, (bay.w * 0.8) / count);
  const xs = Array.from({ length: count }, (_, i) => bay.x + (i - (count - 1) / 2) * (bay.w / count));
  const out = [];
  xs.forEach((x, i) => {
    if (bay.kind !== 'panels') out.push(<GrilleWindow key={`g${i}`} x={x} w={width} />);
    for (let f = 1; f < floors; f++) {
      out.push(<Window key={`w${i}-${f}`} x={x} y={f * FH + 0.55} w={width} tone={TONES[(i + f) % TONES.length]} />);
    }
  });
  return <>{out}</>;
}

/** Ground-floor entrance: glazed doors in a dark opening, RAMACHANDRA panel, two steps. */
function Entrance({ bay }) {
  const doorW = bay.w * 0.8;
  const sign = useMemo(() => lettersTexture('RAMACHANDRA', '#ece5d6', '#8b8475', 11), []);
  const mullions = [-1, -0.5, 0, 0.5, 1].map((k) => k * (doorW / 2));
  return (
    <group position={[bay.x, 0, 0]}>
      <Slab x={0} w={bay.w} y1={FH} depth={SKIN} material={M.plaster} />
      <mesh material={M.dark} position={[0, 0.34, SKIN + 0.01]}><boxGeometry args={[doorW, 0.68, 0.04]} /></mesh>
      <mesh material={glassMat} position={[0, 0.34, SKIN + 0.07]}><boxGeometry args={[doorW, 0.68, 0.02]} /></mesh>
      {mullions.map((mx) => <mesh key={mx} material={M.greyDark} position={[mx, 0.34, SKIN + 0.08]}><boxGeometry args={[0.04, 0.7, 0.04]} /></mesh>)}
      <mesh material={M.greyDark} position={[0, 0.69, SKIN + 0.08]}><boxGeometry args={[doorW + 0.04, 0.04, 0.05]} /></mesh>
      <mesh position={[0, 0.8, SKIN + 0.015]}><planeGeometry args={[bay.w, 0.2]} /><meshStandardMaterial map={sign} roughness={0.6} /></mesh>
      {/* steps (z grows outward) */}
      <mesh material={M.plinth} position={[0, 0.06, 0.55]} receiveShadow><boxGeometry args={[bay.w * 0.95, 0.12, 1.0]} /></mesh>
      <mesh material={M.plinth} position={[0, 0.03, 0.9]} receiveShadow><boxGeometry args={[bay.w * 1.05, 0.06, 0.7]} /></mesh>
    </group>
  );
}

/** Projecting grey canopy over pier + entrance + slate column, with RUDRA lettering and a glass balcony rail. */
function Canopy({ x0, x1 }) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  const sign = useMemo(() => lettersTexture('RUDRA', '#8f949b', '#f6f6f4', 7), []);
  const top = CANOPY.y + CANOPY.thick / 2, railH = 0.38;
  return (
    <group position={[cx, 0, 0]}>
      <mesh material={M.grey} position={[0, CANOPY.y, CANOPY.depth / 2]} castShadow receiveShadow><boxGeometry args={[w, CANOPY.thick, CANOPY.depth]} /></mesh>
      <mesh position={[0, CANOPY.y, CANOPY.depth + 0.002]}><planeGeometry args={[1.5, 0.17]} /><meshStandardMaterial map={sign} roughness={0.5} /></mesh>
      <mesh material={glassMat} position={[0, top + railH / 2, CANOPY.depth - 0.04]}><boxGeometry args={[w - 0.1, railH, 0.02]} /></mesh>
      <mesh material={M.steel} position={[0, top + railH, CANOPY.depth - 0.04]}><boxGeometry args={[w - 0.1, 0.03, 0.04]} /></mesh>
      {[-0.5, -0.25, 0, 0.25, 0.5].map((k) => (
        <mesh key={k} material={M.steel} position={[k * (w - 0.12), top + railH / 2, CANOPY.depth - 0.04]}><boxGeometry args={[0.03, railH, 0.04]} /></mesh>
      ))}
    </group>
  );
}

function RudraFacade({ cfg }) {
  const { width: w, depth: d, floors, front } = cfg;
  const alongX = front === 'n' || front === 's';
  const W = alongX ? w : d, H = floors * FH;
  const toFace = alongX ? d / 2 : w / 2;

  const bays = useMemo(() => {
    let cursor = -W / 2;
    return BAYS.map((b) => { const bw = b.frac * W, bay = { ...b, w: bw, x: cursor + bw / 2 }; cursor += bw; return bay; });
  }, [W]);
  const by = Object.fromEntries(bays.map((b) => [b.id, b]));

  return (
    <group rotation={[0, FACE_ROT[front], 0]}>
      <group position={[0, 0, toFace]}>
        {bays.map((bay) => {
          switch (bay.kind) {
            case 'plaster':
              return <Slab key={bay.id} x={bay.x} w={bay.w} y1={H} depth={SKIN} material={M.plaster} />;
            case 'panels':
              return <Slab key={bay.id} x={bay.x} w={bay.w} y1={H} depth={SKIN} material={panelMaterial(bay.w, H)} />;
            case 'slate':
              return <Slab key={bay.id} x={bay.x} w={bay.w} y1={H} depth={SKIN + 0.04} material={slateMaterial(bay.w, H)} />;
            case 'pier': // slate on the ground floor, wide grey pier above
              return (
                <React.Fragment key={bay.id}>
                  <Slab x={bay.x} w={bay.w} y1={FH} depth={SKIN + 0.04} material={slateMaterial(bay.w, FH)} />
                  <Slab x={bay.x} w={bay.w} y0={FH} y1={H} depth={PIER_DEPTH} material={M.grey} />
                </React.Fragment>
              );
            case 'entrance':
              return (
                <React.Fragment key={bay.id}>
                  <Entrance bay={bay} />
                  {/* wide curtained windows on every floor above the canopy */}
                  <Slab x={bay.x} w={bay.w} y0={FH} y1={H} depth={SKIN} material={M.plaster} />
                  {Array.from({ length: floors - 1 }, (_, i) => i + 1).map((f) => (
                    <Window key={f} x={bay.x} y={f * FH + 0.58} w={bay.w * 0.9} h={0.66} tone={f % 2 ? 'grey' : 'light'} />
                  ))}
                </React.Fragment>
              );
            default: return null;
          }
        })}
        {bays.filter((b) => b.windows).map((b) => <BayWindows key={b.id} bay={b} floors={floors} />)}
        <Canopy x0={by.pier.x - by.pier.w / 2} x1={by.slate.x + by.slate.w / 2} />
      </group>
    </group>
  );
}

export default function AdminBlock(props) {
  const cfg = BUILDINGS.admin;
  return <Building cfg={cfg} {...props}><RudraFacade cfg={cfg} /></Building>;
}
