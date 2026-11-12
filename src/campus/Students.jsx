/**
 * Students.jsx  –  Animated student figures: walkers, friend-groups & sports players.
 *
 * Uniform (from reference photos):
 *   Girls : white shirt + dark-brown chocolate vest + dark-grey trousers + cyan lanyard + ID card
 *   Boys  : cream/off-white full-sleeve shirt + dark-grey trousers + cyan lanyard + ID card
 *
 * Ground-contact fix
 * ──────────────────
 * All figure geometry is built with the shoe-sole at exactly Y = 0 in local space.
 * The figure root group is then placed at the actual surface Y so shoes sit flush.
 * Ground / road surface  → Y = 0.0
 * Court surface (slab)   → Y = 0.1  (slab top)
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  shirtWhite: '#f0ede4',
  shirtCream: '#e8e2cc',
  vest:       '#3b2a1a',
  trouser:    '#2a2420',
  lanyard:    '#00bcd4',
  idCard:     '#f5f0e8',
  skinM:      '#c68642',
  skinD:      '#8d5524',
  hair:       '#1a1008',
  shoe:       '#1c1a18',
};

// ─── shared materials (singleton) ────────────────────────────────────────────
const M = (() => {
  const s = (color, rough = 0.85, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
  return {
    shirtW:  s(C.shirtWhite),
    shirtC:  s(C.shirtCream),
    vest:    s(C.vest),
    trouser: s(C.trouser),
    lanyard: s(C.lanyard),
    id:      s(C.idCard),
    skinM:   s(C.skinM),
    skinD:   s(C.skinD),
    hair:    s(C.hair, 0.85, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    shoe:    s(C.shoe),
  };
})();

// ─── shared geometry (singleton) ─────────────────────────────────────────────
// All Y positions here put shoe-sole at Y = 0.
const SHOE_SOLE  = 0;        // bottom of shoe
const SHOE_H     = 0.05;
const LOWER_H    = 0.18;
const UPPER_H    = 0.20;
const BODY_H     = 0.30;
const HEAD_H     = 0.22;
const HAIR_H     = 0.07;
const HAIR_LIFT  = 0.012;   // lifts the hair cap above the head's top face -> no z-fighting (flicker)
const ARM_U_H    = 0.17;
const ARM_L_H    = 0.15;

// Key Y centres in local figure space (Y=0 = sole)
const SH_CY  = SHOE_SOLE  + SHOE_H  / 2;               // 0.025
const LL_CY  = SH_CY  + SHOE_H / 2  + LOWER_H / 2;    // 0.14
const UL_CY  = LL_CY  + LOWER_H / 2 + UPPER_H / 2;    // 0.33 → pivot at top = 0.43
const TOR_CY = UL_CY  + UPPER_H / 2 + BODY_H  / 2;    // 0.58
const SH_ATT = TOR_CY + BODY_H  / 2 - ARM_U_H * 0.1;  // shoulder pivot Y ≈ 0.85
const HE_CY  = TOR_CY + BODY_H  / 2 + HEAD_H  / 2;    // 0.98
const HA_CY  = HE_CY  + HEAD_H  / 2 - HAIR_H  / 2 + HAIR_LIFT; // 1.09 (+lift)

const G = {
  head:     new THREE.BoxGeometry(0.22, HEAD_H,  0.20),
  hair:     new THREE.BoxGeometry(0.235, HAIR_H, 0.215),
  body:     new THREE.BoxGeometry(0.22, BODY_H,  0.13),
  vest:     new THREE.BoxGeometry(0.23, BODY_H,  0.14),
  upperArm: new THREE.BoxGeometry(0.08, ARM_U_H, 0.08),
  lowerArm: new THREE.BoxGeometry(0.07, ARM_L_H, 0.07),
  upperLeg: new THREE.BoxGeometry(0.10, UPPER_H, 0.10),
  lowerLeg: new THREE.BoxGeometry(0.09, LOWER_H, 0.09),
  shoe:     new THREE.BoxGeometry(0.10, SHOE_H,  0.14),
  lanyard:  new THREE.BoxGeometry(0.015, 0.14,   0.015),
  idCard:   new THREE.BoxGeometry(0.07,  0.09,   0.015),
};

// ─── Inline figure with exposed limb refs ─────────────────────────────────────
// surfY = Y of the surface the figure stands on (pass as group position.y).
function Figure({ girl, dark, lArmR, rArmR, lLegR, rLegR }) {
  const skin   = dark ? M.skinD : M.skinM;
  const shirt  = girl ? M.shirtW : M.shirtC;

  return (
    <group>
      {/* shoes */}
      <mesh geometry={G.shoe} material={M.shoe} position={[-0.06, SH_CY,  0.02]} castShadow />
      <mesh geometry={G.shoe} material={M.shoe} position={[ 0.06, SH_CY,  0.02]} castShadow />

      {/* left leg */}
      <group ref={lLegR} position={[-0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} castShadow />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} castShadow />
      </group>
      {/* right leg */}
      <group ref={rLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} castShadow />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} castShadow />
      </group>

      {/* torso */}
      <mesh geometry={G.body} material={shirt}  position={[0, TOR_CY, 0]} castShadow />
      {girl && <mesh geometry={G.vest} material={M.vest} position={[0, TOR_CY, 0.005]} />}

      {/* lanyard + id */}
      <mesh geometry={G.lanyard} material={M.lanyard} position={[0, TOR_CY + 0.07, 0.07]} />
      <mesh geometry={G.idCard}  material={M.id}      position={[0, TOR_CY - 0.03, 0.075]} />

      {/* left arm */}
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={shirt} position={[0, -ARM_U_H / 2, 0]} castShadow />
        <mesh geometry={G.lowerArm} material={skin}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} castShadow />
      </group>
      {/* right arm */}
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={shirt} position={[0, -ARM_U_H / 2, 0]} castShadow />
        <mesh geometry={G.lowerArm} material={skin}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} castShadow />
      </group>

      {/* head + hair */}
      <mesh geometry={G.head} material={skin} position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
    </group>
  );
}

