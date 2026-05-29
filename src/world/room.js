import * as THREE from 'three';

const CEIL_H = 3.2;
const MID_Y  = CEIL_H / 2;
const DOOR_W = 2;
const DOOR_H = 2.6;
const THICKNESS = 0.20;

const matFloor = new THREE.MeshPhongMaterial({ color: 0x141c22, specular: 0x1e2d38, shininess: 12 });
const matCeil  = new THREE.MeshPhongMaterial({ color: 0x0e1318, shininess: 0 });
export const matWallCabin = new THREE.MeshPhongMaterial({ color: 0x1a2128, specular: 0x201a16, shininess: 15, side: THREE.DoubleSide });
export const matWallMess = new THREE.MeshPhongMaterial({ color: 0x1a2128, specular: 0x152018, shininess: 12, side: THREE.DoubleSide });
export const matWallCorridor = new THREE.MeshPhongMaterial({ color: 0x1a2128, specular: 0x151b20, shininess: 18, side: THREE.DoubleSide });
export const matWallQuarters = new THREE.MeshPhongMaterial({ color: 0x1a2128, specular: 0x181f24, shininess: 15, side: THREE.DoubleSide });
export const matWallFlooded = new THREE.MeshPhongMaterial({ color: 0x2a1e16, specular: 0x201510, shininess: 10, side: THREE.DoubleSide });
export const matWallGenerator = new THREE.MeshPhongMaterial({ color: 0x1b1c1e, specular: 0x151515, shininess: 8, side: THREE.DoubleSide });
export const matWallBridge = new THREE.MeshPhongMaterial({ color: 0x19222a, specular: 0x151c22, shininess: 20, side: THREE.DoubleSide });

const matDoorFrame = new THREE.MeshPhongMaterial({ color: 0x0f1317, specular: 0x1a2128, shininess: 30 });

export function createRoom(scene, collidableBoxes) {
  buildCaptainsCabin(scene, collidableBoxes);
  buildMessHall(scene, collidableBoxes);
  buildMainCorridor(scene, collidableBoxes);
  buildCrewQuarters(scene, collidableBoxes);
  buildFloodedRoom(scene, collidableBoxes);
  buildGeneratorRoom(scene, collidableBoxes);
  buildBridge(scene, collidableBoxes);
}



function addFloor(scene, w, d, cx, cz, floorY = 0, customMat = matFloor) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, THICKNESS, d), customMat);
  m.position.set(cx, floorY - THICKNESS / 2, cz);
  m.receiveShadow = true;
  scene.add(m);
}

function addCeiling(scene, w, d, cx, cz, floorY = 0, customMat = matCeil, height = CEIL_H) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, THICKNESS, d), customMat);
  m.position.set(cx, floorY + height + THICKNESS / 2, cz);
  scene.add(m);
}

function addWall(scene, boxes, w, h, px, py, pz, ry, customMat = matWallCorridor) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, THICKNESS), customMat);
  m.position.set(px, py, pz);
  m.rotation.y = ry;
  m.receiveShadow = true;
  scene.add(m);

  const faceNS = Math.abs(ry) < 0.01 || Math.abs(Math.abs(ry) - Math.PI) < 0.01;
  boxes.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(px, py, pz),
    new THREE.Vector3(faceNS ? w : THICKNESS, h, faceNS ? THICKNESS : w)
  ));
}

function addDoorFrameX(scene, cx, pz, floorY = 0) {
  const frameWidth = 0.12;
  const frameDepth = THICKNESS + 0.06;
  
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, DOOR_H, frameDepth), matDoorFrame);
  left.position.set(cx - DOOR_W / 2, floorY + DOOR_H / 2, pz);
  left.castShadow = true;
  left.receiveShadow = true;
  scene.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, DOOR_H, frameDepth), matDoorFrame);
  right.position.set(cx + DOOR_W / 2, floorY + DOOR_H / 2, pz);
  right.castShadow = true;
  right.receiveShadow = true;
  scene.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + frameWidth, frameWidth, frameDepth), matDoorFrame);
  top.position.set(cx, floorY + DOOR_H + frameWidth / 2, pz);
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);
}

