import * as THREE from 'three';
import { state } from '../core/state.js';

export function createObjects(scene, collidableBoxes, interactables, hud, movement) {
  let updateDrawerFn = null;
  let updateDoorFn = null;

  const cabinFurniture = createCabinFurniture(scene, collidableBoxes, interactables, hud, movement);
  if (cabinFurniture) {
    updateDrawerFn = cabinFurniture.updateDrawer;
    updateDoorFn = cabinFurniture.updateDoor;
  }

  createMessFurniture(scene, collidableBoxes);

  createQuartersFurniture(scene, collidableBoxes);

  const pumps = createPumps(scene, collidableBoxes);
  const pumpRotor = pumps ? pumps.rotorMesh : null;

  createGenerator(scene, collidableBoxes);

  createBridgeConsoles(scene, collidableBoxes);

  createMagnesiumTablets(scene, interactables, hud);

  createJournalPages(scene, interactables, hud, movement);

  createPressureValveWheel(scene, interactables, hud);

  state.dropHeldItem = dropHeldItem;

  createPipes(scene);

  return {
    update: (delta) => {
      if (updateDrawerFn) updateDrawerFn(delta);
      if (updateDoorFn) updateDoorFn(delta);
      if (state.puzzles.pressure && pumpRotor) {
        pumpRotor.rotation.z += delta * 4.5;
      }
    }
  };
}



function createCabinFurniture(scene, boxes, interactables, hud, movement) {
  const woodMat = new THREE.MeshPhongMaterial({ color: 0x4a2f1b, specular: 0x1f130a, shininess: 8 });
  const sheetMat = new THREE.MeshPhongMaterial({ color: 0xb0a896, shininess: 2 });
  const blanketMat = new THREE.MeshPhongMaterial({ color: 0x223a30, specular: 0x122018, shininess: 5 });
  const steelMat = new THREE.MeshPhongMaterial({ color: 0x2e3b44, specular: 0x556677, shininess: 40 });

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

  const keyMat = new THREE.MeshPhongMaterial({
    color: 0xd4af37,
    specular: 0xffdf7a,
    shininess: 80,
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

  const locker = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.7), steelMat);
  locker.position.set(2.2, 0.9, -25.5);
  locker.castShadow = true;
  locker.receiveShadow = true;
  scene.add(locker);

  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(2.2, 0.9, -25.5),
    new THREE.Vector3(0.8, 1.8, 0.7)
  ));

  const cabinDoorGroup = new THREE.Group();
  cabinDoorGroup.position.set(1.5, 0, -23.0);
  scene.add(cabinDoorGroup);

  const cabinDoorMat = new THREE.MeshPhongMaterial({
    color: 0x242e38,
    specular: 0x455666,
    shininess: 40,
  });

  const cabinDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.0), cabinDoorMat);
  cabinDoorMesh.position.set(0, 1.3, 1.0);
  cabinDoorMesh.castShadow = true;
  cabinDoorMesh.receiveShadow = true;
  cabinDoorGroup.add(cabinDoorMesh);

  const viewPortFrame = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), steelMat);
  viewPortFrame.rotation.y = Math.PI / 2;
  viewPortFrame.position.set(0, 1.6, 1.0);
  cabinDoorGroup.add(viewPortFrame);

  const viewPortBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), steelMat);
  viewPortBar.position.set(0, 1.6, 1.0);
  cabinDoorGroup.add(viewPortBar);

  const wheelMat = new THREE.MeshPhongMaterial({ color: 0x1f272e, specular: 0x445566, shininess: 50 });
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

  return { updateDrawer, updateDoor };
}


