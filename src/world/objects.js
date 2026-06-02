import * as THREE from 'three';
import { state } from '../core/state.js';
import { createWheelTexture, createDoorTexture, createIronFrameTexture, createWoodTexture, createGeneratorTexture, createGeneratorRoughnessMap, createGeneratorMetalnessMap, createDoorRoughnessMap, createDoorMetalnessMap, createDoorNormalMap, createGeneratorNormalMap } from './textures.js';

export function createObjects(scene, collidableBoxes, interactables, hud, movement) {
  let updateDrawerFn = null;
  let updateDoorFn = null;
  let updateCabinLockerFn = null;

  const cabinFurniture = createCabinFurniture(scene, collidableBoxes, interactables, hud, movement);
  if (cabinFurniture) {
    updateDrawerFn = cabinFurniture.updateDrawer;
    updateDoorFn = cabinFurniture.updateDoor;
    updateCabinLockerFn = cabinFurniture.updateLocker;
  }

  createMessFurniture(scene, collidableBoxes);

  let updateLockerFn = null;
  const quartersFurniture = createQuartersFurniture(scene, collidableBoxes, interactables);
  if (quartersFurniture) {
    updateLockerFn = quartersFurniture.updateLocker;
  }

  const pumps = createPumps(scene, collidableBoxes);
  const pumpRotor = pumps ? pumps.rotorMesh : null;

  createGenerator(scene, collidableBoxes);

  let updateScreensFn = null;
  const bridgeConsoles = createBridgeConsoles(scene, collidableBoxes);
  if (bridgeConsoles) {
    updateScreensFn = bridgeConsoles.updateScreens;
  }

  createMagnesiumTablets(scene, interactables, hud);

  createJournalPages(scene, interactables, hud, movement);

  createPressureValveWheel(scene, interactables, hud);

  state.dropHeldItem = dropHeldItem;

  createPipes(scene);

  return {
    update: (delta) => {
      if (updateDrawerFn) updateDrawerFn(delta);
      if (updateDoorFn) updateDoorFn(delta);
      if (updateLockerFn) updateLockerFn(delta);
      if (updateCabinLockerFn) updateCabinLockerFn(delta);
      if (updateScreensFn) updateScreensFn(state.powerRestored);
      if (state.puzzles.pressure && pumpRotor) {
        pumpRotor.rotation.z += delta * 4.5;
      }
    }
  };
}



