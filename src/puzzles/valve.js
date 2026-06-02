import * as THREE from 'three';
import { state } from '../core/state.js';
import { createDoorTexture, createIronFrameTexture, createWheelTexture, createDoorRoughnessMap, createDoorMetalnessMap, createDoorNormalMap } from '../world/textures.js';


const SOLUTION = [true, false, true];
const WALL_Z = -1.88;

export function createValvePuzzle(scene, interactables, boxes, hud) {
  const valves = [];
  let valvesAligned = false;
  let drainageLeverPulled = false;
  let drainageAnimating = false;
  let leverAngle = 0;

  let doorUnlocked = false;
  let doorOpen = false;
  let doorAnimating = false;
  let doorAngle = 0;

  const xPositions = [2.0, 2.8, 3.6];
  xPositions.forEach((xPos, i) => {
    const valve = buildValve(scene, xPos, -2.5, WALL_Z, i);
    valves.push(valve);

    interactables.push({
      mesh:          valve.hitMesh,
      highlightMesh: valve.wheel,
      name:          `Valve ${i + 1}`,
      prompt:        'Offline (Requires Pressure)',
      onInteract:    () => toggleValve(valve, i),
      onClick:       null,
    });
  });

  const lever = buildLever(scene, -1.36, -2.5, 3.5);
  lever.group.rotation.y = Math.PI / 2; 

  const leverInteractable = {
    mesh: lever.hitMesh,
    name: "Bulkhead Lever",
    prompt: "Offline (Requires Drainage)",
    onInteract: () => {
      if (state.puzzles.valve) return;
      if (!state.waterDrained) {
        console.log("[Tiamat] Cannot pull lever. Water must be drained first.");
        hud.setHovered("Bulkhead Lever", "Offline (Requires Drainage)");
        return;
      }

      drainageLeverPulled = true;
      drainageAnimating = true;
      leverInteractable.prompt = null;

      state.solve('valve');

      lever.redLightMat.color.setHex(0x22cc55);
      lever.redLightMat.emissive.setHex(0x116622);

      doorUnlocked = true;
      doorOpen = true;
      doorAnimating = true;

      doorLightMat.color.setHex(0x22cc55);
      doorLightMat.emissive.setHex(0x116622);

      const idx = boxes.indexOf(doorCollision);
      if (idx > -1) boxes.splice(idx, 1);

      console.log("[Tiamat] Bulkhead Lever pulled. Generator Room door opening.");
    }
  };
  interactables.push(leverInteractable);

  const doorGroup = new THREE.Group();
  doorGroup.position.set(-1.5, -4.0, 4.0); 
  scene.add(doorGroup);

  const doorTex = createDoorTexture();
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex,
    bumpMap: doorTex,
    bumpScale: 0.016,
    normalMap: createDoorNormalMap(),
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: createDoorRoughnessMap(),
    metalnessMap: createDoorMetalnessMap(),
    color: 0x667686,
    metalness: 1.0,
    roughness: 1.0,
  });

  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.0), doorMat);
  doorMesh.position.set(0, 1.3, 1.0); 
  doorMesh.castShadow = true;
  doorMesh.receiveShadow = true;
  doorGroup.add(doorMesh);



  const rivetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8);
  rivetGeo.rotateZ(Math.PI / 2);
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x4a5560,
    metalness: 0.85,
    roughness: 0.25,
  });

  const addValveDoorRivets = (faceX) => {
    for (let z = 0.1; z <= 1.9; z += 0.2) {
      [0.1, 2.5].forEach(y => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(faceX, y, z);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        doorGroup.add(rivet);
      });
    }
    for (let y = 0.3; y <= 2.3; y += 0.2) {
      [0.1, 1.9].forEach(z => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(faceX, y, z);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        doorGroup.add(rivet);
      });
    }
  };

  addValveDoorRivets(0.052);
  addValveDoorRivets(-0.052);

  const steelMat = new THREE.MeshStandardMaterial({
    map: createIronFrameTexture(),
    color: 0x404a54,
    metalness: 0.65,
    roughness: 0.60,
  });
  const viewPortFrame = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), steelMat);
  viewPortFrame.rotation.y = Math.PI / 2;
  viewPortFrame.position.set(0, 1.6, 1.0);
  doorGroup.add(viewPortFrame);

  const viewPortBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), steelMat);
  viewPortBar.position.set(0, 1.6, 1.0);
  doorGroup.add(viewPortBar);

  const handleMat = new THREE.MeshStandardMaterial({
    map: createWheelTexture(),
    metalness: 0.75,
    roughness: 0.30,
  });
  [-0.07, 0.07].forEach(offset => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), handleMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(offset, 1.2, 1.0);
    doorGroup.add(wheel);
  });

  const doorLightMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    emissive: 0x661111,
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.5,
  });
  const doorLight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), doorLightMat);
  doorLight.position.set(0.06, 2.3, 1.8);
  doorGroup.add(doorLight);

  const doorCollision = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(-1.5, -2.7, 5.0),
    new THREE.Vector3(0.2, 2.6, 2.0)
  );
  boxes.push(doorCollision);

  function toggleValve(valve, index) {
    if (!state.puzzles.pressure) {
      console.log("[Tiamat] Valves are offline. Calibrate pressure first.");
      hud.setHovered(`Valve ${index + 1}`, "Offline (Requires Pressure)");
      return;
    }
    if (state.waterDrained) return; 

    valve.isOpen = !valve.isOpen;
    valve.targetAngle += Math.PI / 2;

    if (valve.isOpen) {
      valve.indMat.color.setHex(0x22cc55);
      valve.indMat.emissive.setHex(0x116622);
    } else {
      valve.indMat.color.setHex(0xcc2222);
      valve.indMat.emissive.setHex(0x661111);
    }

    const solved = valves.every((v, i) => v.isOpen === SOLUTION[i]);
    valvesAligned = solved;

    if (solved) {
      state.waterDrained = true;
      console.log("[Tiamat] Valves aligned correctly! Water is draining...");
    }
  }

  function update(delta) {
    valves.forEach(v => {
      const diff = v.targetAngle - v.currentAngle;
      if (Math.abs(diff) > 0.001) {
        v.currentAngle += diff * Math.min(1, 8 * delta);
        v.wheelGroup.rotation.z = v.currentAngle;
      }
    });

    valves.forEach((valve, i) => {
      const item = interactables.find(it => it.mesh === valve.hitMesh);
      if (item) {
        if (!state.puzzles.pressure) {
          item.prompt = "Offline (Requires Pressure)";
        } else if (state.waterDrained) {
          item.prompt = "Aligned (Locked)";
        } else {
          item.prompt = valve.isOpen ? "F: Close Valve" : "F: Open Valve";
        }
      }
    });

    if (!state.puzzles.valve) {
      if (!state.waterDrained) {
        leverInteractable.prompt = "Offline (Requires Drainage)";
      } else if (!drainageLeverPulled) {
        leverInteractable.prompt = "F: Pull Bulkhead Lever";
        lever.redLightMat.color.setHex(0x22cc55);
        lever.redLightMat.emissive.setHex(0x116622);
      } else {
        leverInteractable.prompt = null;
      }
    }

    if (drainageAnimating) {
      const targetLeverAngle = Math.PI / 2; 
      const diff = targetLeverAngle - leverAngle;
      if (Math.abs(diff) > 0.001) {
        leverAngle += Math.sign(diff) * Math.min(Math.abs(diff), 3 * delta);
        lever.pivot.rotation.x = leverAngle;
      } else {
        leverAngle = targetLeverAngle;
        lever.pivot.rotation.x = leverAngle;
        drainageAnimating = false;

        const idx = interactables.indexOf(leverInteractable);
        if (idx > -1) interactables.splice(idx, 1);
      }
    }

    if (doorAnimating) {
      const targetDoorAngle = -Math.PI / 2; 
      const diff = targetDoorAngle - doorAngle;
      if (Math.abs(diff) > 0.001) {
        doorAngle += Math.sign(diff) * Math.min(Math.abs(diff), 1.2 * delta);
        doorGroup.rotation.y = doorAngle;
      } else {
        doorAngle = targetDoorAngle;
        doorGroup.rotation.y = doorAngle;
        doorAnimating = false;
      }
    }
  }

  return { update };
}