function createMessFurniture(scene, boxes) {
  const woodMat = new THREE.MeshPhongMaterial({ color: 0x3d281a, specular: 0x140e0a, shininess: 6 });
  const steelMat = new THREE.MeshPhongMaterial({ color: 0x1f272e, specular: 0x445566, shininess: 30 });

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



function createQuartersFurniture(scene, boxes) {
  const steelMat   = new THREE.MeshPhongMaterial({ color: 0x2c3e50, specular: 0x5d6d7e, shininess: 40 });
  const woodMat    = new THREE.MeshPhongMaterial({ color: 0x3b2a1a, specular: 0x1a1008, shininess: 6  });
  const sheetMat   = new THREE.MeshPhongMaterial({ color: 0x4a5568, shininess: 2 });
  const blanketMat = new THREE.MeshPhongMaterial({ color: 0x1a3a2a, shininess: 3 });
  const lockerMat  = new THREE.MeshPhongMaterial({ color: 0x1c2833, specular: 0x4a5568, shininess: 55 });
  const handleMat  = new THREE.MeshPhongMaterial({ color: 0x7f8c8d, specular: 0xbdc3c7, shininess: 80 });

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

  const buildLocker = (lx, lz, isWest) => {
    const lg = new THREE.Group();
    lg.position.set(lx, 0, lz);
    if(isWest){
    lg.rotation.y = -Math.PI / 2; 
    }
    else{    lg.rotation.y = Math.PI / 2; 
    }
    scene.add(lg);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.4), lockerMat);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    lg.add(body);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.55, 0.02), steelMat);
    panel.position.set(0, 0.95, 0.21);
    lg.add(panel);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), handleMat);
    handle.position.set(0.18, 1.0, 0.23);
    lg.add(handle);

    for (let i = 0; i < 3; i++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.02), steelMat);
      slit.position.set(0, 1.65 - i * 0.04, 0.21);
      lg.add(slit);
    }

    boxes.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(lx, 0.9, lz),
      new THREE.Vector3(0.4, 1.8, 0.5)
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
}



function createPumps(scene, boxes) {
  const floorY = -4;
  const pumpMat = new THREE.MeshPhongMaterial({ color: 0x1f353a, specular: 0x3a5a60, shininess: 45 });
  const rustMat = new THREE.MeshPhongMaterial({ color: 0x5a2d1b, specular: 0x2d1b10, shininess: 8 });
  const steelMat = new THREE.MeshPhongMaterial({ color: 0x5a6a7a, specular: 0x8899aa, shininess: 50 });

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

  const steelMat = new THREE.MeshPhongMaterial({ color: 0x2c3e35, specular: 0x4a6055, shininess: 35 });
  const copperMat = new THREE.MeshPhongMaterial({ color: 0xb87333, specular: 0xffcc88, shininess: 80 });
  const ironMat = new THREE.MeshPhongMaterial({ color: 0x1f2124, specular: 0x444850, shininess: 25 });

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

  const controlBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), steelMat);
  controlBox.position.set(-0.8, 2.0, 0);
  controlBox.castShadow = true;
  genGroup.add(controlBox);

  const slotMat = new THREE.MeshPhongMaterial({ color: 0x1a2620, specular: 0x555555, shininess: 30 });
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
  const steelMat = new THREE.MeshPhongMaterial({ color: 0x1a232a, specular: 0x3d4b56, shininess: 50 });
  const screenBorderMat = new THREE.MeshPhongMaterial({ color: 0x080c10, shininess: 20 });
  
  const neonMat = (colorHex) => new THREE.MeshPhongMaterial({
    color: 0x000000,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 1.5,
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
  
  screenPositions.forEach((sx, idx) => {
    const scrGroup = new THREE.Group();
    scrGroup.position.set(sx, 0.9, 0.0);
    scrGroup.rotation.x = -0.35;
    consoleGroup.add(scrGroup);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), screenBorderMat);
    frame.position.y = 0.25;
    scrGroup.add(frame);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), neonMat(screenColors[idx]));
    screen.position.set(0, 0.25, 0.041);
    scrGroup.add(screen);
  });
}