function createCabinFurniture(scene, boxes, interactables, hud, movement) {
  const woodMat = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    metalness: 0.0,
    roughness: 0.88,
  });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xb0a896, metalness: 0.0, roughness: 0.95 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x223a30, metalness: 0.0, roughness: 0.98 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2e3b44, metalness: 0.70, roughness: 0.45 });

  const bedGroup = new THREE.Group();
  bedGroup.position.set(5.6, 0, -24.5);
  scene.add(bedGroup);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.0), woodMat);
  frame.position.y = 0.2;
  frame.castShadow = true;
  frame.receiveShadow = true;
  bedGroup.add(frame);

  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), sheetMat);
  pillow.position.set(0, 0.44, -0.75);
  bedGroup.add(pillow);

  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 1.4), blanketMat);
  blanket.position.set(0, 0.46, 0.25);
  bedGroup.add(blanket);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(5.6, 0.275, -24.5),
    new THREE.Vector3(1.2, 0.55, 2.0)
  ));

  const deskGroup = new THREE.Group();
  deskGroup.position.set(5.8, 0, -19.5);
  scene.add(deskGroup);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.6), woodMat);
  deskTop.position.y = 0.76;
  deskTop.castShadow = true;
  deskGroup.add(deskTop);

  const drawersOuter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.4), woodMat);
  drawersOuter.position.set(-0.08, 0.64, -0.5);
  drawersOuter.castShadow = true;
  deskGroup.add(drawersOuter);

  let drawerOpen = false;
  let drawerAnimating = false;
  let drawerX = 0;

  const drawerGroup = new THREE.Group();
  drawerGroup.position.set(-0.08, 0.64, -0.5);
  deskGroup.add(drawerGroup);

  const drawerBottom = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.02, 0.36), woodMat);
  drawerBottom.position.set(0, -0.05, 0);
  drawerBottom.receiveShadow = true;
  drawerGroup.add(drawerBottom);

  const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.38), woodMat.clone());
  drawerFront.position.set(-0.38, 0, 0);
  drawerFront.castShadow = true;
  drawerGroup.add(drawerFront);

  const drawerBack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.36), woodMat);
  drawerBack.position.set(0.38, 0, 0);
  drawerGroup.add(drawerBack);

  const drawerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.02), woodMat);
  drawerLeft.position.set(0, 0, -0.18);
  drawerGroup.add(drawerLeft);

  const drawerRight = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.02), woodMat);
  drawerRight.position.set(0, 0, 0.18);
  drawerGroup.add(drawerRight);

  const drawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.12), steelMat);
  drawerHandle.position.set(-0.40, 0, 0);
  drawerGroup.add(drawerHandle);

  const keyGroup = new THREE.Group();
  keyGroup.position.set(-0.2, -0.02, 0);
  keyGroup.rotation.y = Math.PI / 4;
  drawerGroup.add(keyGroup);

  const keyMat = new THREE.MeshStandardMaterial({
    map: createKeyTexture(),
    metalness: 0.75,
    roughness: 0.30,
    emissive: 0x3a2a00,
  });

  const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), keyMat);
  keyShaft.rotation.z = Math.PI / 2;
  keyGroup.add(keyShaft);

  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), keyMat);
  keyRing.position.x = 0.07;
  keyGroup.add(keyRing);

  const keyTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.03), keyMat);
  keyTeeth.position.set(-0.06, 0.01, 0);
  keyGroup.add(keyTeeth);

  const keyHitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.06, 0.2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  keyHitMesh.position.set(0, 0.02, 0);
  keyGroup.add(keyHitMesh);

  const drawerInteractable = {
    mesh: drawerFront,
    name: "Desk Drawer",
    prompt: "F: Open Drawer",
    onInteract: () => {
      if (drawerAnimating) return;
      drawerOpen = !drawerOpen;
      drawerAnimating = true;
    }
  };
  interactables.push(drawerInteractable);

  const keyInteractable = {
    mesh: keyHitMesh,
    name: "Captain's Key",
    prompt: "F: Take Captain's Key",
    onInteract: () => {
      if (state.heldItem) {
        dropHeldItem();
      }
      state.heldItem = 'captain_key';
      hud.updateStats(state);
      drawerGroup.remove(keyGroup);
      
      const idx = interactables.indexOf(keyInteractable);
      if (idx > -1) interactables.splice(idx, 1);
      
      hud.clearHovered();
      console.log("[Tiamat] Collected Captain's Key.");
    }
  };

  function updateDrawer(delta) {
    if (!drawerAnimating) {
      drawerInteractable.prompt = drawerOpen ? "F: Close Drawer" : "F: Open Drawer";
      return;
    }

    const targetX = drawerOpen ? -0.4 : -0.08;
    const diff = targetX - drawerX;

    if (Math.abs(diff) > 0.001) {
      drawerX += Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * delta);
      drawerGroup.position.x = drawerX;
    } else {
      drawerX = targetX;
      drawerGroup.position.x = drawerX;
      drawerAnimating = false;

      if (drawerOpen) {
        if (keyGroup.parent === drawerGroup && !interactables.includes(keyInteractable)) {
          interactables.push(keyInteractable);
        }
        drawerInteractable.prompt = "F: Close Drawer";
      } else {
        const idx = interactables.indexOf(keyInteractable);
        if (idx > -1) interactables.splice(idx, 1);
        drawerInteractable.prompt = "F: Open Drawer";
      }
    }
  }

  const legGeo = new THREE.BoxGeometry(0.08, 0.72, 0.08);
  [
    [-0.45, 0.36, 0.7],
    [0.45, 0.36, 0.7],
    [-0.45, 0.36, -0.7],
    [0.45, 0.36, -0.7]
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(lx, ly, lz);
    deskGroup.add(leg);
  });

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(5.8, 0.4, -19.5),
    new THREE.Vector3(1.0, 0.8, 1.6)
  ));

  const lockerMat  = new THREE.MeshStandardMaterial({ color: 0x1c2833, metalness: 0.70, roughness: 0.40 });
  const handleMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.80, roughness: 0.25 });

  const cabinLockerGroup = new THREE.Group();
  cabinLockerGroup.position.set(3.8, 0, -25.8);
  cabinLockerGroup.rotation.y = 0;
  scene.add(cabinLockerGroup);

  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.38), lockerMat);
  wallL.position.set(-0.24, 0.9, 0.0);
  wallL.castShadow = true;
  wallL.receiveShadow = true;
  cabinLockerGroup.add(wallL);

  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.38), lockerMat);
  wallR.position.set(0.24, 0.9, 0.0);
  wallR.castShadow = true;
  wallR.receiveShadow = true;
  cabinLockerGroup.add(wallR);

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.02), lockerMat);
  wallBack.position.set(0, 0.9, -0.19);
  wallBack.castShadow = true;
  wallBack.receiveShadow = true;
  cabinLockerGroup.add(wallBack);

  const wallTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.38), lockerMat);
  wallTop.position.set(0, 1.79, 0.0);
  wallTop.castShadow = true;
  wallTop.receiveShadow = true;
  cabinLockerGroup.add(wallTop);

  const wallBot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.38), lockerMat);
  wallBot.position.set(0, 0.01, 0.0);
  wallBot.castShadow = true;
  wallBot.receiveShadow = true;
  cabinLockerGroup.add(wallBot);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.36), lockerMat);
  shelf.position.set(0, 0.9, 0.0);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  cabinLockerGroup.add(shelf);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.24, 0.9, 0.19);
  cabinLockerGroup.add(doorPivot);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.76, 0.02), steelMat);
  panel.position.set(0.23, 0, 0.01);
  panel.castShadow = true;
  panel.receiveShadow = true;
  doorPivot.add(panel);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.03), handleMat);
  handle.position.set(0.18, 0.05, 0.025);
  panel.add(handle);

  const darkSlitMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.1, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.005), darkSlitMat);
    slit.position.set(0, 0.7 - i * 0.03, 0.011);
    panel.add(slit);
  }

  let lockerOpen = false;
  let lockerAngle = 0;
  let targetLockerAngle = 0;

  const lockerInteractable = {
    mesh: panel,
    name: "Captain's Locker",
    get prompt() {
      return lockerOpen ? 'F: Close Locker' : 'F: Open Locker';
    },
    onInteract: () => {
      lockerOpen = !lockerOpen;
      targetLockerAngle = lockerOpen ? Math.PI * -0.65 : 0.0;
      console.log(`[Tiamat] Captain Locker open state: ${lockerOpen}`);
    }
  };
  interactables.push(lockerInteractable);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(3.8, 0.9, -25.8),
    new THREE.Vector3(0.5, 1.8, 0.4)
  ));

  const cabinDoorGroup = new THREE.Group();
  cabinDoorGroup.position.set(1.5, 0, -23.0);
  scene.add(cabinDoorGroup);

  const cabinDoorTex = createDoorTexture();
  const cabinDoorMat = new THREE.MeshStandardMaterial({
    map: cabinDoorTex,
    bumpMap: cabinDoorTex,
    bumpScale: 0.016,
    roughnessMap: createDoorRoughnessMap(),
    metalnessMap: createDoorMetalnessMap(),
    normalMap: createDoorNormalMap(),
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0x667686,
    metalness: 1.0,
    roughness: 1.0,
  });

  const cabinDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.0), cabinDoorMat);
  cabinDoorMesh.position.set(0, 1.3, 1.0);
  cabinDoorMesh.castShadow = true;
  cabinDoorMesh.receiveShadow = true;
  cabinDoorGroup.add(cabinDoorMesh);



  const rivetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8);
  rivetGeo.rotateZ(Math.PI / 2);
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x4a5560,
    metalness: 0.85,
    roughness: 0.25,
  });

  const addCabinDoorRivets = (faceX) => {
    for (let z = 0.1; z <= 1.9; z += 0.2) {
      [0.1, 2.5].forEach(y => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(faceX, y, z);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        cabinDoorGroup.add(rivet);
      });
    }
    for (let y = 0.3; y <= 2.3; y += 0.2) {
      [0.1, 1.9].forEach(z => {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(faceX, y, z);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        cabinDoorGroup.add(rivet);
      });
    }
  };

  addCabinDoorRivets(0.052);
  addCabinDoorRivets(-0.052);

  const cabinFrameMat = new THREE.MeshStandardMaterial({
    map: createIronFrameTexture(),
    color: 0x404a54,
    metalness: 0.65,
    roughness: 0.60,
  });

  const viewPortFrame = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), cabinFrameMat);
  viewPortFrame.rotation.y = Math.PI / 2;
  viewPortFrame.position.set(0, 1.6, 1.0);
  cabinDoorGroup.add(viewPortFrame);

  const viewPortBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), cabinFrameMat);
  viewPortBar.position.set(0, 1.6, 1.0);
  cabinDoorGroup.add(viewPortBar);

  const wheelMat = new THREE.MeshStandardMaterial({
    map: createWheelTexture(),
    metalness: 0.75,
    roughness: 0.30,
  });
  [-0.07, 0.07].forEach(offset => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), wheelMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(offset, 1.2, 1.0);
    cabinDoorGroup.add(wheel);
  });

  const cabinDoorCollision = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(1.5, 1.3, -22.0),
    new THREE.Vector3(0.2, 2.6, 2.0)
  );
  boxes.push(cabinDoorCollision);

  let doorUnlocked = false;
  let doorOpen = false;
  let doorAnimating = false;
  let doorAngle = 0;

  const doorInteractable = {
    mesh: cabinDoorMesh,
    name: "Cabin Door",
    prompt: "Locked (Requires Key)",
    onInteract: () => {
      if (doorAnimating) return;

      if (!doorUnlocked) {
        if (state.heldItem === 'captain_key') {
          doorUnlocked = true;
          state.heldItem = null;
          hud.updateStats(state);
          doorOpen = true;
          doorAnimating = true;
          doorInteractable.prompt = null;

          const idx = boxes.indexOf(cabinDoorCollision);
          if (idx > -1) boxes.splice(idx, 1);

          console.log("[Tiamat] Cabin door unlocked using Captain's Key.");
        } else {
          console.log("[Tiamat] Cabin door is locked. Requires Captain's Key.");
          hud.setHovered("Cabin Door", "Locked (Requires Key)");
        }
      }
    }
  };
  interactables.push(doorInteractable);

  function updateDoor(delta) {
    if (!doorUnlocked) {
      if (state.heldItem === 'captain_key') {
        doorInteractable.prompt = "F: Unlock Cabin Door";
      } else {
        doorInteractable.prompt = "Locked (Requires Key)";
      }
    }

    if (doorAnimating) {
      const targetAngle = doorOpen ? Math.PI / 2 : 0;
      const diff = targetAngle - doorAngle;
      if (Math.abs(diff) > 0.001) {
        doorAngle += Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * delta);
        cabinDoorGroup.rotation.y = doorAngle;
      } else {
        doorAngle = targetAngle;
        cabinDoorGroup.rotation.y = doorAngle;
        doorAnimating = false;

        if (doorOpen) {
          const idx = interactables.indexOf(doorInteractable);
          if (idx > -1) interactables.splice(idx, 1);
        }
      }
    }
  }

  function updateCabinLocker(delta) {
    const diff = targetLockerAngle - lockerAngle;
    if (Math.abs(diff) > 0.001) {
      lockerAngle += diff * Math.min(1, 8 * delta);
      doorPivot.rotation.y = lockerAngle;
    } else {
      lockerAngle = targetLockerAngle;
      doorPivot.rotation.y = lockerAngle;
    }
  }

  return { updateDrawer, updateDoor, updateLocker: updateCabinLocker };
}