function addDoorFrameZ(scene, px, cz, floorY = 0) {
  const frameWidth = 0.12;
  const frameDepth = THICKNESS + 0.06;
  
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, DOOR_H, frameWidth), matDoorFrame);
  left.position.set(px, floorY + DOOR_H / 2, cz - DOOR_W / 2);
  left.castShadow = true;
  left.receiveShadow = true;
  scene.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, DOOR_H, frameWidth), matDoorFrame);
  right.position.set(px, floorY + DOOR_H / 2, cz + DOOR_W / 2);
  right.castShadow = true;
  right.receiveShadow = true;
  scene.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, frameWidth, DOOR_W + frameWidth), matDoorFrame);
  top.position.set(px, floorY + DOOR_H + frameWidth / 2, cz);
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);
}


function wallN(scene, b, xMin, xMax, z, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const w = xMax - xMin;
  addWall(scene, b, w, height, (xMin + xMax) / 2, floorY + height / 2, z, 0, customMat);
}
function wallS(scene, b, xMin, xMax, z, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const w = xMax - xMin;
  addWall(scene, b, w, height, (xMin + xMax) / 2, floorY + height / 2, z, Math.PI, customMat);
}
function wallW(scene, b, zMin, zMax, x, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const d = zMax - zMin;
  addWall(scene, b, d, height, x, floorY + height / 2, (zMin + zMax) / 2, Math.PI / 2, customMat);
}
function wallE(scene, b, zMin, zMax, x, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const d = zMax - zMin;
  addWall(scene, b, d, height, x, floorY + height / 2, (zMin + zMax) / 2, -Math.PI / 2, customMat);
}



function doorWallN(scene, b, xMin, xMax, z, floorY = 0, customMat = matWallCorridor) {
  const cx   = (xMin + xMax) / 2;
  const side = (xMax - xMin - DOOR_W) / 2;
  const topH = CEIL_H - DOOR_H;
  if (side > 0.01) {
    addWall(scene, b, side, CEIL_H, xMin + side / 2,  floorY + MID_Y, z, 0, customMat);
    addWall(scene, b, side, CEIL_H, xMax - side / 2,  floorY + MID_Y, z, 0, customMat);
  }
  addWall(scene, b, DOOR_W, topH, cx, floorY + CEIL_H - topH / 2, z, 0, customMat);
  addDoorFrameX(scene, cx, z, floorY);
}
function doorWallS(scene, b, xMin, xMax, z, floorY = 0, customMat = matWallCorridor) {
  const cx   = (xMin + xMax) / 2;
  const side = (xMax - xMin - DOOR_W) / 2;
  const topH = CEIL_H - DOOR_H;
  if (side > 0.01) {
    addWall(scene, b, side, CEIL_H, xMin + side / 2,  floorY + MID_Y, z, Math.PI, customMat);
    addWall(scene, b, side, CEIL_H, xMax - side / 2,  floorY + MID_Y, z, Math.PI, customMat);
  }
  addWall(scene, b, DOOR_W, topH, cx, floorY + CEIL_H - topH / 2, z, Math.PI, customMat);
  addDoorFrameX(scene, cx, z, floorY);
}
function doorWallW(scene, b, zMin, zMax, x, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const cz   = (zMin + zMax) / 2;
  const side = (zMax - zMin - DOOR_W) / 2;
  const topH = height - DOOR_H;
  if (side > 0.01) {
    addWall(scene, b, side, height, x, floorY + height / 2, zMin + side / 2,  Math.PI / 2, customMat);
    addWall(scene, b, side, height, x, floorY + height / 2, zMax - side / 2,  Math.PI / 2, customMat);
  }
  addWall(scene, b, DOOR_W, topH, x, floorY + height - topH / 2, cz, Math.PI / 2, customMat);
  addDoorFrameZ(scene, x, cz, floorY);
}
function doorWallE(scene, b, zMin, zMax, x, floorY = 0, height = CEIL_H, customMat = matWallCorridor) {
  const cz   = (zMin + zMax) / 2;
  const side = (zMax - zMin - DOOR_W) / 2;
  const topH = height - DOOR_H;
  if (side > 0.01) {
    addWall(scene, b, side, height, x, floorY + height / 2, zMin + side / 2,  -Math.PI / 2, customMat);
    addWall(scene, b, side, height, x, floorY + height / 2, zMax - side / 2,  -Math.PI / 2, customMat);
  }
  addWall(scene, b, DOOR_W, topH, x, floorY + height - topH / 2, cz, -Math.PI / 2, customMat);
  addDoorFrameZ(scene, x, cz, floorY);
}