// ─── Walker ───────────────────────────────────────────────────────────────────
function Walker({ sx, sz, ex, ez, speed, phase, girl, dark, surfY = 0 }) {
  const root   = useRef();
  const lArmR  = useRef(), rArmR = useRef();
  const lLegR  = useRef(), rLegR = useRef();

  const dx = ex - sx, dz = ez - sz;
  const dist   = Math.sqrt(dx * dx + dz * dz);
  const angle  = Math.atan2(dx, dz);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * speed + phase) % 1;
    if (root.current) {
      root.current.position.set(sx + dx * t, surfY, sz + dz * t);
      root.current.rotation.y = angle;
    }
    const swing = Math.sin(clock.getElapsedTime() * speed * Math.PI * 2 * dist * 0.9) * 0.42;
    if (lArmR.current) lArmR.current.rotation.x =  swing;
    if (rArmR.current) rArmR.current.rotation.x = -swing;
    if (lLegR.current) lLegR.current.rotation.x = -swing;
    if (rLegR.current) rLegR.current.rotation.x =  swing;
  });

  return (
    <group ref={root}>
      <Figure girl={girl} dark={dark} lArmR={lArmR} rArmR={rArmR} lLegR={lLegR} rLegR={rLegR} />
    </group>
  );
}

// ─── Chatter member (standing, gentle sway + head nod) ───────────────────────
function ChatterMember({ ox, oz, faceY, girl, dark, phase, surfY = 0 }) {
  const root   = useRef();
  const headR  = useRef();
  const lArmR  = useRef(), rArmR = useRef();
  const lLegR  = useRef(), rLegR = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current)  root.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.025;
    if (headR.current) {
      headR.current.rotation.x = Math.sin(t * 1.1 + phase) * 0.08;
      headR.current.rotation.y = Math.sin(t * 0.7 + phase) * 0.14;
    }
    if (lArmR.current) lArmR.current.rotation.x = Math.sin(t * 1.3 + phase) * 0.20;
    if (rArmR.current) rArmR.current.rotation.x = Math.sin(t * 0.9 + phase + 0.5) * 0.16;
    // legs stay still (standing)
  });

  const skin  = dark ? M.skinD : M.skinM;
  const shirt = girl ? M.shirtW : M.shirtC;

  return (
    <group position={[ox, surfY, oz]} rotation={[0, faceY, 0]}>
      <group ref={root}>
        {/* shoes */}
        <mesh geometry={G.shoe} material={M.shoe} position={[-0.06, SH_CY, 0.02]} />
        <mesh geometry={G.shoe} material={M.shoe} position={[ 0.06, SH_CY, 0.02]} />
        {/* legs – static standing */}
        <mesh geometry={G.upperLeg} material={M.trouser} position={[-0.06, UL_CY, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[-0.06, LL_CY, 0]} />
        <mesh geometry={G.upperLeg} material={M.trouser} position={[ 0.06, UL_CY, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[ 0.06, LL_CY, 0]} />
        {/* torso */}
        <mesh geometry={G.body} material={shirt}  position={[0, TOR_CY, 0]} castShadow />
        {girl && <mesh geometry={G.vest} material={M.vest} position={[0, TOR_CY, 0.005]} />}
        <mesh geometry={G.lanyard} material={M.lanyard} position={[0, TOR_CY + 0.07, 0.07]} />
        <mesh geometry={G.idCard}  material={M.id}      position={[0, TOR_CY - 0.03, 0.075]} />
        {/* arms */}
        <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
          <mesh geometry={G.upperArm} material={shirt} position={[0, -ARM_U_H / 2, 0]} castShadow />
          <mesh geometry={G.lowerArm} material={skin}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} castShadow />
        </group>
        <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
          <mesh geometry={G.upperArm} material={shirt} position={[0, -ARM_U_H / 2, 0]} castShadow />
          <mesh geometry={G.lowerArm} material={skin}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} castShadow />
        </group>
        {/* head */}
        <group ref={headR}>
          <mesh geometry={G.head} material={skin}   position={[0, HE_CY, 0]} castShadow />
          <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
        </group>
      </group>
    </group>
  );
}

