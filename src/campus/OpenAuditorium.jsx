import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { BUILDINGS, STAGE } from './config';
import { BuildingLabel, interactionProps, M } from './Building';

const seatGeo = new THREE.BoxGeometry(1, 0.22, 0.32);
const seatMat = new THREE.MeshStandardMaterial({ color: '#8d8f93', roughness: 0.7 });

// Paved open-air hall with a low wall and a raised, roofed stage on its west side (per the 2D map).
export default function OpenAuditorium({ status, selected, onSelect, onHover, showLabel = true }) {
  const cfg = BUILDINGS.openAuditorium, { x, z, width: w, depth: d } = cfg;
  const rows = 10, seats = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < rows; i++) {
      o.position.set(STAGE.offsetX + STAGE.width / 2 + 1.6 + i * 0.95, 0.19, 0); o.rotation.set(0, Math.PI / 2, 0); o.scale.set(d * 0.7, 1, 1); o.updateMatrix();
      seats.current.setMatrixAt(i, o.matrix);
    }
    seats.current.instanceMatrix.needsUpdate = true;
  }, [d]);
  const sx = STAGE.offsetX;
  return (
    <group position={[x, 0, z]} {...interactionProps(cfg.id, onSelect, onHover)}>
      <mesh material={M.plinth} position={[0, 0.04, 0]} receiveShadow><boxGeometry args={[w, 0.08, d]} /></mesh>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh material={M.cream} position={[0, 0.3, s * d / 2]} castShadow><boxGeometry args={[w, 0.5, 0.15]} /></mesh>
          <mesh material={M.cream} position={[s * w / 2, 0.3, 0]} castShadow><boxGeometry args={[0.15, 0.5, d]} /></mesh>
        </React.Fragment>
      ))}
      <instancedMesh ref={seats} args={[seatGeo, seatMat, rows]} receiveShadow castShadow />
      {/* stage */}
      <mesh material={M.cream} position={[sx, STAGE.height / 2, 0]} castShadow receiveShadow><boxGeometry args={[STAGE.width, STAGE.height, STAGE.depth]} /></mesh>
      <mesh material={M.olive} position={[sx, STAGE.height, 0]}><boxGeometry args={[STAGE.width + 0.06, 0.06, STAGE.depth + 0.06]} /></mesh>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} material={M.olive} position={[sx + a * (STAGE.width / 2 - 0.12), STAGE.height + 1.0, b * (STAGE.depth / 2 - 0.12)]} castShadow><boxGeometry args={[0.18, 2.0, 0.18]} /></mesh>
      ))}
      <mesh material={M.parapet} position={[sx, STAGE.height + 2.08, 0]} castShadow><boxGeometry args={[STAGE.width + 0.3, 0.16, STAGE.depth + 0.3]} /></mesh>
      <mesh material={M.cream} position={[sx - STAGE.width / 2 + 0.08, STAGE.height + 1.0, 0]}><boxGeometry args={[0.05, 1.9, STAGE.depth - 0.3]} /></mesh>
      {selected && <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.4, 4, 1, Math.PI / 4]} /><meshBasicMaterial color="#22d3ee" /></mesh>}
      {showLabel && <BuildingLabel cfg={cfg} y={4.2} status={status} selected={selected} />}
    </group>
  );
}