function createMessFurniture(scene, boxes) {
  const woodMat = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    metalness: 0.0,
    roughness: 0.88,
  });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1f272e, metalness: 0.65, roughness: 0.55 });

  const buildDiningSet = (tx, tz) => {
    const setGroup = new THREE.Group();
    setGroup.position.set(tx, 0, tz);
    setGroup.rotation.y = Math.PI / 2;
    scene.add(setGroup);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 2.8), woodMat);
    tableTop.position.y = 0.86;
    tableTop.castShadow = true;
    setGroup.add(tableTop);

    const supportGeo = new THREE.BoxGeometry(0.08, 0.82, 0.8);
    const s1 = new THREE.Mesh(supportGeo, steelMat);
    s1.position.set(0, 0.41, -1.0);
    s1.castShadow = true;
    setGroup.add(s1);

    const s2 = new THREE.Mesh(supportGeo, steelMat);
    s2.position.set(0, 0.41, 1.0);
    s2.castShadow = true;
    setGroup.add(s2);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(tx, 0.45, tz),
      new THREE.Vector3(2.8, 0.9, 1.0)
    ));

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 2.8), woodMat);
    b1.position.set(-0.7, 0.48, 0);
    b1.castShadow = true;
    setGroup.add(b1);

    const bs1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.06), steelMat);
    bs1.position.set(-0.7, 0.225, 0);
    setGroup.add(bs1);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(tx, 0.25, tz - 0.7),
      new THREE.Vector3(2.8, 0.5, 0.35)
    ));

    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 2.8), woodMat);
    b2.position.set(0.7, 0.48, 0);
    b2.castShadow = true;
    setGroup.add(b2);

    const bs2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.06), steelMat);
    bs2.position.set(0.7, 0.225, 0);
    setGroup.add(bs2);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(tx, 0.25, tz + 0.7),
      new THREE.Vector3(2.8, 0.5, 0.35)
    ));
  };

  buildDiningSet(-4.5, -15); 
  buildDiningSet(-4.5, -11); 
}



