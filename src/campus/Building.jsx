import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { PALETTE, MODERN, STATUS_COLORS, buildingHeight } from './config';
import { facadeMaterial, roofMaterial, bayCount, boardTexture } from './textures';
import RooftopSolar from './RooftopSolar';

export const FACE_ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
export const M = {
  cream: mat(PALETTE.wall), parapet: mat(PALETTE.parapet), band: mat(PALETTE.band), olive: mat(PALETTE.pilaster),
  grey: mat(MODERN.grey), greyDark: mat(MODERN.greyDark), plaster: mat(MODERN.plaster), white: mat(MODERN.white),
  plinth: mat(PALETTE.plinth, { roughness: 0.95 }), dark: mat('#2a2220'), steel: mat('#6d737a', { metalness: 0.6, roughness: 0.5 }),
};

// trim colours per building style (corner posts, roof band, parapet)
const THEMES = {
  academic: { corner: M.olive, band: M.band, parapet: M.parapet },
  modern: { corner: M.grey, band: M.greyDark, parapet: M.grey },
};

/** Pointer + selection props shared by every campus structure. */
export function interactionProps(id, onSelect, onHover) {
  return {
    onClick: (e) => { e.stopPropagation(); onSelect?.(id); },
    onPointerOver: (e) => { e.stopPropagation(); onHover?.(id); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { onHover?.(null); document.body.style.cursor = 'auto'; },
  };
}

export function BuildingLabel({ cfg, y, status = 'normal', selected }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.normal;
  return (
    <Html position={[0, y, 0]} center distanceFactor={60} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{
        padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', font: '600 12px system-ui,sans-serif', color: '#fff',
        background: 'rgba(8,14,28,.85)', border: `1px solid ${color}`, boxShadow: selected ? `0 0 12px ${color}` : 'none',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: color, boxShadow: `0 0 6px ${color}` }} />
        {cfg.label}
        {(cfg.style === 'academic' || cfg.style === 'modern') && cfg.floors > 1 && <span style={{ opacity: 0.7, fontWeight: 500 }}>· {cfg.floors} floors</span>}
      </div>
    </Html>
  );
}

function Porch({ face, w, d }) {
  const toFace = face === 'n' || face === 's' ? d / 2 : w / 2;
  return (
    <group rotation={[0, FACE_ROT[face], 0]}>
      <group position={[0, 0, toFace]}>
        <mesh material={M.plinth} position={[0, 0.05, 0.38]} castShadow receiveShadow><boxGeometry args={[2.9, 0.1, 0.76]} /></mesh>
        <mesh material={M.plinth} position={[0, 0.15, 0.2]} castShadow receiveShadow><boxGeometry args={[2.5, 0.1, 0.4]} /></mesh>
        <mesh material={M.dark} position={[0, 0.58, 0.02]}><boxGeometry args={[1.3, 0.8, 0.04]} /></mesh>
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} material={M.olive} position={[x, 0.6, 0.95]} castShadow><boxGeometry args={[0.2, 0.9, 0.2]} /></mesh>
        ))}
        <mesh material={M.cream} position={[0, 1.1, 0.55]} castShadow receiveShadow><boxGeometry args={[3.2, 0.14, 1.15]} /></mesh>
      </group>
    </group>
  );
}

function RoofSign({ cfg, w, d, h }) {
  const s = cfg.roofSign, tex = useMemo(() => boardTexture(s.text, s.sub), [s.text, s.sub]);
  const toFace = s.face === 'n' || s.face === 's' ? d / 2 : w / 2;
  const frameMat = M.steel;
  return (
    <group position={[0, h, 0]} rotation={[0, FACE_ROT[s.face], 0]}>
      <group position={[0, 0, toFace - 1.3]}>
        {[-3, -1, 1, 3].map((x) => <mesh key={x} material={frameMat} position={[x, 0.9, -0.15]}><boxGeometry args={[0.07, 1.8, 0.07]} /></mesh>)}
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[6.4, 1.5, 0.1]} /><meshStandardMaterial map={tex} roughness={0.6} /></mesh>
        <mesh material={frameMat} position={[0, 0.95, -0.15]}><boxGeometry args={[6.2, 0.05, 0.05]} /></mesh>
      </group>
    </group>
  );
}

/**
 * Generic institutional block: cream walls, olive pilasters/bands, repeated dark
 * windows, flat roof + parapet, rooftop solar, entrance porch.
 */