function addLadder(scene, x, z, yStart, yEnd) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const mat = new THREE.MeshPhongMaterial({ color: 0x5a6a7a, specular: 0x8899aa, shininess: 30 });
  
  const numRungs = Math.floor((yEnd - yStart) / 0.35);
  for (let i = 0; i <= numRungs; i++) {
    const ry = yStart + i * 0.35;
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), mat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, ry, 0);
    group.add(rung);
  }
}



function buildCaptainsCabin(scene, b) {
  addFloor(scene,   5, 8, 4, -22);
  addCeiling(scene, 5, 8, 4, -22);
  
  wallN(scene, b, 1.5, 6.5, -26, 0, CEIL_H, matWallCabin);
  wallS(scene, b, 1.5, 6.5, -18, 0, CEIL_H, matWallCabin);
  wallE(scene, b, -26, -18, 6.5, 0, CEIL_H, matWallCabin);
}

function buildMessHall(scene, b) {
  addFloor(scene,   6, 10, -4.5, -13);
  addCeiling(scene, 6, 10, -4.5, -13);
  
  wallN(scene, b, -7.5, -1.5, -18, 0, CEIL_H, matWallMess);
  wallS(scene, b, -7.5, -1.5, -8, 0, CEIL_H, matWallMess);
  wallW(scene, b, -18, -8, -7.5, 0, CEIL_H, matWallMess);
}

function buildCrewQuarters(scene, b) {
  addFloor(scene,   6, 10, 4.5, -13);
  addCeiling(scene, 6, 10, 4.5, -13);
  
  wallN(scene, b, 6.5, 7.5, -18, 0, CEIL_H, matWallQuarters);
  wallS(scene, b, 1.5, 7.5, -8, 0, CEIL_H, matWallQuarters);
  wallE(scene, b, -18, -8, 7.5, 0, CEIL_H, matWallQuarters);
}

function buildMainCorridor(scene, b) {
  addFloor(scene, 3, 32, 0, -10);
  addFloor(scene, 0.5, 2, -1.25, 7);
  addFloor(scene, 0.5, 2, 1.25, 7);

  addCeiling(scene, 3, 34, 0, -9);

  wallN(scene, b, -1.5, 1.5, -26, 0, CEIL_H, matWallCorridor);
  wallS(scene, b, -1.5, 1.5, 8, 0, CEIL_H, matWallCorridor);

  wallW(scene, b, -26, -18, -1.5, 0, CEIL_H, matWallCorridor);
  doorWallW(scene, b, -18, -8, -1.5, 0, CEIL_H, matWallCorridor);
  wallW(scene, b, -8, 2, -1.5, 0, CEIL_H, matWallCorridor);
  doorWallW(scene, b, 2, 8, -1.5, 0, CEIL_H, matWallCorridor);

  doorWallE(scene, b, -26, -18, 1.5, 0, CEIL_H, matWallCorridor);
  doorWallE(scene, b, -18, -8, 1.5, 0, CEIL_H, matWallCorridor);
  doorWallE(scene, b, -8, 8, 1.5, 0, CEIL_H, matWallCorridor);

  buildMadRoomDoor(scene, b);
}

