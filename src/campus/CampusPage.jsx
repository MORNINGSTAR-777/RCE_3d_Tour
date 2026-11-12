import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import CampusModel from './CampusModel';
import { BUILDINGS, TOUR_ORDER, HOME_POS, HOME_TARGET, buildingHeight } from './config';
import { BLOCK_DETAILS } from './blockDetails';

const DESC = {
  admin: 'Administrative offices – four storeys, slate-stone entrance under the RUDRA canopy', a: 'Sarvesta – academic block with rooftop signage', b: 'Vidhra – academic block', c: 'Shastra – academic block (north)',
  temple: 'Campus shrine', canteen: 'Food court', openAuditorium: 'Open-air hall with stage', auditorium: 'Main auditorium',
  girls: "Girls' residence", boys: "Boys' residence", mechlab: 'Mechanical engineering workshop and laboratory',
  cricket: 'Turf outfield with centre pitch – edge marked only by coloured boundary flags (no wall)',
  volleyball: 'Volleyball court with net', badminton: 'Badminton court with net', kabaddi: 'Kabaddi court with mid, baulk and bonus lines',
};
const css = `
.rc-root{position:fixed;inset:0;background:#0b1220;color:#e6edf7;font-family:'Segoe UI',system-ui,sans-serif;overflow:hidden}
.rc-head{position:absolute;top:0;left:0;right:0;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;z-index:5;
 background:linear-gradient(180deg,rgba(8,14,28,.92),rgba(8,14,28,.55));border-bottom:1px solid rgba(212,167,58,.35);backdrop-filter:blur(6px)}
.rc-head h1{margin:0;font-size:18px;letter-spacing:.12em;font-weight:700;color:#f2d37a}
.rc-head small{display:block;font-size:11px;letter-spacing:.18em;color:#9fb0c8;margin-top:2px}
.rc-hdr-btns{display:flex;gap:8px;align-items:center}
.rc-btn{background:rgba(212,167,58,.14);border:1px solid rgba(212,167,58,.6);color:#f2d37a;padding:7px 12px;border-radius:6px;font-weight:600;cursor:pointer;letter-spacing:.04em;font-size:12px;white-space:nowrap;transition:all .15s ease}
.rc-btn:hover{background:rgba(212,167,58,.28)}
.rc-btn.off{opacity:.55;border-color:rgba(255,255,255,.2);color:#9fb0c8;background:rgba(255,255,255,.05)}
.rc-card{position:absolute;z-index:5;background:rgba(10,18,34,.82);border:1px solid rgba(255,255,255,.12);border-radius:10px;backdrop-filter:blur(8px);box-shadow:0 8px 30px rgba(0,0,0,.4)}
.rc-info h3{margin:0 0 8px;font-size:11px;letter-spacing:.18em;color:#9fb0c8;font-weight:600}
.rc-info{top:80px;right:18px;width:320px;padding:16px;max-height:calc(100vh - 80px - 86px);overflow-y:auto;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.25) transparent}
.rc-info::-webkit-scrollbar{width:5px}
.rc-info::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:3px}
.rc-sec{margin:12px 0 4px;font-size:10.5px;letter-spacing:.18em;font-weight:700;color:#f2d37a;text-transform:uppercase}
.rc-points{list-style:none;margin:6px 0 4px;padding:0}
.rc-points li{position:relative;padding:0 0 0 16px;margin:0 0 8px;font-size:13px;line-height:1.45;color:#c9d4e6}
.rc-points li::before{content:'';position:absolute;left:2px;top:7px;width:6px;height:6px;border-radius:2px;background:#22d3ee;box-shadow:0 0 6px rgba(34,211,238,.6)}
.rc-tags{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.rc-tag{padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:600;color:#38bdf8;background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.35)}
.rc-info-body{animation:rcfade .35s ease}
@keyframes rcfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.rc-info h2{margin:0 0 4px;font-size:20px;color:#fff}
.rc-info p{margin:4px 0;font-size:13px;color:#b8c4d8}
.rc-row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.rc-bottom-bar{bottom:18px;left:18px;max-width:calc(100% - 350px);padding:8px 12px;display:flex;align-items:center;gap:10px;box-sizing:border-box}
.rc-bottom-title{font-size:11px;letter-spacing:.16em;font-weight:700;color:#f2d37a;white-space:nowrap;padding-right:8px;border-right:1px solid rgba(255,255,255,.14);text-transform:uppercase;user-select:none}
.rc-tabs-track{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px 0;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;-webkit-overflow-scrolling:touch}
.rc-tabs-track::-webkit-scrollbar{height:4px}
.rc-tabs-track::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px}
.rc-tab{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:500;white-space:nowrap;color:#cdd7e5;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);transition:all .15s ease;user-select:none}
.rc-tab:hover{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.22)}
.rc-tab.on{background:rgba(34,211,238,.16);border-color:rgba(34,211,238,.7);color:#38bdf8;font-weight:600;box-shadow:0 0 12px rgba(34,211,238,.25)}
.rc-dot{width:8px;height:8px;border-radius:2px;background:#d9cf9f;flex:none}
.rc-hint{bottom:18px;right:18px;padding:8px 12px;font-size:12px;color:#9fb0c8}
.rc-rail{position:absolute;left:16px;top:96px;bottom:108px;width:26px;z-index:5;cursor:pointer;touch-action:none;user-select:none}
.rc-rail::before{content:'';position:absolute;left:11px;top:0;bottom:0;width:4px;border-radius:2px;background:rgba(255,255,255,.22);box-shadow:0 0 0 1px rgba(0,0,0,.25)}
.rc-rail i{position:absolute;left:13px;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none}
.rc-rail i.sp{background:#4ade80}
.rc-thumb{position:absolute;left:13px;width:16px;height:30px;margin:-15px 0 0 -8px;border-radius:8px;background:#22d3ee;box-shadow:0 0 14px rgba(34,211,238,.75);transition:top .35s ease;pointer-events:none}
.rc-thumb-label{position:absolute;left:34px;margin-top:-11px;padding:3px 9px;border-radius:6px;white-space:nowrap;font-size:12px;font-weight:600;color:#38bdf8;background:rgba(10,18,34,.85);border:1px solid rgba(34,211,238,.5);transition:top .35s ease;pointer-events:none}
.rc-dot.sp{background:#4ade80}
@media(max-width:960px){.rc-rail{left:8px}.rc-thumb-label{display:none}.rc-info{width:min(320px,calc(100% - 36px));max-height:38vh;top:72px}}
@media(max-width:960px){
  .rc-bottom-bar{max-width:calc(100% - 36px);bottom:12px;left:18px}
  .rc-hint{display:none}
}
`;
function CameraRig({ selectedId, resetKey, rotating, onArrived, autoTour, onTourStep }) {
  const { camera, controls, size } = useThree();
  const goal = useRef(null);
  const rotatedAngle = useRef(0);
  const lastAngle = useRef(null);

  useEffect(() => {
    const aspect = size.width / size.height, k = Math.max(1, 1.8 / aspect);
    rotatedAngle.current = 0;
    lastAngle.current = null;
    if (!selectedId) {
      const t = new THREE.Vector3(...HOME_TARGET);
      goal.current = {
        target: t,
        pos: t.clone().add(new THREE.Vector3(HOME_POS[0] - HOME_TARGET[0], HOME_POS[1], HOME_POS[2] - HOME_TARGET[2]).multiplyScalar(k)),
      };
    } else {
      const b = BUILDINGS[selectedId], r = Math.max(b.width, b.depth);
      const t = new THREE.Vector3(b.x, buildingHeight(b) / 2, b.z);
      goal.current = {
        target: t,
        pos: t.clone().add(new THREE.Vector3(r * 0.25, 7 + r * 0.7, 9 + r * 0.9)),
      };
    }
  }, [selectedId, resetKey, size]);

  useFrame((_, dt) => {
    if (!controls) return;
    const g = goal.current;
    if (g) {
      const k = 1 - Math.pow(0.0008, dt);
      camera.position.lerp(g.pos, k);
      controls.target.lerp(g.target, k);
      controls.update();
      if (camera.position.distanceTo(g.pos) < 0.12) {
        camera.position.copy(g.pos);
        controls.target.copy(g.target);
        controls.update();
        goal.current = null;
        if (onArrived) onArrived();
        lastAngle.current = controls.getAzimuthalAngle();
        rotatedAngle.current = 0;
      }
      return;
    }

    if (autoTour && selectedId && rotating && lastAngle.current !== null) {
      const cur = controls.getAzimuthalAngle();
      let diff = cur - lastAngle.current;
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      rotatedAngle.current += Math.abs(diff);
      lastAngle.current = cur;

      if (rotatedAngle.current >= Math.PI * 2) {
        rotatedAngle.current = 0;
        if (onTourStep) onTourStep();
      }
    }
  });

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      if (goal.current) {
        goal.current = null;
        if (onArrived) onArrived();
      }
    };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls, onArrived]);

  return null;
}