function createQuartersFurniture(scene, boxes, interactables) {
  const steelMat   = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.70, roughness: 0.50 });
  const woodMat    = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    metalness: 0.0,
    roughness: 0.88,
  });
  const sheetMat   = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.0, roughness: 0.95 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x1a3a2a, metalness: 0.0, roughness: 0.98 });
  const lockerMat  = new THREE.MeshStandardMaterial({ color: 0x1c2833, metalness: 0.70, roughness: 0.40 });
  const handleMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.80, roughness: 0.25 });

  const buildBunk = (bx, bz, facingNorth) => {
    const g = new THREE.Group();
    g.position.set(bx, 0, bz);
    scene.add(g);

    [[-0.45, -0.9], [0.45, -0.9], [-0.45, 0.9], [0.45, 0.9]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 0.06), steelMat);
      post.position.set(px, 1.0, pz);
      post.castShadow = true;
      g.add(post);
    });

    const lFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 2.0), woodMat);
    lFrame.position.set(0, 0.55, 0); lFrame.castShadow = true; g.add(lFrame);
    const lMat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.10, 1.8), sheetMat);
    lMat.position.set(0, 0.63, 0); g.add(lMat);
    const lBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.7), blanketMat);
    lBlanket.position.set(0, 0.74, facingNorth ? 0.5 : -0.5); g.add(lBlanket);

    const uFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 2.0), woodMat);
    uFrame.position.set(0, 1.55, 0); uFrame.castShadow = true; g.add(uFrame);
    const uMat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.10, 1.8), sheetMat);
    uMat.position.set(0, 1.63, 0); g.add(uMat);
    const uBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.7), blanketMat);
    uBlanket.position.set(0, 1.74, facingNorth ? 0.5 : -0.5); g.add(uBlanket);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.04), steelMat);
    rail.position.set(0, 1.74, facingNorth ? -0.9 : 0.9); g.add(rail);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(bx, 1.0, bz), new THREE.Vector3(1.0, 2.0, 2.0)
    ));
  };

  buildBunk(2.6, -17.0, false);
  buildBunk(5.6, -17.0, false);

  buildBunk(2.6, -9.0, true);
  buildBunk(5.6, -9.0, true);

  const lockerUpdates = [];

  const buildLocker = (lx, lz, isWest) => {
    const lg = new THREE.Group();
    lg.position.set(lx, 0, lz);
    if(isWest){
      lg.rotation.y = -Math.PI / 2; 
    } else {
      lg.rotation.y = Math.PI / 2; 
    }
    scene.add(lg);

    // Left wall of locker
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.38), lockerMat);
    wallL.position.set(-0.24, 0.9, 0.0);
    wallL.castShadow = true;
    wallL.receiveShadow = true;
    lg.add(wallL);

    // Right wall of locker
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.38), lockerMat);
    wallR.position.set(0.24, 0.9, 0.0);
    wallR.castShadow = true;
    wallR.receiveShadow = true;
    lg.add(wallR);

    // Back wall
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.02), lockerMat);
    wallBack.position.set(0, 0.9, -0.19);
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    lg.add(wallBack);

    // Top wall
    const wallTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.38), lockerMat);
    wallTop.position.set(0, 1.79, 0.0);
    wallTop.castShadow = true;
    wallTop.receiveShadow = true;
    lg.add(wallTop);

    // Bottom wall
    const wallBot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.38), lockerMat);
    wallBot.position.set(0, 0.01, 0.0);
    wallBot.castShadow = true;
    wallBot.receiveShadow = true;
    lg.add(wallBot);

    // Shelf in the middle horizontally splitting it
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.36), lockerMat);
    shelf.position.set(0, 0.9, 0.0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    lg.add(shelf);

    // Door pivot (hinge at the left-front corner)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.24, 0.9, 0.19);
    lg.add(doorPivot);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.76, 0.02), steelMat);
    panel.position.set(0.23, 0, 0.01);
    panel.castShadow = true;
    panel.receiveShadow = true;
    doorPivot.add(panel);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.03), handleMat);
    handle.position.set(0.18, 0.05, 0.025);
    panel.add(handle);

    const darkSlitMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.1, roughness: 0.8 });
    for (let i = 0; i < 3; i++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.005), darkSlitMat);
      slit.position.set(0, 0.7 - i * 0.03, 0.011);
      panel.add(slit);
    }

    let isOpen = false;
    let currentAngle = 0;
    let targetAngle = 0;

    const lockerItem = {
      mesh: panel,
      name: 'Crew Locker',
      get prompt() {
        return isOpen ? 'F: Close Locker' : 'F: Open Locker';
      },
      onInteract: () => {
        isOpen = !isOpen;
        targetAngle = isOpen ? Math.PI * -0.65 : 0.0;
        console.log(`[Tiamat] Locker open state: ${isOpen}`);
      }
    };
    interactables.push(lockerItem);

    lockerUpdates.push((delta) => {
      const diff = targetAngle - currentAngle;
      if (Math.abs(diff) > 0.001) {
        currentAngle += diff * Math.min(1, 8 * delta);
        doorPivot.rotation.y = currentAngle;
      } else {
        currentAngle = targetAngle;
        doorPivot.rotation.y = currentAngle;
      }
    });

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(lx, 0.9, lz),
      new THREE.Vector3(0.5, 1.8, 0.4)
    ));
  };

  buildLocker(1.8, -15.0, false);
  buildLocker(7.2, -15.0, true);
  buildLocker(1.8, -11.0, false);
  buildLocker(6.8, -11.0, true);

  const buildTable = (tx, tz, stoolSide) => {
    const tg = new THREE.Group();
    tg.position.set(tx, 0, tz);
    scene.add(tg);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.65), woodMat);
    top.position.y = 0.76; top.castShadow = true;
    tg.add(top);

    [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.76, 0.05), steelMat);
      leg.position.set(px, 0.38, pz);
      tg.add(leg);
    });

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8), woodMat);
    seat.position.set(0, 0.44, stoolSide * 0.52);
    tg.add(seat);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 6), steelMat);
    post.position.set(0, 0.22, stoolSide * 0.52);
    tg.add(post);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(tx, 0.38, tz),
      new THREE.Vector3(1.4, 0.76, 0.65)
    ));
  };

  buildTable(4.1, -17.5, +1);
  buildTable(4.1, -8.5, -1);

  return {
    updateLocker: (delta) => {
      lockerUpdates.forEach(update => update(delta));
    }
  };
}