function createMagnesiumTablets(scene, interactables, hud) {
  const crystalMat = new THREE.MeshPhongMaterial({
    color: 0xaaffbb,
    emissive: 0x33cc66,
    emissiveIntensity: 0.9,
    shininess: 90
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
  const paperMat = new THREE.MeshPhongMaterial({
    color: 0xeee4cc,
    emissive: 0x111111,
    shininess: 5
  });

  const pages = [
    {
      x: 5.9, y: 0.81, z: -19.5,
      rotY: 0.12,
      title: "Captain's Log — May 24, 2026",
      text: `MAY 24, 2026.
The engine pressure has been failing consistently. The auxiliary generator on the lower deck is leaking coolant, flooding the entire pump room. 

I've locked the East corridor bulkheads to contain the noise from Section 4. They've been screaming all night. The quarantine must hold.`
    },
    {
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
      x: -6.0, y: 0.91, z: 7.35,
      rotY: 0.2,
      title: "Bridge Log — System Lockdown",
      text: `WARNING: COMPLETE SYSTEMS LOCK ACTIVE.
The escape hatch control panel requires a final color-sequence synchronization code. 

The security protocols require the primary breaker coil to remain locked. If the breaker is pulled, it will trigger an automatic release of the quarantine lock doors. The madness must not spread to the bridge.`
    },
    {
      x: 5.6, y: 0.69, z: -9.1,
      rotY: 1,
      title: "Crew Manifest Note — Bunk 3",
      text: `DAY 19 ABOARD TIAMAT.
Something is wrong with the men in Section 4. They stopped eating three days ago. The sounds they make don't sound human anymore.

I barricaded my bunk with the locker door. I can hear them scratching the bulkhead from the inside.

I left my magnesium rations and the regulator wheel on my bunk. Whoever finds this — take them. You'll need to stay sharp.

— Machinist Yılmaz`
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

        document.exitPointerLock();
      }
    };

    interactables.push(journalItem);
  });
}


function createPipes(scene) {
  const pipeMat = new THREE.MeshPhongMaterial({
    color: 0x3b4a54,
    specular: 0x5a7080,
    shininess: 50,
  });
  const brassValveMat = new THREE.MeshPhongMaterial({
    color: 0x9c7a2b,
    specular: 0xe0c080,
    shininess: 70,
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
  const brassMat = new THREE.MeshPhongMaterial({
    color: 0xc2a649,
    specular: 0xffe891,
    shininess: 80
  });
  const steelMat = new THREE.MeshPhongMaterial({
    color: 0x5a6a7a,
    specular: 0x8899aa,
    shininess: 40
  });

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(5.6, 0.75, -9.4);
  scene.add(wheelGroup);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), steelMat);
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), brassMat);
    spoke.rotation.z = angle;
    spoke.position.set(0.06 * Math.sin(angle), 0.06 * Math.cos(angle), 0);
    wheelGroup.add(spoke);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), brassMat);
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

    const keyMat = new THREE.MeshPhongMaterial({ color: 0xd4af37, specular: 0xffdf7a, shininess: 80, emissive: 0x3a2a00 });

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
    const brassMat = new THREE.MeshPhongMaterial({ color: 0xc2a649, specular: 0xffe891, shininess: 80 });
    const steelMat = new THREE.MeshPhongMaterial({ color: 0x5a6a7a, specular: 0x8899aa, shininess: 40 });

    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y + 0.05, z);
    scene.add(wheelGroup);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), steelMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), brassMat);
      spoke.rotation.z = angle;
      spoke.position.set(0.06 * Math.sin(angle), 0.06 * Math.cos(angle), 0);
      wheelGroup.add(spoke);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), brassMat);
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
    const copperMat = new THREE.MeshPhongMaterial({ color: 0xb87333, specular: 0xffcc88, shininess: 80, emissive: 0x3a1a00 });
    const coreMat = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x555555, shininess: 30 });
    const glowMat = new THREE.MeshPhongMaterial({ color: 0x33ff66, emissive: 0x33ff66, emissiveIntensity: 0.8 });

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
