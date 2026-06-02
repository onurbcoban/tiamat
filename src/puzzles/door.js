import * as THREE from 'three';
import { state } from '../core/state.js';
import { createDoorTexture, createIronFrameTexture, createDoorRoughnessMap, createDoorMetalnessMap, createDoorNormalMap } from '../world/textures.js';

const WALL_X      = -11.40;
const HINGE_Z     = 6.0;
const DOOR_W      = 2.0;
const DOOR_H      = 3.2;
const OPEN_ANGLE  = -2 * Math.PI / 3;
const ANIM_SPEED  = 1.2;

export function createDoor(scene, interactables, collidableBoxes, onEscape) {
  const doorCollision = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(WALL_X, DOOR_H / 2, 5.0),
    new THREE.Vector3(0.20, DOOR_H, DOOR_W)
  );
  if (collidableBoxes) {
    collidableBoxes.push(doorCollision);
  }

  const pivot = new THREE.Group();
  pivot.position.set(WALL_X, 0, HINGE_Z);
  pivot.rotation.y = Math.PI / 2;
  scene.add(pivot);

  const doorTex = createDoorTexture();
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex,
    bumpMap: doorTex,
    bumpScale: 0.016,
    roughnessMap: createDoorRoughnessMap(),
    metalnessMap: createDoorMetalnessMap(),
    normalMap: createDoorNormalMap(),
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0x667686,
    metalness: 1.0,
    roughness: 1.0,
  });

  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.14),
    doorMat
  );
  doorMesh.position.set(DOOR_W / 2, DOOR_H / 2, 0);
  doorMesh.castShadow = true;
  doorMesh.receiveShadow = true;
  pivot.add(doorMesh);



  const rivetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8);
  rivetGeo.rotateX(Math.PI / 2);
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x4a5560,
    metalness: 0.85,
    roughness: 0.25,
  });

  const addExitDoorRivets = (faceZ) => {
    for (let x = 0.1; x <= DOOR_W - 0.1; x += 0.2) {
      [0.1, DOOR_H - 0.1].forEach(y => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(x, y, faceZ);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        pivot.add(rivet);
      });
    }
    for (let y = 0.3; y <= DOOR_H - 0.3; y += 0.2) {
      [0.1, DOOR_W - 0.1].forEach(x => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(x, y, faceZ);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        pivot.add(rivet);
      });
    }
  };

  addExitDoorRivets(0.075);
  addExitDoorRivets(-0.075);

  // Center watertight door round wheel handle (rotatable look)
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x7a6e5f,
    metalness: 0.75,
    roughness: 0.30,
  });
  // Hinge shaft protruding from front center
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), wheelMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(DOOR_W / 2, DOOR_H / 2 + 0.1, 0.08);
  shaft.castShadow = true;
  pivot.add(shaft);
  // Torus wheel
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 16), wheelMat);
  wheel.position.set(DOOR_W / 2, DOOR_H / 2 + 0.1, 0.12);
  wheel.castShadow = true;
  pivot.add(wheel);
  // Spokes
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 8), wheelMat);
    spoke.rotation.z = (i * Math.PI) / 3;
    spoke.position.set(DOOR_W / 2, DOOR_H / 2 + 0.1, 0.12);
    spoke.castShadow = true;
    pivot.add(spoke);
  }

  const frameMat = new THREE.MeshStandardMaterial({
    map: createIronFrameTexture(),
    color: 0x404a54,
    metalness: 0.65,
    roughness: 0.60,
  });
  [
    { pos: [-0.07, DOOR_H / 2, 0], size: [0.14, DOOR_H + 0.14, 0.2] },
    { pos: [DOOR_W + 0.07, DOOR_H / 2, 0], size: [0.14, DOOR_H + 0.14, 0.2] },
    { pos: [DOOR_W / 2, DOOR_H + 0.07, 0], size: [DOOR_W + 0.28, 0.14, 0.2] },
  ].forEach(({ pos, size }) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      frameMat
    );
    m.position.set(...pos);
    pivot.add(m);
  });

  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    emissive: new THREE.Color(0xcc2222),
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.5,
  });
  const lockLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    lightMat
  );
  lockLight.position.set(DOOR_W - 0.2, DOOR_H - 0.25, 0.12);
  pivot.add(lockLight);

  const lockPL = new THREE.PointLight(0xcc2222, 1.0, 2.5);
  lockPL.position.copy(lockLight.position);
  pivot.add(lockPL);

  const lockLabel = makeLabel('LOCKED');
  lockLabel.position.set(DOOR_W / 2, DOOR_H / 2 - 0.5, 0.12);
  pivot.add(lockLabel);

  const outsideLight = new THREE.SpotLight(0xffffff, 0);
  outsideLight.position.set(-14.0, DOOR_H / 2, 5.0);
  outsideLight.target.position.set(-5.0, 0, 5.0);
  outsideLight.angle = Math.PI / 2.5;
  outsideLight.penumbra = 0.8;
  outsideLight.decay = 1.5;
  scene.add(outsideLight);
  scene.add(outsideLight.target);

  const voidMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0,
    fog: false
  });
  const voidMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), voidMat);
  voidMesh.position.set(-11.55, DOOR_H / 2, 5.0);
  voidMesh.rotation.y = Math.PI / 2;
  scene.add(voidMesh);

  const doorInteractable = {
    mesh: doorMesh,
    name: 'Exit Door',
    prompt: null,
    onInteract: () => {
      if (isOpen && notified && !escaped && onEscape) {
        escaped = true;
        onEscape();
      }
    },
    onClick: null,
  };
  interactables.push(doorInteractable);

  let isOpen       = false;
  let currentAngle = Math.PI / 2;
  let targetAngle  = Math.PI / 2;
  let notified     = false;
  let escaped      = false;

  let pulseTimer = 0;

  function update(delta) {
    if (!isOpen) {
      pulseTimer += delta * 2.0;
      const pulse = 0.7 + 0.3 * Math.sin(pulseTimer);
      lightMat.emissiveIntensity = pulse;
      lockPL.intensity = pulse * 1.0;
    }

    if (isOpen) {
      if (outsideLight.intensity < 250) {
        outsideLight.intensity += delta * 150;
      }
      if (voidMat.opacity < 1) {
        voidMat.opacity += delta * 0.8;
      }

      const diff = targetAngle - currentAngle;
      if (Math.abs(diff) > 0.001) {
        currentAngle += Math.sign(diff) * Math.min(Math.abs(diff), ANIM_SPEED * delta);
        pivot.rotation.y = currentAngle;
      } else if (!notified) {
        notified = true;
        doorInteractable.prompt = 'F: ESCAPE';
      }

      if (notified && state.camera && !escaped) {
        const p = state.camera.position;
        if (p.x < -11.1 && p.z >= 4.0 && p.z <= 6.0) {
          escaped = true;
          if (onEscape) {
            onEscape();
          }
        }
      }
    }
  }

  function open() {
    if (isOpen) return;
    isOpen      = true;
    targetAngle = Math.PI / 2 + OPEN_ANGLE;

    if (collidableBoxes) {
      const idx = collidableBoxes.indexOf(doorCollision);
      if (idx > -1) collidableBoxes.splice(idx, 1);
    }

    lightMat.color.setHex(0x22cc55);
    lightMat.emissive.setHex(0x22cc55);
    lightMat.emissiveIntensity = 1.0;
    lockPL.color.setHex(0x22cc55);
    lockPL.intensity = 1.5;

    lockLabel.visible = false;
  }

  return { open, update };
}

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 192; c.height = 40;
  const x = c.getContext('2d');
  x.fillStyle = '#0d1820';
  x.fillRect(0, 0, 192, 40);
  x.strokeStyle = '#cc3333';
  x.lineWidth = 1.5;
  x.strokeRect(2, 2, 188, 36);
  x.fillStyle = '#cc3333';
  x.font = '14px monospace';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 96, 21);

  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.17),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(c),
      emissive: 0x1a0808,
      emissiveIntensity: 0.5,
      metalness: 0.0,
      roughness: 0.9,
    })
  );
}
