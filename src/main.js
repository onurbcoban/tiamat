import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { createRoom }           from './world/room.js';
import { createLights }         from './world/lights.js';
import { createObjects }        from './world/objects.js';

import { createMovement }       from './player/movement.js';
import { createInteraction, createMagnesiumHotkey } from './player/interaction.js';

import { createValvePuzzle }    from './puzzles/valve.js';
import { createPressurePuzzle } from './puzzles/pressure.js';
import { createSimonPuzzle }    from './puzzles/simon.js';
import { createDoor }           from './puzzles/door.js';
import { createBreakerPuzzle }  from './puzzles/breaker.js';
import { createGeneratorPuzzle } from './puzzles/generator.js';

import { createHUD }            from './ui/hud.js';
import { createOverlay }        from './ui/overlay.js';

import { state }                from './core/state.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.30;
renderer.outputColorSpace     = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030810, 0.042);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 1.7, -22);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const ssaoPass = new SSAOPass(scene, camera, window.innerWidth / 2, window.innerHeight / 2, 8);
ssaoPass.kernelRadius = 0.75;
ssaoPass.minDistance = 0.025;
ssaoPass.maxDistance = 0.25;
composer.addPass(ssaoPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.08, // strength
  0.55, // radius
  0.99  // threshold
);
composer.addPass(bloomPass);

composer.addPass(new OutputPass());

const collidableBoxes = [];
const interactables   = [];

createRoom(scene, collidableBoxes);
const lights = createLights(scene, camera);

const hud = createHUD();

state.scene = scene;
state.interactables = interactables;
state.hud = hud;
state.camera = camera;

let overlay;
const door = createDoor(scene, interactables, collidableBoxes, () => {
  if (overlay) overlay.showWin();
});

const valve    = createValvePuzzle(scene, interactables, collidableBoxes, hud);
const pressure = createPressurePuzzle(scene, interactables);
const simon    = createSimonPuzzle(scene, interactables);

const movement    = createMovement(camera, collidableBoxes, renderer.domElement);
const interaction = createInteraction(
  camera,
  interactables,
  () => movement.isLocked()
);

const breaker  = createBreakerPuzzle(scene, interactables, hud, movement);
const generator = createGeneratorPuzzle(scene, interactables, collidableBoxes, hud);

createMagnesiumHotkey(state, hud, () => movement.isLocked());

const objects = createObjects(scene, collidableBoxes, interactables, hud, movement);

overlay = createOverlay(() => movement.controls.lock());

state.onPuzzleSolved = (name) => {
  hud.markSolved(name);

  if (state.allSolved && !state.doorOpen) {
    state.doorOpen = true;
    door.open();
  }
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  ssaoPass.setSize(window.innerWidth / 2, window.innerHeight / 2);
});

const clock = new THREE.Clock();

let shakeTime = 0.0;
let shakeAmount = 0.0;
let sanityZeroTime = 0.0;
let madRoomSlamDone = false;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const prevSanity = state.sanity;

  if (movement.isLocked()) {
    movement.update(delta);
    interaction.update(hud);
  }

  if (state.drowningTime >= 4.0 && !state.isDead) {
    state.isDead = true;
    overlay.showDeath(() => {
      window.location.reload();
    }, 'drowning');
  }

  if (state.sanity <= 0 && !state.isDead) {
    sanityZeroTime += delta;
    shakeTime = 0.1;
    shakeAmount = 0.04 + (sanityZeroTime / 3.0) * 0.35;
    if (sanityZeroTime >= 3.0) {
      state.isDead = true;
      overlay.showDeath(() => {
        window.location.reload();
      }, 'sanity');
    }
  } else {
    sanityZeroTime = 0.0;
  }

  valve.update(delta);
  pressure.update(delta);
  simon.update(delta);
  door.update(delta);
  breaker.update(delta);
  generator.update(delta);
  if (objects && typeof objects.update === 'function') {
    objects.update(delta);
  }

  hud.updateStats(state);

  if (lights && lights.flashlight) {
    camera.updateMatrixWorld(true);
  }
  if (lights && typeof lights.updateRoomLights === 'function') {
    lights.updateRoomLights(camera.position, state.powerRestored);
  }
  if (!madRoomSlamDone && !state.isDead) {
    const cp = camera.position;
    const isInCorridor = cp.y > 0 && cp.x >= -1.6 && cp.x <= 1.6;
    if (isInCorridor) {
      if (Math.abs(cp.z) < 0.8) {
        madRoomSlamDone = true;
        shakeTime = 1.1;
        shakeAmount = 0.11;
        state.sanity = Math.max(0, state.sanity - 15);
        hud.updateStats(state);
        console.log("[Tiamat] Event: Someone slams against the quarantine door!");
      }
    }
  }

  const originalPos = new THREE.Vector3().copy(camera.position);
  if (shakeTime > 0) {
    shakeTime -= delta;
    const intensity = (shakeTime / 0.8) * shakeAmount;
    camera.position.x += (Math.random() - 0.5) * intensity;
    camera.position.y += (Math.random() - 0.5) * intensity;
    camera.position.z += (Math.random() - 0.5) * intensity;
  }

  if (prevSanity - state.sanity > 2.0) {
    console.log(`[DEBUG SANITY DROP > 4] Lost ${Math.round(prevSanity - state.sanity)} sanity in one frame! Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}), dist to door: ${Math.sqrt((camera.position.x - 1.5)**2 + camera.position.z**2).toFixed(2)}`);
  }

  composer.render();
  camera.position.copy(originalPos);
}

animate();