// ─── FriendGroup ─────────────────────────────────────────────────────────────
function FriendGroup({ cx, cz, surfY = 0, members }) {
  const n = members.length;
  return (
    <group position={[cx, 0, cz]}>
      {members.map((m, i) => {
        const a  = (i / n) * Math.PI * 2;
        const r  = 0.42 + n * 0.08;
        const ox = Math.sin(a) * r;
        const oz = Math.cos(a) * r;
        return (
          <ChatterMember
            key={i}
            ox={ox} oz={oz}
            faceY={Math.atan2(-ox, -oz)}
            girl={m.girl} dark={m.dark}
            phase={i * 1.3}
            surfY={surfY}
          />
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SPORTS PLAYERS
// ═══════════════════════════════════════════════════════════════════════════════
// Court slab top is at Y = 0.1 → players stand at surfY = 0.1

const COURT_Y = 0.1;

// ── Cricket: batsman + bowler + fielders ──────────────────────────────────────
// Cricket ground center: x=68, z=-37.5  (pitch runs N–S, length ≈5.5 u)
function CricketBatsman({ cx, cz }) {
  const root  = useRef();
  const rArmR = useRef(), lArmR = useRef();
  const rLegR = useRef(), lLegR = useRef();

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const sw = Math.sin(t * 2.0) * 0.5; // bat swing
    if (rArmR.current) rArmR.current.rotation.x = -0.6 + sw * 0.8;
    if (lArmR.current) lArmR.current.rotation.x = -0.5 + sw * 0.6;
    // slight body lean
    if (root.current) root.current.rotation.z = sw * 0.08;
  });

  return (
    <group position={[cx, COURT_Y, cz]} rotation={[0, Math.PI * 0.25, 0]}>
      <group ref={root}>
        <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
        <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
        <mesh geometry={G.upperLeg} material={M.trouser} position={[-0.06, UL_CY, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[-0.06, LL_CY, 0]} />
        <group ref={lLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
          <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
          <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
        </group>
        <mesh geometry={G.body}     material={M.shirtW}  position={[0, TOR_CY, 0]} castShadow />
        <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
          <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
          <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
        </group>
        <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
          <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
          <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
          {/* bat */}
          <mesh position={[0, -ARM_U_H - ARM_L_H - 0.18, 0.04]}>
            <boxGeometry args={[0.07, 0.36, 0.04]} />
            <meshStandardMaterial color="#c9a96e" roughness={0.7} />
          </mesh>
        </group>
        <mesh geometry={G.head} material={M.skinM} position={[0, HE_CY, 0]} castShadow />
        <mesh geometry={G.hair} material={M.hair}  position={[0, HA_CY, -0.01]} />
        {/* helmet dome */}
        <mesh position={[0, HE_CY + 0.085, 0]}>
          <sphereGeometry args={[0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a3a6b" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function CricketBowler({ cx, cz }) {
  const rArmR = useRef();
  const lLegR = useRef();

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const ph = (t * 1.4) % (Math.PI * 2);
    if (rArmR.current) rArmR.current.rotation.x = -Math.PI * 0.6 + Math.sin(ph) * Math.PI * 0.9;
    if (lLegR.current) lLegR.current.rotation.x =  Math.sin(ph + 1) * 0.5;
  });

  return (
    <group position={[cx, COURT_Y, cz]} rotation={[0, Math.PI, 0]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <mesh geometry={G.upperLeg} material={M.trouser} position={[-0.06, UL_CY, 0]} />
      <mesh geometry={G.lowerLeg} material={M.trouser} position={[-0.06, LL_CY, 0]} />
      <group ref={lLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <mesh geometry={G.body} material={M.shirtW} position={[0, TOR_CY, 0]} castShadow />
      {/* left arm static */}
      <group position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      {/* right arm bowling */}
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
        {/* ball */}
        <mesh position={[0, -ARM_U_H - ARM_L_H - 0.07, 0]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#c0392b" roughness={0.5} />
        </mesh>
      </group>
      <mesh geometry={G.head} material={M.skinD} position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair}  position={[0, HA_CY, -0.01]} />
    </group>
  );
}

function CricketFielder({ cx, cz, faceY, phase }) {
  const lArmR = useRef(), rArmR = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lArmR.current) lArmR.current.rotation.x = Math.sin(t * 0.7 + phase) * 0.12;
    if (rArmR.current) rArmR.current.rotation.x = Math.sin(t * 0.9 + phase) * 0.12;
  });
  const dark = phase % 2 > 1;
  const skin = dark ? M.skinD : M.skinM;
  return (
    <group position={[cx, COURT_Y, cz]} rotation={[0, faceY, 0]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <mesh geometry={G.upperLeg} material={M.trouser} position={[-0.06, UL_CY, 0]} />
      <mesh geometry={G.lowerLeg} material={M.trouser} position={[-0.06, LL_CY, 0]} />
      <mesh geometry={G.upperLeg} material={M.trouser} position={[ 0.06, UL_CY, 0]} />
      <mesh geometry={G.lowerLeg} material={M.trouser} position={[ 0.06, LL_CY, 0]} />
      <mesh geometry={G.body}     material={M.shirtW}  position={[0, TOR_CY, 0]} castShadow />
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <mesh geometry={G.head} material={skin}   position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
    </group>
  );
}

// ── Volleyball: 3v3, players jump and spike ───────────────────────────────────
// Court center: x=57.5, z=-5  inner 8×16
function VolleyballPlayer({ cx, cz, faceY, phase, dark }) {
  const root  = useRef();
  const rArmR = useRef(), lArmR = useRef();
  const lLegR = useRef(), rLegR = useRef();

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime();
    const jmp = Math.max(0, Math.sin((t * 1.1 + phase) * 2)) * 0.28; // jump height
    if (root.current) root.current.position.y = COURT_Y + jmp;
    const spike = Math.sin(t * 2.2 + phase) * 0.5;
    if (rArmR.current) rArmR.current.rotation.x = -1.2 + spike;
    if (lArmR.current) lArmR.current.rotation.x = -0.8 + spike * 0.6;
    const legSwing = jmp > 0.05 ? 0.3 : 0;
    if (lLegR.current) lLegR.current.rotation.x =  legSwing;
    if (rLegR.current) rLegR.current.rotation.x = -legSwing;
  });

  const skin  = dark ? M.skinD : M.skinM;
  const shirt = M.shirtW;

  return (
    <group ref={root} position={[cx, COURT_Y, cz]} rotation={[0, faceY, 0]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <group ref={lLegR} position={[-0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <group ref={rLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <mesh geometry={G.body} material={shirt} position={[0, TOR_CY, 0]} castShadow />
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={shirt}  position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}   position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={shirt}  position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}   position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <mesh geometry={G.head} material={skin}   position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
    </group>
  );
}

// moving volleyball
function Volleyball({ cx, cz }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.set(
        cx + Math.sin(t * 1.1) * 1.6,
        COURT_Y + 0.9 + Math.abs(Math.sin(t * 2.2)) * 1.0,
        cz + Math.cos(t * 0.8) * 2.5
      );
    }
  });
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.11, 10, 8]} />
      <meshStandardMaterial color="#f5e6c8" roughness={0.5} />
    </mesh>
  );
}

// ── Badminton: 2 players rally across the net ─────────────────────────────────
// Court center: x=69.6, z=-4.5  inner 5.6×12.3
function BadmintonPlayer({ cx, cz, faceY, phase, dark }) {
  const rArmR = useRef(), lArmR = useRef();
  const lLegR = useRef(), rLegR = useRef();

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime();
    const sw   = Math.sin(t * 2.5 + phase) * 0.6;
    const side = Math.sin(t * 1.0 + phase) * 0.3;
    if (rArmR.current) rArmR.current.rotation.x = -0.8 + sw;
    if (rArmR.current) rArmR.current.rotation.z = side * 0.3;
    if (lArmR.current) lArmR.current.rotation.x = -0.3 + sw * 0.3;
    if (lLegR.current) lLegR.current.rotation.x =  side * 0.4;
    if (rLegR.current) rLegR.current.rotation.x = -side * 0.4;
  });

  const skin = dark ? M.skinD : M.skinM;
  return (
    <group position={[cx, COURT_Y, cz]} rotation={[0, faceY, 0]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <group ref={lLegR} position={[-0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <group ref={rLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <mesh geometry={G.body} material={M.shirtW} position={[0, TOR_CY, 0]} castShadow />
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      {/* racket arm */}
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
        {/* racket */}
        <group position={[0, -ARM_U_H - ARM_L_H - 0.05, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[0.025, 0.24, 0.025]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <ellipseCurve /> {/* simplified as thin oval box */}
            <boxGeometry args={[0.16, 0.22, 0.012]} />
            <meshStandardMaterial color="#333" transparent opacity={0.75} roughness={0.4} wireframe />
          </mesh>
        </group>
      </group>
      <mesh geometry={G.head} material={skin}   position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
    </group>
  );
}

// shuttlecock
function Shuttlecock({ cx, cz }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.set(
        cx + Math.sin(t * 2.5) * 1.8,
        COURT_Y + 0.8 + Math.abs(Math.sin(t * 2.5)) * 1.4,
        cz + Math.cos(t * 2.5) * 3.5
      );
      ref.current.rotation.z = t * 4;
    }
  });
  return (
    <group ref={ref}>
      <mesh><sphereGeometry args={[0.04, 6, 5]} /><meshStandardMaterial color="#f5f0e8" /></mesh>
      <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.06, 0.14, 7, 1, true]} /><meshStandardMaterial color="#f5f5f5" transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

// ── Kabaddi: raider + defenders (dynamic lunge) ───────────────────────────────
// Court center: x=80.2, z=-3.9  inner 5.2×6.8
function KabaddiRaider({ cx, cz }) {
  const root  = useRef();
  const lLegR = useRef(), rLegR = useRef();
  const lArmR = useRef(), rArmR = useRef();

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime();
    const ph  = (t * 0.8) % (Math.PI * 2);
    // shuttle back and forth across mid-line
    if (root.current) {
      root.current.position.x = cx + Math.sin(ph) * 1.4;
      root.current.position.z = cz;
      root.current.rotation.y = Math.sin(ph) > 0 ? 0 : Math.PI;
    }
    const lunge = Math.abs(Math.sin(ph));
    if (lLegR.current) lLegR.current.rotation.x =  lunge * 0.7;
    if (rLegR.current) rLegR.current.rotation.x = -lunge * 0.5;
    if (lArmR.current) lArmR.current.rotation.x = -lunge * 0.6;
    if (rArmR.current) rArmR.current.rotation.x =  lunge * 0.4;
  });

  return (
    <group ref={root} position={[cx, COURT_Y, cz]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <group ref={lLegR} position={[-0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <group ref={rLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <mesh geometry={G.body} material={M.shirtW} position={[0, TOR_CY, 0]} castShadow />
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtW} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={M.skinM}  position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <mesh geometry={G.head} material={M.skinM} position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair}  position={[0, HA_CY, -0.01]} />
    </group>
  );
}

function KabaddiDefender({ cx, cz, faceY, phase }) {
  const lArmR = useRef(), rArmR = useRef();
  const lLegR = useRef(), rLegR = useRef();

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const cr = Math.sin(t * 1.8 + phase) * 0.3; // crouch-ready sway
    if (lArmR.current) lArmR.current.rotation.x =  0.4 + cr * 0.3;
    if (rArmR.current) rArmR.current.rotation.x =  0.4 - cr * 0.3;
    if (lLegR.current) lLegR.current.rotation.x =  cr * 0.25;
    if (rLegR.current) rLegR.current.rotation.x = -cr * 0.25;
  });

  const dark = phase % 3 > 1.5;
  const skin = dark ? M.skinD : M.skinM;

  return (
    <group position={[cx, COURT_Y, cz]} rotation={[0, faceY, 0]}>
      <mesh geometry={G.shoe}     material={M.shoe}    position={[-0.06, SH_CY, 0.02]} />
      <mesh geometry={G.shoe}     material={M.shoe}    position={[ 0.06, SH_CY, 0.02]} />
      <group ref={lLegR} position={[-0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <group ref={rLegR} position={[ 0.06, UL_CY + UPPER_H / 2, 0]}>
        <mesh geometry={G.upperLeg} material={M.trouser} position={[0, -UPPER_H / 2, 0]} />
        <mesh geometry={G.lowerLeg} material={M.trouser} position={[0, -UPPER_H - LOWER_H / 2, 0]} />
      </group>
      <mesh geometry={G.body} material={M.shirtC} position={[0, TOR_CY, 0]} castShadow />
      <group ref={lArmR} position={[-0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtC} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <group ref={rArmR} position={[ 0.16, SH_ATT, 0]}>
        <mesh geometry={G.upperArm} material={M.shirtC} position={[0, -ARM_U_H / 2, 0]} />
        <mesh geometry={G.lowerArm} material={skin}     position={[0, -ARM_U_H - ARM_L_H / 2, 0]} />
      </group>
      <mesh geometry={G.head} material={skin}   position={[0, HE_CY, 0]} castShadow />
      <mesh geometry={G.hair} material={M.hair} position={[0, HA_CY, -0.01]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Students() {

  // ── walkers ──────────────────────────────────────────────────────────────
  const walkers = useMemo(() => [
    // Main internal road (z ≈ 3.9)
    { sx: -28, sz: 3.5,  ex:  12, ez: 3.5,  speed: 0.055, phase: 0.00, girl: true,  dark: false },
    { sx:  12, sz: 4.3,  ex: -20, ez: 4.3,  speed: 0.048, phase: 0.00, girl: false, dark: true  },
    { sx:   5, sz: 3.9,  ex:  32, ez: 3.9,  speed: 0.062, phase: 0.30, girl: true,  dark: true  },
    { sx:  28, sz: 3.6,  ex:  -5, ez: 3.6,  speed: 0.044, phase: 0.60, girl: false, dark: false },
    { sx: -10, sz: 4.1,  ex:  18, ez: 4.1,  speed: 0.058, phase: 0.80, girl: true,  dark: false },
    { sx:  18, sz: 3.7,  ex: -15, ez: 3.7,  speed: 0.051, phase: 0.15, girl: true,  dark: true  },
    // Temple N–S path
    { sx: -0.8, sz: -14, ex: -0.8, ez: 2,   speed: 0.07,  phase: 0.0,  girl: true,  dark: false },
    { sx: -0.8, sz:  2,  ex: -0.8, ez: -14, speed: 0.065, phase: 0.5,  girl: false, dark: false },
    // A-block south
    { sx: -10,  sz: 20,  ex:  18,  ez: 20,  speed: 0.06,  phase: 0.2,  girl: true,  dark: true  },
    { sx:  18,  sz: 21,  ex:  -8,  ez: 21,  speed: 0.05,  phase: 0.7,  girl: false, dark: false },
    // Canteen ↔ open auditorium
    { sx: 18,  sz: -2,  ex: 18,   ez: -18, speed: 0.08,  phase: 0.0,  girl: false, dark: true  },
    { sx: 18,  sz: -18, ex: 18,   ez:  -2, speed: 0.07,  phase: 0.4,  girl: true,  dark: false },
    // Courts walk
    { sx: 50,  sz: 5.5, ex: 68,   ez: 5.5, speed: 0.055, phase: 0.1,  girl: false, dark: false },
    { sx: 68,  sz: 5.5, ex: 50,   ez: 5.5, speed: 0.06,  phase: 0.6,  girl: true,  dark: true  },
    // Admin area
    { sx: -26, sz: -6,  ex: -15,  ez: 3.9, speed: 0.07,  phase: 0.0,  girl: false, dark: false },
    { sx: -15, sz: 3.9, ex: -26,  ez: -6,  speed: 0.065, phase: 0.5,  girl: true,  dark: false },
  ], []);

  // ── friend groups ─────────────────────────────────────────────────────────
  const groups = useMemo(() => [
    { cx:  -5,   cz: 10.5, members: [{ girl:true,dark:false},{girl:true,dark:true},{girl:true,dark:false},{girl:false,dark:true}] },
    { cx:  12.5, cz:  2.0, members: [{ girl:false,dark:false},{girl:false,dark:true},{girl:true,dark:false}] },
    { cx:  14,   cz: -6.5, members: [{ girl:true,dark:true},{girl:true,dark:false},{girl:false,dark:false},{girl:false,dark:true},{girl:true,dark:false}] },
    { cx:  -8.1, cz: -6.0, members: [{ girl:true,dark:false},{girl:true,dark:true},{girl:false,dark:false}] },
    { cx:  25,   cz: 23,   members: [{ girl:false,dark:true},{girl:false,dark:false},{girl:true,dark:false},{girl:true,dark:true}] },
    { cx: -24,   cz:  1.5, members: [{ girl:true,dark:true},{girl:true,dark:false},{girl:false,dark:true}] },
    { cx: -10,   cz: -16,  members: [{ girl:true,dark:false},{girl:false,dark:false},{girl:true,dark:true},{girl:false,dark:true}] },
    { cx: -20,   cz: 44,   members: [{ girl:true,dark:false},{girl:true,dark:true},{girl:true,dark:false}] },
    { cx:  48,   cz: -4,   members: [{ girl:false,dark:false},{girl:true,dark:false},{girl:false,dark:true}] },
    { cx:  -5,   cz: 33,   members: [{ girl:false,dark:false},{girl:true,dark:true},{girl:false,dark:true}] },
  ], []);

  // ── cricket ground (x=68, z=-37.5) ──────────────────────────────────────
  // Fielder positions spread around the pitch
  const cricketFielders = useMemo(() => [
    { cx: 68+5, cz:-37.5+1,  faceY: Math.PI,         phase:0.0 },
    { cx: 68-5, cz:-37.5+1,  faceY: 0,                phase:1.0 },
    { cx: 68+8, cz:-37.5+6,  faceY: Math.PI*1.3,      phase:2.0 },
    { cx: 68-8, cz:-37.5+6,  faceY: Math.PI*0.7,      phase:0.5 },
    { cx: 68+8, cz:-37.5-6,  faceY: Math.PI*1.7,      phase:1.5 },
    { cx: 68-8, cz:-37.5-6,  faceY: Math.PI*0.3,      phase:2.5 },
    { cx: 68,   cz:-37.5+12, faceY: Math.PI,          phase:3.0 },
    { cx: 68,   cz:-37.5-12, faceY: 0,                phase:3.5 },
    { cx: 68+13,cz:-37.5,    faceY: Math.PI*1.5,      phase:1.2 },
  ], []);

  return (
    <group name="students">

      {/* ── walkers ── */}
      {walkers.map((w, i) => (
        <Walker key={`w${i}`} {...w} surfY={0} />
      ))}

      {/* ── friend groups ── */}
      {groups.map((g, i) => (
        <FriendGroup key={`fg${i}`} {...g} surfY={0} />
      ))}

      {/* ════════ SPORTS ════════ */}

      {/* ── Cricket (x=68, z=-37.5) ── */}
      <group name="cricket-players">
        {/* Batsman at the batting crease */}
        <CricketBatsman cx={68 + 0.0} cz={-37.5 + 2.5} />
        {/* Bowler running in from the other end */}
        <CricketBowler  cx={68 + 0.2} cz={-37.5 - 2.5} />
        {/* Wicketkeeper */}
        <CricketFielder cx={68 + 0.0} cz={-37.5 + 3.2} faceY={Math.PI} phase={4.0} />
        {/* 9 Fielders */}
        {cricketFielders.map((f, i) => <CricketFielder key={i} {...f} />)}
      </group>

      {/* ── Volleyball (x=57.5, z=-5, inner 8×16) ── */}
      <group name="volleyball-players">
        {/* Team A – left side of net (z < -5) */}
        <VolleyballPlayer cx={57.5-2.0} cz={-5-2.5} faceY={Math.PI*0.5}  phase={0.0} dark={false} />
        <VolleyballPlayer cx={57.5+0.0} cz={-5-3.5} faceY={0}            phase={1.1} dark={true}  />
        <VolleyballPlayer cx={57.5+2.0} cz={-5-2.0} faceY={Math.PI*1.5}  phase={2.2} dark={false} />
        {/* Team B – right side of net (z > -5) */}
        <VolleyballPlayer cx={57.5-2.0} cz={-5+2.5} faceY={Math.PI*1.5}  phase={0.5} dark={true}  />
        <VolleyballPlayer cx={57.5+0.0} cz={-5+3.5} faceY={Math.PI}      phase={1.6} dark={false} />
        <VolleyballPlayer cx={57.5+2.0} cz={-5+2.0} faceY={Math.PI*0.5}  phase={2.7} dark={true}  />
        <Volleyball cx={57.5} cz={-5} />
      </group>

      {/* ── Badminton (x=69.6, z=-4.5, inner 5.6×12.3) ── */}
      <group name="badminton-players">
        <BadmintonPlayer cx={69.6+0.5} cz={-4.5-3.5} faceY={Math.PI}   phase={0.0} dark={false} />
        <BadmintonPlayer cx={69.6-0.5} cz={-4.5+3.5} faceY={0}         phase={Math.PI} dark={true} />
        <Shuttlecock cx={69.6} cz={-4.5} />
      </group>

      {/* ── Kabaddi (x=80.2, z=-3.9, inner 5.2×6.8) ── */}
      <group name="kabaddi-players">
        <KabaddiRaider cx={80.2} cz={-3.9} />
        {/* 7 defenders spread on their half */}
        <KabaddiDefender cx={80.2-1.5} cz={-3.9+1.5} faceY={Math.PI*1.1} phase={0.0} />
        <KabaddiDefender cx={80.2+0.0} cz={-3.9+1.8} faceY={Math.PI}     phase={1.0} />
        <KabaddiDefender cx={80.2+1.5} cz={-3.9+1.5} faceY={Math.PI*0.9} phase={2.0} />
        <KabaddiDefender cx={80.2-1.8} cz={-3.9+0.5} faceY={Math.PI*1.3} phase={0.5} />
        <KabaddiDefender cx={80.2+1.8} cz={-3.9+0.5} faceY={Math.PI*0.7} phase={1.5} />
        <KabaddiDefender cx={80.2-1.0} cz={-3.9+2.8} faceY={Math.PI}     phase={2.5} />
        <KabaddiDefender cx={80.2+1.0} cz={-3.9+2.8} faceY={Math.PI}     phase={3.0} />
      </group>

    </group>
  );
}
