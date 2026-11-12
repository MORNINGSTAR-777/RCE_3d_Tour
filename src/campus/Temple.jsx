import React from 'react';
import * as THREE from 'three';
import { BUILDINGS, buildingHeight } from './config';
import { BuildingLabel, interactionProps, M } from './Building';

const ochre = new THREE.MeshStandardMaterial({ color: '#e8d9b0', roughness: 0.9 });
const kumkum = new THREE.MeshStandardMaterial({ color: '#b5472b', roughness: 0.8 });
const gold = new THREE.MeshStandardMaterial({ color: '#d7a62e', metalness: 0.8, roughness: 0.3 });

// Small shrine: plinth, sanctum with stepped shikhara, front mandapam.
export default function Temple({ status, selected, onSelect, onHover, showLabel = true }) {
  const cfg = BUILDINGS.temple, { x, z, width: w, depth: d } = cfg;
  return (
    <group position={[x, 0, z]} {...interactionProps(cfg.id, onSelect, onHover)}>
      <mesh material={M.plinth} position={[0, 0.1, 0]} receiveShadow castShadow><boxGeometry args={[w, 0.2, d]} /></mesh>
      {/* sanctum (rear) */}
      <mesh material={ochre} position={[0, 0.2 + 0.6, -0.5]} castShadow><boxGeometry args={[2.0, 1.2, 1.5]} /></mesh>
      <mesh material={kumkum} position={[0, 0.2 + 1.25, -0.5]} castShadow><boxGeometry args={[2.1, 0.12, 1.6]} /></mesh>
      {[1.5, 1.2, 0.9].map((s, i) => (
        <mesh key={i} material={i % 2 ? M.cream : ochre} position={[0, 1.55 + i * 0.4 + 0.2, -0.5]} castShadow><boxGeometry args={[s, 0.4, s]} /></mesh>
      ))}
      <mesh material={ochre} position={[0, 2.95, -0.5]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.55, 0.5, 4]} /></mesh>
      <mesh material={gold} position={[0, 3.3, -0.5]}><sphereGeometry args={[0.11, 12, 12]} /></mesh>
      {/* mandapam (front) */}
      <mesh material={M.cream} position={[0, 0.2 + 0.45, 0.65]} castShadow><boxGeometry args={[3.6, 0.9, 1.3]} /></mesh>
      <mesh material={kumkum} position={[0, 0.2 + 0.93, 0.65]}><boxGeometry args={[3.7, 0.08, 1.4]} /></mesh>
      <mesh material={M.dark} position={[0, 0.6, 1.31]}><boxGeometry args={[1.0, 0.65, 0.02]} /></mesh>
      {selected && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.8, 3.0, 40]} /><meshBasicMaterial color="#22d3ee" /></mesh>}
      {showLabel && <BuildingLabel cfg={cfg} y={buildingHeight(cfg) + 1.2} status={status} selected={selected} />}
    </group>
  );
}