function createPumps(scene, boxes) {
  const floorY = -4;
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x1f353a, metalness: 0.75, roughness: 0.45 });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x5a2d1b, metalness: 0.30, roughness: 0.90 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.80, roughness: 0.30 });

  const buildPump = (px, pz) => {
    const pumpGroup = new THREE.Group();
    pumpGroup.position.set(px, floorY, pz);
    scene.add(pumpGroup);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), rustMat);
    base.position.y = 0.3;
    base.castShadow = true;
    base.receiveShadow = true;
    pumpGroup.add(base);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 12), pumpMat);
    body.position.y = 1.5;
    body.castShadow = true;
    pumpGroup.add(body);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), pumpMat);
    dome.position.y = 2.4;
    pumpGroup.add(dome);

    const cPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), rustMat);
    cPipe.position.y = 2.9;
    pumpGroup.add(cPipe);

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(px, floorY + 1.25, pz),
      new THREE.Vector3(0.9, 2.5, 0.9)
    ));
  };

  buildPump(0.0, 0.5);
  buildPump(0.0, 3.0);

  const specialPumpGroup = new THREE.Group();
  specialPumpGroup.position.set(3.5, floorY, 4.0);
  scene.add(specialPumpGroup);

  const spBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), rustMat);
  spBase.position.y = 0.4;
  spBase.castShadow = true;
  spBase.receiveShadow = true;
  specialPumpGroup.add(spBase);

  const spBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 12), pumpMat);
  spBody.position.y = 1.4;
  spBody.castShadow = true;
  specialPumpGroup.add(spBody);

  const spDome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), pumpMat);
  spDome.position.y = 2.4;
  specialPumpGroup.add(spDome);

  const spPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 1.2, 8), rustMat);
  spPipe.position.y = 3.0;
  specialPumpGroup.add(spPipe);

  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(-0.48, 1.4, 0);
  rotorGroup.rotation.y = Math.PI / 2; 
  specialPumpGroup.add(rotorGroup);

  const rotorWheel = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 24), steelMat);
  rotorGroup.add(rotorWheel);

  const bladeGeo = new THREE.BoxGeometry(0.7, 0.06, 0.02);
  const blade1 = new THREE.Mesh(bladeGeo, steelMat);
  rotorGroup.add(blade1);
  const blade2 = new THREE.Mesh(bladeGeo, steelMat);
  blade2.rotation.z = Math.PI / 2;
  rotorGroup.add(blade2);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(3.5, floorY + 1.5, 4.0),
    new THREE.Vector3(1.2, 3.0, 1.2)
  ));

  return { rotorMesh: rotorGroup };
}


function createGenerator(scene, boxes) {
  const floorY = -4;
  const genX = -6.5;
  const genZ = 5.0;

  const genTex = createGeneratorTexture();
  const steelMat = new THREE.MeshStandardMaterial({
    map: genTex,
    bumpMap: genTex,
    bumpScale: 0.012,
    roughnessMap: createGeneratorRoughnessMap(),
    metalnessMap: createGeneratorMetalnessMap(),
    normalMap: createGeneratorNormalMap(),
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0xbbbbbb,
    metalness: 1.0,
    roughness: 1.0,
  });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0x55606a, metalness: 0.85, roughness: 0.20 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2124, metalness: 0.65, roughness: 0.60 });

  const genGroup = new THREE.Group();
  genGroup.name = "generator";
  genGroup.position.set(genX, floorY, genZ);
  scene.add(genGroup);

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.8), ironMat);
  foundation.position.y = 0.3;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  genGroup.add(foundation);

  const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.4, 16), steelMat);
  stator.rotation.z = Math.PI / 2;
  stator.position.set(0, 1.2, 0);
  stator.castShadow = true;
  genGroup.add(stator);

  const windings = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.4, 16), copperMat);
  windings.rotation.z = Math.PI / 2;
  windings.position.set(0, 1.2, 0);
  genGroup.add(windings);

  // 1. Physical 3D metal reinforcement bands/rings around the stator
  const bandGeo = new THREE.CylinderGeometry(0.692, 0.692, 0.08, 16);
  const bandPositions = [-0.9, -0.4, 0.4, 0.9];
  bandPositions.forEach(xPos => {
    const band = new THREE.Mesh(bandGeo, ironMat);
    band.rotation.z = Math.PI / 2;
    band.position.set(xPos, 1.2, 0);
    band.castShadow = true;
    band.receiveShadow = true;
    genGroup.add(band);
    
    // Physical 3D bolts/rivets on each band
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 6), ironMat);
      // Place bolt radially on the band's surface
      bolt.position.set(
        xPos,
        1.2 + Math.cos(a) * 0.695,
        Math.sin(a) * 0.695
      );
      // Rotate bolt to align with surface normal
      bolt.rotation.x = a;
      bolt.rotation.z = Math.PI / 2;
      bolt.castShadow = true;
      genGroup.add(bolt);
    }
  });

  // 2. Physical 3D cooling fins/grills along the top of the stator cylinder
  const finGeo = new THREE.BoxGeometry(1.6, 0.04, 0.015);
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i) < 2) continue; // skip center winding gap
    const angle = (i * 12 * Math.PI) / 180; // distribute on the upper curve
    const fin = new THREE.Mesh(finGeo, ironMat);
    fin.position.set(0, 1.2 + Math.cos(angle) * 0.685, Math.sin(angle) * 0.685);
    fin.rotation.x = angle;
    fin.castShadow = true;
    fin.receiveShadow = true;
    genGroup.add(fin);
  }

  const controlBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), steelMat);
  controlBox.position.set(-0.8, 2.0, 0);
  controlBox.castShadow = true;
  controlBox.receiveShadow = true;
  genGroup.add(controlBox);

  // 3. Physical 3D nameplate on the control box front face (facing towards -x direction / corridor)
  const plateGeo = new THREE.BoxGeometry(0.015, 0.22, 0.42);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x8a959d, metalness: 0.85, roughness: 0.20 });
  const physicalPlate = new THREE.Mesh(plateGeo, plateMat);
  physicalPlate.position.set(-1.208, 2.0, 0); // slightly protruding from controlBox side (centered at x = -0.8, half-width is 0.4 -> edge is at -1.2)
  physicalPlate.castShadow = true;
  genGroup.add(physicalPlate);

  // Add 3D bolts on the corners of the nameplate
  const plateBoltGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.012, 6);
  plateBoltGeo.rotateZ(Math.PI / 2);
  const boltsOffsets = [
    [0.08, 0.17], [0.08, -0.17], [-0.08, 0.17], [-0.08, -0.17]
  ];
  boltsOffsets.forEach(([dy, dz]) => {
    const pBolt = new THREE.Mesh(plateBoltGeo, ironMat);
    pBolt.position.set(-1.215, 2.0 + dy, dz);
    pBolt.castShadow = true;
    genGroup.add(pBolt);
  });

  const slotMat = new THREE.MeshStandardMaterial({ color: 0x1a2620, metalness: 0.65, roughness: 0.55 });
  const slot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), slotMat);
  slot.name = "generator_slot";
  slot.rotation.z = Math.PI / 2;
  slot.position.set(-0.4, 2.0, 0);
  genGroup.add(slot);

  const flywheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 16), ironMat);
  flywheel.rotation.y = Math.PI / 2;
  flywheel.position.set(1.24, 1.2, 0);
  flywheel.castShadow = true;
  genGroup.add(flywheel);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(genX, floorY + 1.1, genZ),
    new THREE.Vector3(3.6, 2.2, 1.8)
  ));
}


