import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { solarMaterial } from './textures';

const geo = new THREE.BoxGeometry(1, 0.04, 1); // scaled per instance

/**
 * Rows of tilted solar modules on a flat roof (InstancedMesh → one draw call).
 * width/depth: roof area in X/Z. position: centre of the roof surface (local).
 * keepouts: [{x,z,w,d}] roof-local rectangles to leave clear (stair head, tank, sign…).
 * Panels face south (+Z), as they would in India.
 */
export default function RooftopSolar({
  width, depth, position = [0, 0, 0], margin = 0.8, tilt = 0.17, coverage = 1,
  keepouts = [], panelW = 0.95, panelD = 0.62, gapX = 0.16, gapZ = 0.44,
}) {
  const ref = useRef();
  const mats = useMemo(() => {
    const uw = width - 2 * margin, ud = depth - 2 * margin;
    const cols = Math.floor((uw + gapX) / (panelW + gapX));
    const pitch = panelD * Math.cos(tilt) + gapZ;
    const rows = Math.floor((ud + gapZ) / pitch);
    if (cols < 1 || rows < 1) return [];
    const used = Math.max(1, Math.ceil(rows * coverage));
    const out = [], d = new THREE.Object3D();
    const x0 = -((cols * (panelW + gapX) - gapX) / 2) + panelW / 2;
    const z0 = -((rows * pitch - gapZ) / 2) + (panelD * Math.cos(tilt)) / 2;
    for (let r = 0; r < used; r++) for (let c = 0; c < cols; c++) {
      const px = x0 + c * (panelW + gapX), pz = z0 + r * pitch;
      if (keepouts.some((k) => Math.abs(px - k.x) < k.w / 2 + panelW / 2 && Math.abs(pz - k.z) < k.d / 2 + panelD / 2)) continue;
      d.position.set(px, Math.sin(tilt) * panelD / 2 + 0.07, pz);
      d.rotation.set(tilt, 0, 0); d.scale.set(panelW, 1, panelD); d.updateMatrix();
      out.push(d.matrix.clone());
    }
    return out;
  }, [width, depth, margin, tilt, coverage, keepouts, panelW, panelD, gapX, gapZ]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    mats.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [mats]);

  if (!mats.length) return null;
  return (
    <group position={position}>
      <instancedMesh key={mats.length} ref={ref} args={[geo, solarMaterial(), mats.length]} castShadow receiveShadow />
    </group>
  );
}
export const countSolarPanels = (ref) => ref?.count ?? 0;
