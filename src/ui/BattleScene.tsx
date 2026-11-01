import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Run } from '../engine';
import { characterFor } from '../characters';
import { makeFighter, disposeScene } from './battleModels';
import { poseFighter } from './fighterAnimation';
import { battleCues, type BattleCue } from './battleCues';
import { makeBattleEffects, samplePose, type TimedCue } from './battleEffects';
import { Portrait } from './Portrait';
import './battle.css';

export function BattleScene({ run }: { run: Run }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(run); live.current = run;
  const previous = useRef(run);
  const inbox = useRef<BattleCue[]>([]);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const pause = useRef(false); pause.current = paused;
  const hero = characterFor(run.side, run.character);

  // Capture every React commit, rather than missing cards clicked between animation frames.
  useEffect(() => {
    inbox.current.push(...battleCues(previous.current, run)); previous.current = run;
  }, [run]);

  useEffect(() => {
    const element = host.current; if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch { setFailed(true); return; }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor('#1b1e24'); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#1b1e24', 14, 28);
    const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .65;
    room.dispose(); pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
    scene.add(new THREE.HemisphereLight('#ffe7d3', '#414958', 1.4));
    const key = new THREE.DirectionalLight('#ffdfc3', 3.1); key.position.set(-3, 6, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -7; key.shadow.camera.right = 7;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.camera.far = 20;
    key.shadow.normalBias = .025; key.shadow.bias = -.0002; scene.add(key);
    const rim = new THREE.DirectionalLight('#a6bbd2', 2.8); rim.position.set(1, 4, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight('#fff1df', .9); fill.position.set(4, 2, 3); scene.add(fill);
    const metal = new THREE.MeshStandardMaterial({ color: '#373c45', metalness: .55, roughness: .55 });
    const dark = new THREE.MeshStandardMaterial({ color: '#20252d', roughness: .86, metalness: .25 });
    const light = new THREE.MeshStandardMaterial({ color: '#e59b5c', emissive: '#cc641f', emissiveIntensity: .4 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(15, .25, 10), dark);
    floor.position.y = -.2; floor.receiveShadow = true; scene.add(floor);
    const platformGeometry = new THREE.CylinderGeometry(1.86, 1.95, .16, 48);
    for (const x of [-2.4, 2.4]) {
      const platform = new THREE.Mesh(platformGeometry, metal); platform.position.set(x, -.01, 0); platform.receiveShadow = true; scene.add(platform);
      for (const z of [-1.45, 1.45]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(1.5, .02, .025), light); strip.position.set(x, .075, z); scene.add(strip);
      }
    }
    const rackGeometry = new THREE.BoxGeometry(.8, 2, .65), ledGeometry = new THREE.BoxGeometry(.42, .025, .02);
    for (let i = 0; i < 9; i++) {
      const rack = new THREE.Mesh(rackGeometry, dark); rack.position.set((i - 4) * 1.3, .85, -3.6);
      rack.scale.y = .8 + i % 3 * .12; scene.add(rack);
      for (let j = 0; j < 3; j++) {
        const led = new THREE.Mesh(ledGeometry, j === 0 ? light : metal);
        led.position.set(rack.position.x, .45 + j * .3, -3.265); scene.add(led);
      }
    }
    const player = makeFighter(run.side === 'spider', hero.variant);
    const enemy = makeFighter(run.side === 'dev', run.enemyIndex === 4 ? 1 : run.enemyIndex % 3);
    const models = [player, enemy];
    const rotations = [.92, -.92];
    models.forEach((model, i) => { model.position.set(i === 0 ? -2.4 : 2.4, .06, 0); model.rotation.y = rotations[i]; scene.add(model); });
    const effects = makeBattleEffects(scene);
    element.appendChild(renderer.domElement);
    let dirty = true;
    const resize = () => {
      dirty = true;
      const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // Fit both full silhouettes instead of a hard camera jump at a breakpoint.
      const distance = Math.max(8.7, 4.65 / (Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect));
      camera.position.set(0, 1.05 + distance * .32, distance); camera.lookAt(0, 1.05, 0); camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, last = 0, clock = 0, lastRender = 0, defeatAt = -1;
    let renderedState = live.current, wasMoving = true;
    const cues: TimedCue[] = [];
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      const delta = last ? Math.min(50, time - last) : 0; last = time;
      if (document.hidden) { inbox.current = []; return; }
      const moving = !reduced.matches && !pause.current;
      clock += delta;
      if (moving) {
        const incoming = inbox.current.splice(0);
        cues.push(...incoming.map(cue => ({ ...cue, at: clock + cue.delay })));
      } else { inbox.current = []; cues.length = 0; }
      for (let i = cues.length - 1; i >= 0; i--) if (clock > cues[i].at + 1000) cues.splice(i, 1);
      const state = live.current;
      // Idle at 30 fps; short combat actions at display refresh rate. A paused
      // scene renders only after a resize/state change, rather than burning GPU.
      const active = cues.length > 0;
      if (state === renderedState && moving === wasMoving && !dirty && (!moving || !active && time - lastRender < 32)) return;
      if (defeatAt < 0 && (state.enemy.hp === 0 || state.player.hp === 0)) defeatAt = clock;
      models.forEach((model, i) => {
        const pose = samplePose(cues, i === 0 ? 'player' : 'enemy', clock);
        const defeated = i === 0 ? state.player.hp === 0 : state.enemy.hp === 0;
        pose.defeat = moving && defeated && defeatAt >= 0 ? THREE.MathUtils.smoothstep(clock - defeatAt, 400, 1100) : 0;
        const direction = i === 0 ? 1 : -1;
        // A short advance plus an articulated strike, with feet staying above the platform.
        model.position.x = direction * -2.4 + direction * (pose.attack * .48 - pose.hit * .17);
        model.position.y = .06 + Math.max(0, pose.attack) * (model.spider ? .1 : .025) - pose.defeat * .13;
        model.rotation.y = rotations[i];
        poseFighter(model, clock / 1000 + i * .7, pose, moving);
      });
      effects.update(clock, cues, [state.player.block, state.enemy.block], moving);
      renderer.render(scene, camera);
      renderedState = state; wasMoving = moving; dirty = false; lastRender = time;
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); inbox.current = [];
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      disposeScene(scene); key.shadow.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [run.side, hero.variant, run.enemyIndex]);

  return <div className="battle-stage"><div ref={host} className="battle-canvas" role="img" aria-label={`3D-арена: ${hero.name} против ${run.side === 'dev' ? 'паука' : 'программиста'}`} />{failed && <div className="scene-fallback"><Portrait spider={run.side === 'spider'} variant={hero.variant} /><Portrait spider={run.side === 'dev'} /><p>3D недоступно в этом браузере. Бой работает в 2D.</p></div>}<div className="stage-caption"><span>Сектор {run.node + 1} · Серверное ядро</span>{!failed && <button className="quiet" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Включить анимацию' : 'Остановить анимацию'}</button>}</div></div>;
}