function createBridgeConsoles(scene, boxes) {
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1a232a, metalness: 0.75, roughness: 0.40 });
  const screenBorderMat = new THREE.MeshStandardMaterial({ color: 0x080c10, metalness: 0.50, roughness: 0.70 });
  
  const neonMat = (colorHex) => new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.0,
    metalness: 0.0,
    roughness: 0.5,
  });

  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-6.5, 0, 7.4);
  consoleGroup.rotation.y = Math.PI;
  scene.add(consoleGroup);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 0.8), steelMat);
  desk.position.y = 0.45;
  desk.castShadow = true;
  desk.receiveShadow = true;
  consoleGroup.add(desk);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(-6.5, 0.45, 7.4),
    new THREE.Vector3(5.0, 0.9, 0.8)
  ));

  const screenPositions = [-1.5, 1.5];
  const screenColors = [0x00ffcc, 0xff3366];
  const materials = [];
  
  screenPositions.forEach((sx, idx) => {
    const scrGroup = new THREE.Group();
    scrGroup.position.set(sx, 0.9, 0.0);
    scrGroup.rotation.x = -0.35;
    consoleGroup.add(scrGroup);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), screenBorderMat);
    frame.position.y = 0.25;
    scrGroup.add(frame);

    const mat = neonMat(screenColors[idx]);
    materials.push(mat);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), mat);
    screen.position.set(0, 0.25, 0.041);
    scrGroup.add(screen);
  });

  return {
    updateScreens: (powerRestored) => {
      materials.forEach(mat => {
        mat.emissiveIntensity = powerRestored ? 1.5 : 0.0;
      });
    }
  };
}


function createMagnesiumTablets(scene, interactables, hud) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#aaffbb';
  ctx.fillRect(0, 0, 64, 64);
  
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const radius = 0.5 + Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#33cc66';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const magTexture = new THREE.CanvasTexture(canvas);

  const crystalMat = new THREE.MeshStandardMaterial({
    map: magTexture,
    emissive: 0x33cc66,
    emissiveIntensity: 0.5,
    metalness: 0.10,
    roughness: 0.55,
  });

  const placements = [
    { x: 5.7,   y: 0.83,  z: -19.5, name: 'Magnesium Tablet (Desk)' },
    { x: -4.5,  y: 0.93,  z: -15.0, name: 'Magnesium Tablet (Table)' },
    { x: 1.3,   y: -3.94, z: 1.5,   name: 'Magnesium Tablet (Flooded Pump)' },
    { x: -9.0,  y: -3.94, z: 3.5,   name: 'Magnesium Tablet (Generator)' },
    { x: -7.0,  y: 0.93,  z: 7.35,  name: 'Magnesium Tablet (Console)' },
    { x: 4.3,   y: 0.83,  z: -17.5, name: 'Magnesium Tablet (Crew Quarters)' }
  ];

  placements.forEach((p, idx) => {
    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(p.x, p.y, p.z);
    scene.add(tabletGroup);

    const instanceMat = crystalMat.clone();
    
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), instanceMat);
    cap.rotation.z = Math.PI / 2;
    cap.rotation.y = Math.PI / 4;
    tabletGroup.add(cap);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 12), instanceMat);
    ring.rotation.x = Math.PI / 2;
    tabletGroup.add(ring);

    const tabletItem = {
      mesh: cap,
      highlightMesh: ring,
      name: 'Magnesium Flakes',
      prompt: 'F: Collect Magnesium',
      onInteract: () => {
        state.magnesiumCount += 1;
        hud.updateStats(state);
        
        scene.remove(tabletGroup);

        const idxInList = interactables.indexOf(tabletItem);
        if (idxInList > -1) interactables.splice(idxInList, 1);

        hud.clearHovered();
        console.log(`[Tiamat] Collected magnesium. Total: ${state.magnesiumCount}`);
      }
    };

    interactables.push(tabletItem);
  });
}