function buildFloodedRoom(scene, b) {
  const floorY = -4;
  addFloor(scene,   7, 10, 2.0, 3, floorY);

  addCeiling(scene, 7, 8, 2.0, 2, floorY, matFloor, 3.60);
  addCeiling(scene, 0.5, 2, -1.25, 7, floorY, matFloor, 3.60);
  addCeiling(scene, 4.5, 2,  3.25, 7, floorY, matFloor, 3.60);

  addWall(scene, b, 7, 3.7, 2.0, floorY + 3.7/2, -2, 0, matWallFlooded);
  addWall(scene, b, 7, 4.0, 2.0, -2.0,  8, 0, matWallFlooded);

  wallW(scene, b, -2, 2, -1.5, floorY, 3.60, matWallFlooded);
  doorWallW(scene, b, 2, 8, -1.5, floorY, 3.60, matWallFlooded);

  wallE(scene, b, -2, 8, 5.5, floorY, 3.7, matWallFlooded);

  addLadder(scene, 0, 7.86, -4, 0.5);
}

function buildGeneratorRoom(scene, b) {
  const floorY = -4;
  addFloor(scene,   10, 6, -6.5, 5, floorY);

  addCeiling(scene, 10, 4, -6.5, 6, floorY, matFloor, 3.60);
  addCeiling(scene, 4, 2, -9.5, 3, floorY, matFloor, 3.60);
  addCeiling(scene, 4, 2, -3.5, 3, floorY, matFloor, 3.60);
  
  addWall(scene, b, 10, 4.0, -6.5, -2.0, 2, 0, matWallGenerator);
  addWall(scene, b, 10, 4.0, -6.5, -2.0, 8, 0, matWallGenerator);

  wallW(scene, b, 2, 8, -11.5, floorY, 4.0, matWallGenerator);
  doorWallE(scene, b, 2, 8, -1.5, floorY, 3.60, matWallGenerator);

  addLadder(scene, -6.5, 2.14, -4, 0.5);
}

function buildBridge(scene, b) {
  addFloor(scene, 10, 4, -6.5, 6);
  addFloor(scene, 4, 2, -9.5, 3);
  addFloor(scene, 4, 2, -3.5, 3);

  addCeiling(scene, 10, 6, -6.5, 5);
  wallN(scene, b, -11.5, -1.5,  2, 0, CEIL_H, matWallBridge);
  wallS(scene, b, -11.5, -1.5,  8, 0, CEIL_H, matWallBridge);
  wallW(scene, b, 2.0, 4.0, -11.5, 0, CEIL_H, matWallBridge);
  wallW(scene, b, 6.0, 8.0, -11.5, 0, CEIL_H, matWallBridge);
}

