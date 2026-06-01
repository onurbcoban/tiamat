import * as THREE from 'three';
import { state } from '../core/state.js';
import { createSimonConsoleTexture } from '../world/textures.js';

const SEQ_LEN  = 4;
const SHOW_ON  = 0.55;
const SHOW_OFF = 0.30;
const FAIL_DUR = 0.90;
const WALL_X   = -6.5;
const WALL_Z   = 7.84;

const BTN_DEFS = [
  { name: 'Red Button', active: 0xee2222, dim: 0x3a0808 },
  { name: 'Green Button',   active: 0x22ee44, dim: 0x083a14 },
  { name: 'Blue Button',    active: 0x2244ee, dim: 0x08103a },
  { name: 'Yellow Button',    active: 0xeeee22, dim: 0x3a3808 },
];

export function createSimonPuzzle(scene, interactables) {
  const sequence = Array.from({ length: SEQ_LEN }, () =>
    Math.floor(Math.random() * 4)
  );

  let simonState  = 'idle';
  let showIndex   = 0;
  let showTimer   = 0;
  let failTimer   = 0;
  let playerInput = [];

  const group = new THREE.Group();
  group.position.set(WALL_X, 2.2, WALL_Z);
  group.rotation.y = Math.PI;
  scene.add(group);

  const simonTex = createSimonConsoleTexture();

  const panelMat = new THREE.MeshPhongMaterial({
    map: simonTex,
    color: 0x5a6068, // slightly tinted grey to blend textures
    specular: 0x445566,
    shininess: 40,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.08), panelMat);
  group.add(panel);

  const frameMat = new THREE.MeshPhongMaterial({
    map: simonTex,
    color: 0x7a8690, // outer metallic frame
    specular: 0x88aabb,
    shininess: 65,
  });
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 1.22, 0.06),
    frameMat
  );
  frame.position.z = -0.01;
  group.add(frame);

  const BTN_OFFSET = 0.27;
  const btnPositions = [
    [-BTN_OFFSET,  BTN_OFFSET, 0.07],
    [ BTN_OFFSET,  BTN_OFFSET, 0.07],
    [-BTN_OFFSET, -BTN_OFFSET, 0.07],
    [ BTN_OFFSET, -BTN_OFFSET, 0.07],
  ];

  const btnMeshes = btnPositions.map((pos, i) => {
    const mat = new THREE.MeshPhongMaterial({
      color: BTN_DEFS[i].dim,
      emissive: new THREE.Color(BTN_DEFS[i].dim),
      emissiveIntensity: 0.8,
      specular: 0x224455,
      shininess: 60,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.06), mat);
    mesh.position.set(...pos);
    group.add(mesh);
    return { mesh, mat, index: i };
  });

  const statusCanvas = document.createElement('canvas');
  statusCanvas.width  = 256;
  statusCanvas.height = 48;
  const statusCtx = statusCanvas.getContext('2d');
  const statusTex = new THREE.CanvasTexture(statusCanvas);
  const statusMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.19),
    new THREE.MeshPhongMaterial({
      map: statusTex,
      emissive: 0x0a1a20,
      emissiveIntensity: 0.5,
    })
  );
  statusMesh.position.set(0, -0.70, 0.07);
  group.add(statusMesh);
  updateStatusLabel('F / CLICK: START');

  btnMeshes.forEach(({ mesh, index }) => {
    const entry = {
      mesh,
      name: BTN_DEFS[index].name,
      prompt: 'F / CLICK',
      onInteract: () => handlePress(index),
      onClick:    () => handlePress(index),
    };
    interactables.push(entry);
  });

  function handlePress(btnIndex) {
    if (simonState === 'solved') return;
    if (simonState === 'idle') {
      startShowing();
      return;
    }
    if (simonState !== 'input') return;

    playerInput.push(btnIndex);
    flashButton(btnIndex, true);
    setTimeout(() => flashButton(btnIndex, false), 200);

    const step = playerInput.length - 1;

    if (playerInput[step] !== sequence[step]) {
      simonState = 'fail';
      failTimer  = 0;
      flashAllButtons(0xee2222);
      updateStatusLabel('WRONG — RETRY');
      return;
    }

    if (playerInput.length === sequence.length) {
      simonState = 'solved';
      flashAllButtons(BTN_DEFS[0].active);
      updateStatusLabel('SOLVED ✓');
      state.solve('simon');
    }
  }

  function startShowing() {
    simonState  = 'showing';
    showIndex   = 0;
    showTimer   = 0;
    playerInput = [];
    setAllDim();
    updateStatusLabel('WATCH...');
  }

  function update(delta) {
    if (simonState === 'showing') {
      showTimer += delta;

      if (showTimer < SHOW_ON) {
        flashButton(sequence[showIndex], true);
      } else {
        flashButton(sequence[showIndex], false);
        if (showTimer >= SHOW_ON + SHOW_OFF) {
          showTimer = 0;
          showIndex++;
          if (showIndex >= sequence.length) {
            simonState  = 'input';
            playerInput = [];
            updateStatusLabel('ENTER SEQUENCE');
          }
        }
      }
    }

    if (simonState === 'fail') {
      failTimer += delta;
      if (failTimer >= FAIL_DUR) {
        setAllDim();
        startShowing();
      }
    }
  }

  function flashButton(index, on) {
    const { mat } = btnMeshes[index];
    if (on) {
      mat.color.setHex(BTN_DEFS[index].active);
      mat.emissive.setHex(BTN_DEFS[index].active);
      mat.emissiveIntensity = 1.0;
    } else {
      mat.color.setHex(BTN_DEFS[index].dim);
      mat.emissive.setHex(BTN_DEFS[index].dim);
      mat.emissiveIntensity = 0.8;
    }
  }

  function flashAllButtons(hexColor) {
    btnMeshes.forEach((_, i) => {
      btnMeshes[i].mat.color.setHex(hexColor);
      btnMeshes[i].mat.emissive.setHex(hexColor);
      btnMeshes[i].mat.emissiveIntensity = 1.0;
    });
  }

  function setAllDim() {
    btnMeshes.forEach((_, i) => flashButton(i, false));
  }

  function updateStatusLabel(text) {
    statusCtx.fillStyle = '#080f16';
    statusCtx.fillRect(0, 0, 256, 48);
    statusCtx.strokeStyle = '#1a3040';
    statusCtx.lineWidth = 1.5;
    statusCtx.strokeRect(2, 2, 252, 44);
    statusCtx.fillStyle = '#4d9ab0';
    statusCtx.font = '13px monospace';
    statusCtx.textAlign = 'center';
    statusCtx.textBaseline = 'middle';
    statusCtx.fillText(text, 128, 25);
    statusTex.needsUpdate = true;
  }

  return { update };
}