function createJournalPages(scene, interactables, hud, movement) {
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xeee4cc,
    emissive: 0x111111,
    metalness: 0.0,
    roughness: 0.95,
  });

  const pages = [
    {
      id: 'captain',
      x: 5.9, y: 0.81, z: -19.5,
      rotY: 0.12,
      title: "Captain's Log — May 24, 2026",
      text: `MAY 24, 2026.
The engine pressure has been failing consistently. The auxiliary generator on the lower deck is leaking coolant, flooding the entire pump room. 

I've locked the East corridor bulkheads to contain the noise from Section 4. They've been screaming all night. The quarantine must hold.`
    },
    {
      id: 'engineer',
      x: -4.5, y: 0.91, z: -11.0,
      rotY: -0.3,
      title: "Engineer's Notes — Restoring Power",
      text: `TO RESTORE MAIN POWER:
1. Calibrate the hydraulic pressure system using the regulator gauge on the lower deck to 6.0 ±0.2 Bar. Yılmaz took the primary regulator wheel to the crew quarters before Section 4 locked down. Check his bunk.
2. Once the pressure is stabilized, the main drainage valves will unlock. Align them to clear the turbine blockage (keep the middle valve closed, but open the left and right valves).
3. Pull the drainage lever to empty the room, then head to the generator room and reset the breaker panel.

If Section 4 breaks loose, may God help us.`
    },
    {
      id: 'bridge',
      x: -6.0, y: 0.91, z: 7.35,
      rotY: 0.2,
      title: "Bridge Log — System Lockdown",
      text: `WARNING: COMPLETE SYSTEMS LOCK ACTIVE.
The escape hatch control panel requires a final color-sequence synchronization code. 

The security protocols require the primary breaker coil to remain locked. If the breaker is pulled, it will trigger an automatic release of the quarantine lock doors. The madness must not spread to the bridge.`
    },
    {
      id: 'manifest',
      x: 5.6, y: 0.69, z: -9.1,
      rotY: 1,
      title: "Crew Manifest Note",
      text: `DAY 19 ABOARD TIAMAT.
Something is wrong with the men in Section 4. They stopped eating three days ago. The sounds they make don't sound human anymore. I can hear them scratching the bulkhead from the inside.

I couldn't leave the regulator wheel exposed. It's not safe to leave anything out in the open.

— Machinist Yılmaz`
    },
    {
      id: 'medical',
      x: -3.9, y: 0.91, z: -15.0,
      rotY: 0.4,
      title: "Medical Memo — Sanity & Rations",
      text: `MEMORANDUM FOR ALL TIAMAT CREW.
Due to prolonged deep-sea quarantine, symptoms of severe acute panic and psychological degradation have been reported across Section 4.

Emergency Magnesium tablet rations have been placed at crew tables and consoles. Using these rations will temporarily steady your nerves when the darkness or claustrophobia gets too intense.

WARNING: Our medical supplies are extremely limited. Do not consume them unless absolutely necessary when you feel your mind slipping. You'll need to stay sharp.

— Dr. Aris, Chief Medical Officer`
    }
  ];

  pages.forEach((p, idx) => {
    const pageMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), paperMat.clone());
    pageMesh.rotation.x = -Math.PI / 2;
    pageMesh.rotation.z = p.rotY;
    pageMesh.position.set(p.x, p.y, p.z);
    scene.add(pageMesh);

    const journalItem = {
      mesh: pageMesh,
      name: 'Discarded Journal Entry',
      prompt: 'F: Read Log',
      onInteract: () => {
        hud.showJournal(p.title, p.text, () => {
          movement.controls.lock();
        });

        if (p.id) {
          state.readNotes[p.id] = true;
          console.log(`[Tiamat] Note read: ${p.id}`);
        }

        document.exitPointerLock();
      }
    };

    interactables.push(journalItem);
  });
}


function createPipes(scene) {
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0x3b4a54,
    metalness: 0.80,
    roughness: 0.35,
  });
  const brassValveMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a2b,
    metalness: 0.75,
    roughness: 0.30,
  });

  [-6.2, -2.8].forEach(x => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 10.0, 10), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 3.0, -13.0);
    scene.add(pipe);
  });

  const cornerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 10), pipeMat);
  cornerPipe.position.set(-7.3, 1.6, -17.5);
  scene.add(cornerPipe);

  const valveJoint = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 12), brassValveMat);
  valveJoint.rotation.x = Math.PI / 2;
  valveJoint.position.set(-7.3, 1.8, -17.5);
  scene.add(valveJoint);

  const vertPipeFlooded = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.99, 10), pipeMat);
  vertPipeFlooded.position.set(1.3, -2.0, 2.5);
  scene.add(vertPipeFlooded);

  const generatorCeilPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 10.0, 10), pipeMat);
  generatorCeilPipe.rotation.z = Math.PI / 2;
  generatorCeilPipe.position.set(-6.5, -0.1, 7.5);
  scene.add(generatorCeilPipe);
}

function createPressureValveWheel(scene, interactables, hud) {
  const brassMat = new THREE.MeshStandardMaterial({
    map: createWheelTexture(),
    metalness: 0.75,
    roughness: 0.30,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x5a6a7a,
    metalness: 0.75,
    roughness: 0.40,
  });

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(1.8, 0.92, -15.0);
  wheelGroup.rotation.x = Math.PI / 2;
  scene.add(wheelGroup);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16), steelMat);
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12), brassMat);
    spoke.rotation.z = angle;
    spoke.position.set(0.06 * Math.sin(angle), 0.06 * Math.cos(angle), 0);
    wheelGroup.add(spoke);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), brassMat);
    knob.position.set(0.12 * Math.sin(angle), 0.12 * Math.cos(angle), 0);
    wheelGroup.add(knob);
  }

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.08),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  wheelGroup.add(hitMesh);

  const wheelItem = {
    mesh: hitMesh,
    highlightMesh: wheelGroup,
    name: 'Regulator Valve Wheel',
    prompt: 'F: Take Regulator Wheel',
    onInteract: () => {
      if (state.heldItem) {
        dropHeldItem();
      }
      state.heldItem = 'pressure_valve_wheel';
      hud.updateStats(state);
      scene.remove(wheelGroup);

      const idx = interactables.indexOf(wheelItem);
      if (idx > -1) interactables.splice(idx, 1);
      hud.clearHovered();
      console.log("[Tiamat] Collected Pressure Valve Wheel.");
    }
  };
  interactables.push(wheelItem);
}