function buildMadRoomDoor(scene, b) {
  const doorX = 1.5;
  const doorZ = 0;
  
  const doorMat = new THREE.MeshPhongMaterial({
    color: 0x2d1f18,
    specular: 0x3d2b20,
    shininess: 15,
  });
  
  const frameMat = new THREE.MeshPhongMaterial({
    color: 0x1c242c,
    specular: 0x3c4c5c,
    shininess: 40,
  });

  const barMat = new THREE.MeshPhongMaterial({
    color: 0x111111,
    specular: 0x555555,
    shininess: 80,
  });
  
  const brassMat = new THREE.MeshPhongMaterial({
    color: 0xb5a642,
    specular: 0xffe066,
    shininess: 90,
  });

  const chainMat = new THREE.MeshPhongMaterial({
    color: 0x4a4a4a,
    specular: 0x888888,
    shininess: 70,
  });

  const doorGroup = new THREE.Group();
  doorGroup.name = "madRoomDoor";
  scene.add(doorGroup);

  const thickness = 0.12;

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(thickness, 1.3, 2.0), doorMat);
  bottom.position.set(doorX, 0.65, doorZ);
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  doorGroup.add(bottom);

  const top = new THREE.Mesh(new THREE.BoxGeometry(thickness, 0.9, 2.0), doorMat);
  top.position.set(doorX, 2.15, doorZ);
  top.castShadow = true;
  top.receiveShadow = true;
  doorGroup.add(top);

  const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, 0.4, 0.75), doorMat);
  left.position.set(doorX, 1.5, doorZ - 0.625);
  left.castShadow = true;
  left.receiveShadow = true;
  doorGroup.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, 0.4, 0.75), doorMat);
  right.position.set(doorX, 1.5, doorZ + 0.625);
  right.castShadow = true;
  right.receiveShadow = true;
  doorGroup.add(right);

  const wf1 = new THREE.Mesh(new THREE.BoxGeometry(thickness + 0.04, 0.05, 0.6), frameMat);
  wf1.position.set(doorX, 1.3, doorZ);
  doorGroup.add(wf1);
  const wf2 = new THREE.Mesh(new THREE.BoxGeometry(thickness + 0.04, 0.05, 0.6), frameMat);
  wf2.position.set(doorX, 1.7, doorZ);
  doorGroup.add(wf2);
  const wf3 = new THREE.Mesh(new THREE.BoxGeometry(thickness + 0.04, 0.45, 0.05), frameMat);
  wf3.position.set(doorX, 1.5, doorZ - 0.275);
  doorGroup.add(wf3);
  const wf4 = new THREE.Mesh(new THREE.BoxGeometry(thickness + 0.04, 0.45, 0.05), frameMat);
  wf4.position.set(doorX, 1.5, doorZ + 0.275);
  doorGroup.add(wf4);

  for (let i = -1; i <= 1; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), barMat);
    bar.position.set(doorX, 1.5, doorZ + i * 0.15);
    doorGroup.add(bar);
  }

  const handleBack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.04), frameMat);
  handleBack.position.set(doorX - thickness/2 - 0.01, 1.1, doorZ - 0.7);
  doorGroup.add(handleBack);
  const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 16), frameMat);
  handleRing.rotation.y = Math.PI / 2;
  handleRing.position.set(doorX - thickness/2 - 0.025, 1.1, doorZ - 0.7);
  doorGroup.add(handleRing);

  const chainX = doorX - 0.06;
  const pTL = new THREE.Vector3(chainX, 2.3, doorZ - 0.95);
  const pTR = new THREE.Vector3(chainX, 2.3, doorZ + 0.95);
  const pBL = new THREE.Vector3(chainX, 0.3, doorZ - 0.95);
  const pBR = new THREE.Vector3(chainX, 0.3, doorZ + 0.95);
  const pCenter = new THREE.Vector3(chainX - 0.02, 1.3, doorZ);

  buildVisualChain(doorGroup, pTL, pBR, chainMat);
  buildVisualChain(doorGroup, pTR, pBL, chainMat);

  const lockGroup = new THREE.Group();
  lockGroup.position.copy(pCenter);
  lockGroup.rotation.y = Math.PI / 2;
  lockGroup.rotation.x = 0.15;
  doorGroup.add(lockGroup);

  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.05), brassMat);
  lockBody.position.set(0, -0.06, 0);
  lockBody.castShadow = true;
  lockGroup.add(lockBody);

  const lockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), barMat);
  lockShackle.position.set(0, 0.01, 0);
  lockGroup.add(lockShackle);

  const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.052, 8), barMat);
  keyhole.rotation.x = Math.PI / 2;
  keyhole.position.set(0, -0.07, 0);
  lockGroup.add(keyhole);

  b.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(doorX, 1.3, doorZ),
    new THREE.Vector3(0.2, 2.6, 2.0)
  ));
}

function buildVisualChain(parentGroup, p1, p2, material) {
  const direction = new THREE.Vector3().subVectors(p2, p1);
  const length = direction.length();
  direction.normalize();

  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  const linkGeo = new THREE.TorusGeometry(0.05, 0.014, 8, 12);
  const step = 0.075;
  const numLinks = Math.ceil(length / step);

  for (let i = 0; i < numLinks; i++) {
    const t = i / (numLinks - 1);
    const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
    
    const sag = 0.05 * Math.sin(t * Math.PI);
    pos.y -= sag;

    const link = new THREE.Mesh(linkGeo, material);
    link.position.copy(pos);
    link.quaternion.copy(quaternion);
    
    if (i % 2 === 0) {
      link.rotateZ(Math.PI / 2);
    }
    link.castShadow = true;
    parentGroup.add(link);
  }
}