const N = TOUR_ORDER.length;
const dotColor = (b) => ({ auditorium: '#c9b98a', temple: '#c97d4b', open: '#9aa0a6', lab: '#8fb3c9', sport: '#4ade80' }[b.style] || '#d9d9a3');

export default function CampusPage() {
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [tour, setTour] = useState(true); // wheel / scroll bar / arrow keys step through the blocks one after another
  const [rotating, setRotating] = useState(false); // true once camera arrives at focused block
  const [autoRotate, setAutoRotate] = useState(true); // 360 degree slow rotation toggle
  const [autoTour, setAutoTour] = useState(false); // auto advance after 360 degree rotation
  const rootRef = useRef(null), railRef = useRef(null), trackRef = useRef(null);
  const sel = selected ? BUILDINGS[selected] : null;
  const det = selected ? BLOCK_DETAILS[selected] : null;
  const step = selected ? TOUR_ORDER.indexOf(selected) : -1; // -1 = campus overview
  const stepRef = useRef(step); stepRef.current = step;
  const reset = () => {
    setSelected(null);
    setRotating(false);
    setAutoTour(false);
    setResetKey((k) => k + 1);
  };

  // go to stop i (−1 = overview): selects the tab and flies the camera to the building
  const go = useCallback((i) => {
    const n = Math.max(-1, Math.min(N - 1, i));
    if (n === stepRef.current) return;
    stepRef.current = n;
    setRotating(false);
    if (n < 0) { setSelected(null); setResetKey((k) => k + 1); } else setSelected(TOUR_ORDER[n]);
  }, []);

  // mouse-wheel / trackpad scroll → next / previous block (one step per gesture)
  useEffect(() => {
    const el = rootRef.current; if (!el || !tour) return undefined;
    let acc = 0, locked = false, lockAt = 0, last = 0;
    const onWheel = (e) => {
      if (e.ctrlKey || e.target.closest?.('.rc-bottom-bar, .rc-info')) return;
      e.preventDefault();
      const now = performance.now(), quiet = now - last; last = now;
      if (locked) { if (now - lockAt > 600 && quiet > 160) { locked = false; acc = 0; } else return; }
      acc += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (Math.abs(acc) >= 60) { go(stepRef.current + Math.sign(acc)); acc = 0; locked = true; lockAt = now; }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tour, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); go(stepRef.current + 1); }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(stepRef.current - 1); }
      else if (e.key === 'Home') go(-1);
      else if (e.key === 'End') go(N - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // the active tab scrolls itself into view
  useEffect(() => {
    const tr = trackRef.current, el = tr?.querySelector('.rc-tab.on'); if (!el) return;
    const left = el.getBoundingClientRect().left - tr.getBoundingClientRect().left + tr.scrollLeft - (tr.clientWidth - el.offsetWidth) / 2;
    tr.scrollTo({ left, behavior: 'smooth' });
  }, [selected]);

  const railPick = (e) => {
    const r = railRef.current.getBoundingClientRect();
    go(Math.round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) * N) - 1);
  };
  const pct = (i) => `${((i + 1) / N) * 100}%`;

  return (
    <div className="rc-root" ref={rootRef}>
      <style>{css}</style>
      <header className="rc-head">
        <div><h1>RAMACHANDRA COLLEGE OF ENGINEERING</h1><small>CAMPUS DIGITAL TWIN · 3D</small></div>
        <div className="rc-hdr-btns">
          <button className={`rc-btn ${tour ? '' : 'off'}`} onClick={() => setTour((t) => !t)} title="When on, scrolling steps through the blocks. When off, scrolling zooms the camera.">⇅ SCROLL TOUR: {tour ? 'ON' : 'OFF'}</button>
          <button className={`rc-btn ${autoRotate ? '' : 'off'}`} onClick={() => setAutoRotate((r) => !r)} title="When on, gives a slow 360° rotation around the focused block.">↻ 360° ROTATION: {autoRotate ? 'ON' : 'OFF'}</button>
          <button className={`rc-btn ${autoTour ? '' : 'off'}`} onClick={() => {
            setAutoTour((a) => {
              const next = !a;
              if (next && !selected) go(0);
              return next;
            });
          }} title="When on, automatically tours each block with a 360° rotation.">▶ AUTO TOUR: {autoTour ? 'ON' : 'OFF'}</button>
          <button className="rc-btn" onClick={reset}>⟲ RESET CAMERA</button>
        </div>
      </header>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: HOME_POS, fov: 45, near: 0.5, far: 900 }} onPointerMissed={() => go(-1)}
        gl={{ antialias: true }} style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#cfe3f5']} />
        <fog attach="fog" args={['#d6e6f2', 190, 520]} />
        <Sky sunPosition={[60, 45, 30]} turbidity={4} rayleigh={1.2} />
        <hemisphereLight args={['#dbeaff', '#7d8a5a', 0.75]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[45, 70, 30]} intensity={2.4} castShadow shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-110} shadow-camera-right={110} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-near={5} shadow-camera-far={300}
          shadow-bias={-0.0004} shadow-normalBias={0.05} />
        <Suspense fallback={null}>
          <CampusModel selectedId={selected} onSelect={(id) => go(TOUR_ORDER.indexOf(id))} onHover={setHover} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} enableZoom={!tour} minDistance={6} maxDistance={230} maxPolarAngle={Math.PI / 2.08}
          target={HOME_TARGET} autoRotate={Boolean(selected) && rotating && autoRotate} autoRotateSpeed={2.6} />
        <CameraRig selectedId={selected} resetKey={resetKey} rotating={rotating} onArrived={() => setRotating(true)} autoTour={autoTour} onTourStep={() => go((stepRef.current + 1) % N)} />
      </Canvas>

      {/* scroll bar: drag it, click a dot, or just scroll the wheel – the tab selects itself and the camera zooms to that block */}
      <div className="rc-rail" ref={railRef} role="slider" aria-label="Campus tour" aria-valuemin={0} aria-valuemax={N} aria-valuenow={step + 1}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); railPick(e); }} onPointerMove={(e) => { if (e.buttons) railPick(e); }}>
        {[-1, ...TOUR_ORDER.keys()].map((i) => <i key={i} className={i >= 0 && BUILDINGS[TOUR_ORDER[i]].style === 'sport' ? 'sp' : ''} style={{ top: pct(i) }} />)}
        <div className="rc-thumb" style={{ top: pct(step) }} />
        <div className="rc-thumb-label" style={{ top: pct(step) }}>{step < 0 ? 'Campus overview' : `${step + 1}/${N} · ${sel.label}`}</div>
      </div>

      <aside className="rc-card rc-info">
        <h3>{sel ? 'SELECTED' : 'BUILDING INFO'}</h3>
        {sel ? (
          <div className="rc-info-body" key={sel.id}>
            <h2>{sel.label}</h2>
            {det && det.title !== sel.label && <p style={{ color: '#9fb0c8', fontSize: 12 }}>Part of: {det.title}</p>}
            <p>{DESC[sel.id]}</p>
            {det && (
              <>
                <div className="rc-sec">About this block</div>
                <ul className="rc-points">{det.points.map((t) => <li key={t}>{t}</li>)}</ul>
                {det.tags && <div className="rc-tags">{det.tags.map((t) => <span className="rc-tag" key={t}>{t}</span>)}</div>}
              </>
            )}
            <div className="rc-row"><span>Tour stop</span><b>{step + 1} / {N}</b></div>
          </div>
        ) : <p>{hover ? BUILDINGS[hover].label : tour ? 'Scroll (or drag the bar on the left) to tour every block one after another, or click a building.' : 'Click a building (or pick a block from the tabs below) to inspect it.'}</p>}
      </aside>

      <nav className="rc-card rc-bottom-bar" aria-label="Campus Blocks">
        <div className="rc-bottom-title"><span>BLOCKS</span></div>
        <div className="rc-tabs-track" ref={trackRef} onWheel={(e) => { if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY; }}>
          {TOUR_ORDER.map((id) => {
            const b = BUILDINGS[id];
            return (
              <div key={id} className={`rc-tab ${selected === id ? 'on' : ''}`} onClick={() => go(selected === id ? -1 : TOUR_ORDER.indexOf(id))}
                onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)}>
                <span className="rc-dot" style={{ background: dotColor(b) }} />{b.label}
              </div>
            );
          })}
        </div>
      </nav>
      <div className="rc-card rc-hint">{tour ? 'Scroll / ↑↓: next block · 360° slow rotation active · Drag: manual rotate · Right-drag: pan' : 'Drag: rotate · Right-drag: pan · Scroll: zoom'}</div>
    </div>
  );
}
