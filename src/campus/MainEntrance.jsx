import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ENTRANCE } from './config';
import { pillarTexture, dentilTexture, latticeTexture, signTextures } from './textures';

const cream = new THREE.MeshStandardMaterial({ color: '#eee4c2', roughness: 0.9 });
const black = new THREE.MeshStandardMaterial({ color: '#0d0d10', roughness: 0.45, metalness: 0.7 });

function Pillar({ x }) {
  const tile = useMemo(() => { const t = pillarTexture().clone(); t.repeat.set(1, 4); t.needsUpdate = true; return t; }, []);
  const dent = useMemo(() => { const t = dentilTexture().clone(); t.repeat.set(3, 1); t.needsUpdate = true; return t; }, []);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.07, 0]} material={cream} castShadow><boxGeometry args={[1.0, 0.14, 1.0]} /></mesh>
      <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[0.8, 1.9, 0.8]} /><meshStandardMaterial map={tile} roughness={0.8} /></mesh>
      <mesh position={[0, 2.14, 0]} castShadow><boxGeometry args={[1.1, 0.32, 1.1]} /><meshStandardMaterial map={dent} roughness={0.85} /></mesh>
      <mesh position={[0, 2.36, 0]} material={cream} castShadow><boxGeometry args={[1.22, 0.12, 1.22]} /></mesh>
      <mesh position={[0, 2.46, 0]} material={cream} castShadow><boxGeometry args={[1.0, 0.1, 1.0]} /></mesh>
    </group>
  );
}

function Gate({ span }) {
  const bars = useRef();
  const N = Math.round(span / 0.1);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const u = (i / (N - 1)) * 2 - 1; // -1..1
      const H = 1.25 + 0.55 * (1 - u * u);
      o.position.set(u * span / 2, H / 2 + 0.1, 0); o.scale.set(1, H, 1); o.updateMatrix();
      bars.current.setMatrixAt(i, o.matrix);
    }
    bars.current.instanceMatrix.needsUpdate = true;
  }, [N, span]);
  const lat = useMemo(() => { const t = latticeTexture().clone(); t.repeat.set(span / 0.5, 1.5); t.needsUpdate = true; return t; }, [span]);
  return (
    <group>
      <instancedMesh ref={bars} args={[undefined, black, N]} castShadow>
        <boxGeometry args={[0.03, 1, 0.03]} />
      </instancedMesh>
      <mesh material={black} position={[0, 0.12, 0]}><boxGeometry args={[span, 0.06, 0.06]} /></mesh>
      <mesh material={black} position={[0, 0.9, 0]}><boxGeometry args={[span, 0.05, 0.05]} /></mesh>
      <mesh position={[0, 0.5, 0]}><planeGeometry args={[span, 0.75]} /><meshStandardMaterial map={lat} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.5} metalness={0.6} /></mesh>
      <mesh material={black} position={[0, 0.7, 0]}><boxGeometry args={[0.06, 1.3, 0.06]} /></mesh>
    </group>
  );
}

// Two olive/cream pillars, dentil-cornice beam, navy panel with raised gold RAMACHANDRA (showSign={false} leaves the beam plain), black arched gates.
export default function MainEntrance({ position = [ENTRANCE.x, 0, ENTRANCE.z], rotationY = ENTRANCE.rotationY, halfSpan = ENTRANCE.halfSpan, scale = ENTRANCE.scale ?? 1, showSign = true }) {
  const s = halfSpan;
  const sign = useMemo(() => (showSign ? signTextures('RAMACHANDRA') : null), [showSign]);
  const dent = useMemo(() => { const t = dentilTexture().clone(); t.repeat.set(10, 1); t.needsUpdate = true; return t; }, []);
  const signW = 2 * s - 0.7;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <Pillar x={-s} /><Pillar x={s} />
      <mesh position={[0, 2.8, 0]} castShadow><boxGeometry args={[2 * s + 1.1, 0.6, 0.62]} /><meshStandardMaterial map={dent} roughness={0.85} /></mesh>
      <mesh position={[0, 3.14, 0]} material={cream} castShadow><boxGeometry args={[2 * s + 1.3, 0.1, 0.74]} /></mesh>
      {showSign && [1, -1].map((f) => (
        <group key={f} rotation={[0, f === 1 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 2.8, 0.32]}><boxGeometry args={[signW + 0.1, 0.46, 0.04]} /><meshStandardMaterial color="#0f1c36" roughness={0.5} /></mesh>
          <mesh position={[0, 2.8, 0.345]}><planeGeometry args={[signW, 0.4]} /><meshStandardMaterial map={sign.map} bumpMap={sign.bump} bumpScale={4} roughness={0.35} metalness={0.4} /></mesh>
        </group>
      ))}
      <mesh position={[0, 3.45, 0]} material={black}><cylinderGeometry args={[0.025, 0.025, 0.6, 8]} /></mesh>
      <mesh position={[0, 3.8, 0]} material={black}><boxGeometry args={[0.28, 0.2, 0.06]} /></mesh>
      <group position={[0, 0, 0]}><Gate span={2 * s - 0.9} /></group>
    </group>
  );
}