export function dropHeldItem() {
  if (!state.heldItem) return;
  const itemToDrop = state.heldItem;
  state.heldItem = null;
  state.hud.updateStats(state);

  const px = state.camera.position.x;
  const pz = state.camera.position.z;
  const py = state.camera.position.y < -0.5 ? -4.0 : 0.0;

  const dir = new THREE.Vector3();
  state.camera.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();

  const dropX = px + dir.x * 0.15;
  const dropZ = pz + dir.z * 0.15;
  const dropY = py;

  spawnDroppedItem(itemToDrop, state.scene, state.interactables, state.hud, dropX, dropY, dropZ);
}

export function spawnDroppedItem(itemType, scene, interactables, hud, x, y, z) {
  if (itemType === 'captain_key') {
    const keyGroup = new THREE.Group();
    keyGroup.position.set(x, y + 0.05, z);
    scene.add(keyGroup);

    const keyMat = new THREE.MeshStandardMaterial({ map: createKeyTexture(), metalness: 0.75, roughness: 0.30, emissive: 0x3a2a00 });

    const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), keyMat);
    keyShaft.rotation.z = Math.PI / 2;
    keyGroup.add(keyShaft);

    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), keyMat);
    keyRing.position.x = 0.07;
    keyGroup.add(keyRing);

    const keyTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.03), keyMat);
    keyTeeth.position.set(-0.06, 0.01, 0);
    keyGroup.add(keyTeeth);

    const keyHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.06, 0.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    keyHitMesh.position.set(0, 0.02, 0);
    keyGroup.add(keyHitMesh);

    const keyItem = {
      mesh: keyHitMesh,
      highlightMesh: keyGroup,
      name: "Captain's Key",
      prompt: "F: Take Captain's Key",
      onInteract: () => {
        if (state.heldItem) {
          dropHeldItem();
        }
        state.heldItem = 'captain_key';
        hud.updateStats(state);
        scene.remove(keyGroup);

        const idx = interactables.indexOf(keyItem);
        if (idx > -1) interactables.splice(idx, 1);
        hud.clearHovered();
        console.log("[Tiamat] Collected Captain's Key.");
      }
    };
    interactables.push(keyItem);

  } else if (itemType === 'pressure_valve_wheel') {
    const brassMat = new THREE.MeshStandardMaterial({ map: createWheelTexture(), metalness: 0.75, roughness: 0.30 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.75, roughness: 0.40 });

    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y + 0.05, z);
    scene.add(wheelGroup);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16), steelMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12), brassMat);
      spoke.rotation.z = angle;
      spoke.position.set(0.06 * Math.sin(angle), 0.06 * Math.cos(angle), 0);
      wheelGroup.add(spoke);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), brassMat);
      knob.position.set(0.12 * Math.sin(angle), 0.12 * Math.cos(angle), 0);
      wheelGroup.add(knob);
    }

    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.24, 0.08),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    wheelGroup.add(hitMesh);

    const wheelItem = {
      mesh: hitMesh,
      highlightMesh: wheelGroup,
      name: 'Regulator Valve Wheel',
      prompt: 'F: Take Regulator Wheel',
      onInteract: () => {
        if (state.heldItem) {
          dropHeldItem();
        }
        state.heldItem = 'pressure_valve_wheel';
        hud.updateStats(state);
        scene.remove(wheelGroup);

        const idx = interactables.indexOf(wheelItem);
        if (idx > -1) interactables.splice(idx, 1);
        hud.clearHovered();
        console.log("[Tiamat] Collected Regulator Valve Wheel.");
      }
    };
    interactables.push(wheelItem);

  } else if (itemType === 'generator_coil') {
    const copperMat = new THREE.MeshStandardMaterial({ map: createCoilTexture(), metalness: 0.75, roughness: 0.30, emissive: 0x3a1a00 });
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.65, roughness: 0.55 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x33ff66, emissive: 0x33ff66, emissiveIntensity: 0.8, metalness: 0.0, roughness: 0.5 });

    const coilGroup = new THREE.Group();
    coilGroup.position.set(x, y + 0.08, z);
    scene.add(coilGroup);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 12), coreMat);
    core.rotation.z = Math.PI / 2;
    coilGroup.add(core);

    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), copperMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = -0.10 + i * 0.05;
      coilGroup.add(ring);
    }

    const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), glowMat);
    indicator.position.set(0, 0.05, 0);
    coilGroup.add(indicator);

    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    coilGroup.add(hitMesh);

    const coilItem = {
      mesh: hitMesh,
      highlightMesh: coilGroup,
      name: "Generator Coil",
      prompt: "F: Take Generator Coil",
      onInteract: () => {
        if (state.heldItem) {
          dropHeldItem();
        }
        state.heldItem = 'generator_coil';
        hud.updateStats(state);
        scene.remove(coilGroup);

        const idx = interactables.indexOf(coilItem);
        if (idx > -1) interactables.splice(idx, 1);
        hud.clearHovered();
        console.log("[Tiamat] Collected Generator Coil.");
      }
    };
    interactables.push(coilItem);
  }
}

function createKeyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 128, 64);
  grad.addColorStop(0, '#ffe893');
  grad.addColorStop(0.3, '#d4af37');
  grad.addColorStop(0.7, '#b28d24');
  grad.addColorStop(1, '#70540c');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 64);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 10; i++) {
    const y = Math.random() * 64;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createCoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b87333';
  ctx.fillRect(0, 0, 128, 128);

  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = '#e08544';
    ctx.fillRect(0, y, 128, 2);

    ctx.fillStyle = '#4a1f11';
    ctx.fillRect(0, y + 2, 128, 2);
  }

  return new THREE.CanvasTexture(canvas);
}
