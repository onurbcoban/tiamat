import './style.css';
import * as THREE from 'three';

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog   = new THREE.Fog(0x000005, 8, 28);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 1.7, -22);
scene.add(camera);

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
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  if (movement.isLocked()) {
    movement.update(delta);
    interaction.update(hud);
  }

  if (state.drowningTime >= 4.0 && !state.isDead) {
    state.isDead = true;
    overlay.showDeath(() => {
      camera.position.set(4, 1.7, -22);
      camera.rotation.set(0, 0, 0);

      state.oxygen = 100;
      state.sanity = 100;
      state.drowningTime = 0;
      state.isSwimming = false;
      state.isDead = false;

      movement.controls.lock();
    });
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
    if (!window._lastLogTime) window._lastLogTime = 0;
    const now = Date.now();
    if (now - window._lastLogTime > 1000) {
      window._lastLogTime = now;
      const cPos = new THREE.Vector3();
      const lPos = new THREE.Vector3();
      const tPos = new THREE.Vector3();
      camera.getWorldPosition(cPos);
      lights.flashlight.getWorldPosition(lPos);
      lights.flashlight.target.getWorldPosition(tPos);
      console.log(`[Flashlight Debug]
  Camera: localY=${camera.position.y.toFixed(2)}, worldY=${cPos.y.toFixed(2)}, parent=${camera.parent ? camera.parent.name || camera.parent.type : 'none'}
  Light:  localY=${lights.flashlight.position.y.toFixed(2)}, worldY=${lPos.y.toFixed(2)}, parent=${lights.flashlight.parent ? lights.flashlight.parent.name || lights.flashlight.parent.type : 'none'}
  Target: localY=${lights.flashlight.target.position.y.toFixed(2)}, worldY=${tPos.y.toFixed(2)}, parent=${lights.flashlight.target.parent ? lights.flashlight.target.parent.name || lights.flashlight.target.parent.type : 'none'}`);
    }
  }

  renderer.render(scene, camera);
}

animate();