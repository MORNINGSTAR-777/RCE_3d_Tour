import React from 'react';
import Building, { FACE_ROT, M } from './Building';
import { BUILDINGS, buildingHeight } from './config';

// Big windowless hall with a columned portico — clearly different from the classroom blocks.
export default function Auditorium(props) {
  const cfg = BUILDINGS.auditorium, h = buildingHeight(cfg);
  const face = cfg.front, faceLen = face === 'n' || face === 's' ? cfg.width : cfg.depth;
  const toFace = face === 'n' || face === 's' ? cfg.depth / 2 : cfg.width / 2;
  const span = faceLen * 0.62, colH = h * 0.8, n = 6;
  return (
    <Building cfg={cfg} {...props}>
      <group rotation={[0, FACE_ROT[face], 0]}>
        <group position={[0, 0, toFace]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={M.plinth} position={[0, 0.08 + i * 0.16, 1.6 - i * 0.4]} castShadow receiveShadow>
              <boxGeometry args={[span + 1.2 - i * 0.3, 0.16, 0.8 - i * 0.0]} />
            </mesh>
          ))}
          {Array.from({ length: n }, (_, i) => (
            <mesh key={i} material={M.cream} position={[-span / 2 + (i * span) / (n - 1), 0.45 + colH / 2, 2.0]} castShadow>
              <cylinderGeometry args={[0.24, 0.27, colH, 16]} />
            </mesh>
          ))}
          <mesh material={M.cream} position={[0, 0.45 + colH + 0.17, 1.2]} castShadow receiveShadow><boxGeometry args={[span + 1.4, 0.34, 2.9]} /></mesh>
          <mesh material={M.olive} position={[0, 0.45 + colH + 0.1, 2.67]}><boxGeometry args={[span + 1.45, 0.22, 0.06]} /></mesh>
          <mesh material={M.dark} position={[0, 1.2, 0.03]}><boxGeometry args={[Math.min(6, span * 0.5), 1.8, 0.05]} /></mesh>
        </group>
      </group>
    </Building>
  );
}