function buildValve(scene, x, y, z, index) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  scene.add(group);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x607080,
    metalness: 0.85,
    roughness: 0.22,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x445566,
    metalness: 0.75,
    roughness: 0.35,
  });

  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), stemMat);
  flange.rotation.x = Math.PI / 2;
  flange.position.z = -0.06;
  group.add(flange);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), stemMat);
  stem.rotation.x = Math.PI / 2;
  stem.position.z = 0.05;
  group.add(stem);

  const wheelGroup = new THREE.Group();
  group.add(wheelGroup);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 8, 24), metalMat);
  wheelGroup.add(wheel);

  const spokeGeo = new THREE.BoxGeometry(0.56, 0.05, 0.05);
  const spoke1 = new THREE.Mesh(spokeGeo, metalMat);
  wheelGroup.add(spoke1);
  const spoke2 = new THREE.Mesh(spokeGeo, metalMat);
  spoke2.rotation.z = Math.PI / 2;
  wheelGroup.add(spoke2);

  const indMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    emissive: 0x661111,
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.5,
  });
  const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), indMat);
  indicator.position.set(0.32, 0.32, 0.05);
  group.add(indicator);

  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMesh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), hitMat);
  hitMesh.position.z = 0.18;
  group.add(hitMesh);

  return {
    group,
    wheelGroup,
    wheel,
    hitMesh,
    indMat,
    indicator,
    isOpen: false,
    currentAngle: 0,
    targetAngle: 0,
    index,
  };
}

function buildLever(scene, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  scene.add(group);

  const panelMat      = new THREE.MeshStandardMaterial({ color: 0x1f242e, metalness: 0.65, roughness: 0.55 });
  const leverMetalMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.80, roughness: 0.30 });
  const redLightMat   = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    emissive: 0x661111,
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.5,
  });

  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.08), panelMat);
  panel.position.z = -0.04;
  group.add(panel);

  const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), redLightMat);
  indicator.position.set(0, 0.14, 0.02);
  group.add(indicator);

  const pivot = new THREE.Group();
  pivot.position.set(0, -0.02, 0.02);
  group.add(pivot);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8), leverMetalMat);
  handleBar.position.y = 0.1;
  pivot.add(handleBar);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), redLightMat);
  knob.position.y = 0.22;
  pivot.add(knob);

  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.2), hitMat);
  hitMesh.position.z = 0.08;
  group.add(hitMesh);

  return { group, pivot, indicator, hitMesh, redLightMat, knob };
}
