import React, { useMemo } from 'react';
import * as THREE from 'three';
import Building, { M } from './Building';
import { BUILDINGS, buildingHeight } from './config';
import { shutterTexture, plateTexture } from './textures';

const glass = new THREE.MeshStandardMaterial({ color: '#22303d', roughness: 0.15, metalness: 0.6 });
const frameMat = new THREE.MeshStandardMaterial({ color: '#b9bd6c', roughness: 0.85 });

// Single-storey high-bay workshop: plain ivory walls, four roller-shutter bays + name plate on the
// south face, clerestory glazing, turbine ventilators and a chimney stack. Roof carries solar
// (via Building) with keep-outs for the vents (cfg.roofKeepouts).
export default function MechanicalLab(props) {
  const cfg = BUILDINGS.mechlab, { width: w, depth: d } = cfg, h = buildingHeight(cfg);
  const shutterMat = useMemo(() => new THREE.MeshStandardMaterial({ map: shutterTexture(), roughness: 0.55, metalness: 0.5 }), []);
  const plateMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plateTexture('MECHANICAL LAB'), roughness: 0.6 }), []);
  const doorW = 2.4, doorH = 1.3, doorY = 0.22 + doorH / 2;
  const doorXs = [-6.6, -2.2, 2.2, 6.6];
  const gy = 1.95, gh = 0.5; // clerestory glazing band
  return (
    <Building cfg={cfg} {...props}>
      {/* south face: roller-shutter bays and name plate */}
      {doorXs.map((x) => (
        <group key={x} position={[x, 0, d / 2]}>
          <mesh material={frameMat} position={[0, doorY + 0.03, 0.02]}><boxGeometry args={[doorW + 0.3, doorH + 0.12, 0.06]} /></mesh>
          <mesh material={shutterMat} position={[0, doorY - 0.01, 0.055]}><planeGeometry args={[doorW, doorH - 0.04]} /></mesh>
        </group>
      ))}
      <mesh material={plateMat} position={[0, 1.95, d / 2 + 0.03]}><planeGeometry args={[4.4, 0.55]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={glass} position={[s * 5.9, gy, d / 2 + 0.02]}><boxGeometry args={[6.6, gh, 0.04]} /></mesh>
      ))}
      {/* north and side clerestory glazing */}
      <mesh material={glass} position={[0, gy, -d / 2 - 0.02]}><boxGeometry args={[w - 2, gh, 0.04]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={glass} position={[s * (w / 2 + 0.02), gy, 0]}><boxGeometry args={[0.04, gh, d - 1.6]} /></mesh>
      ))}
      {/* roof equipment: turbine ventilators + chimney stack (positions match cfg.roofKeepouts) */}
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, h, -3]}>
          <mesh material={M.steel} position={[0, 0.11, 0]} castShadow><cylinderGeometry args={[0.14, 0.17, 0.22, 12]} /></mesh>
          <mesh material={M.steel} position={[0, 0.42, 0]} castShadow><sphereGeometry args={[0.22, 14, 10]} /></mesh>
        </group>
      ))}
      <mesh material={M.steel} position={[7.4, h + 0.9, -3]} castShadow><cylinderGeometry args={[0.14, 0.2, 1.8, 12]} /></mesh>
      <mesh material={M.dark} position={[7.4, h + 1.78, -3]}><cylinderGeometry args={[0.15, 0.15, 0.12, 12]} /></mesh>
    </Building>
  );
}