export default function Building({ cfg, status = 'normal', selected = false, onSelect, onHover, showLabel = true, children }) {
  const { x, z, width: w, depth: d, floors } = cfg;
  const h = buildingHeight(cfg);
  const plain = cfg.style === 'auditorium' || cfg.style === 'lab';
  const theme = THEMES[cfg.style] ?? THEMES.academic;
  const variant = cfg.style === 'modern' ? 'modern' : plain ? 'plain' : 'academic';
  const flo = cfg.style === 'auditorium' ? 3 : cfg.style === 'lab' ? 2 : floors;

  const materials = useMemo(() => {
    const ex = facadeMaterial(bayCount(d), flo, variant);
    const ez = facadeMaterial(bayCount(w), flo, variant);
    return [ex, ex, roofMaterial, M.plinth, ez, ez]; // +x −x +y −y +z −z
  }, [w, d, flo, variant]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.1, h + 0.1, d + 0.1)), [w, h, d]);

  // rooftop equipment (+ keepouts for the solar array)
  const big = w > 10;
  const stair = { x: -w * 0.38, z: 0, w: 1.7, d: 1.1, h: 0.9 };
  const tank = { x: w * 0.36, z: d * 0.22, r: 0.38, h: 0.6 };
  const keepouts = useMemo(() => {
    const k = [{ x: stair.x, z: stair.z, w: stair.w + 0.5, d: stair.d + 0.5 }];
    if (big) k.push({ x: tank.x, z: tank.z, w: 1.1, d: 1.1 });
    if (cfg.roofKeepouts) k.push(...cfg.roofKeepouts);
    if (cfg.roofSign) {
      const toFace = cfg.roofSign.face === 'n' || cfg.roofSign.face === 's' ? d / 2 : w / 2;
      const sign = (toFace - 1.3) * (cfg.roofSign.face === 'n' ? -1 : 1);
      k.push({ x: 0, z: sign, w: 7, d: 2.4 });
    }
    return k;
  }, [w, d, big, cfg.roofSign, cfg.roofKeepouts]); // eslint-disable-line

  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <group position={[x, 0, z]} {...interactionProps(cfg.id, onSelect, onHover)}>
      <mesh position={[0, 0.11, 0]} material={M.plinth} castShadow receiveShadow><boxGeometry args={[w + 0.2, 0.22, d + 0.2]} /></mesh>
      <mesh position={[0, h / 2, 0]} material={materials} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
      {corners.map(([sx, sz], i) => (
        <mesh key={i} material={theme.corner} position={[sx * (w / 2), h / 2, sz * (d / 2)]} castShadow><boxGeometry args={[0.2, h, 0.2]} /></mesh>
      ))}
      <mesh material={theme.band} position={[0, h - 0.06, 0]} castShadow><boxGeometry args={[w + 0.12, 0.12, d + 0.12]} /></mesh>
      {/* parapet */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh material={theme.parapet} position={[0, h + 0.14, s * (d / 2 - 0.06)]} castShadow><boxGeometry args={[w, 0.28, 0.12]} /></mesh>
          <mesh material={theme.parapet} position={[s * (w / 2 - 0.06), h + 0.14, 0]} castShadow><boxGeometry args={[0.12, 0.28, d - 0.24]} /></mesh>
        </React.Fragment>
      ))}
      {/* rooftop equipment */}
      <mesh material={M.cream} position={[stair.x, h + stair.h / 2, stair.z]} castShadow><boxGeometry args={[stair.w, stair.h, stair.d]} /></mesh>
      {big && <mesh material={M.steel} position={[tank.x, h + tank.h / 2, tank.z]} castShadow><cylinderGeometry args={[tank.r, tank.r, tank.h, 14]} /></mesh>}
      {cfg.solar && (
        <RooftopSolar width={w} depth={d} position={[0, h, 0]} coverage={cfg.solar.coverage} tilt={cfg.solar.tilt} keepouts={keepouts} />
      )}
      {cfg.roofSign && <RoofSign cfg={cfg} w={w} d={d} h={h} />}
      {cfg.front && cfg.porch !== false && <Porch face={cfg.front} w={w} d={d} />}
      {children}
      {selected && <lineSegments geometry={edges} position={[0, h / 2, 0]}><lineBasicMaterial color="#22d3ee" /></lineSegments>}
      {showLabel && <BuildingLabel cfg={cfg} y={h + 2.4} status={status} selected={selected} />}
    </group>
  );
}
