import * as THREE from 'three';
import { createRustMetalTexture, createRustMetalNormalMap, createDoorTexture, createIronFrameTexture, createWheelTexture, createDoorRoughnessMap, createDoorMetalnessMap, createWoodTexture, createWaterNormalMap } from './textures.js';

const CEIL_H = 3.2;
const MID_Y  = CEIL_H / 2;
const DOOR_W = 2;
const DOOR_H = 2.6;
const THICKNESS = 0.20;

// Setup rust metal texture for sharing
const rustTexture = createRustMetalTexture();
// Repeat texture so it looks fine on walls and floors
rustTexture.repeat.set(2, 2);

const rustNormalMap = createRustMetalNormalMap();
rustNormalMap.repeat.set(2, 2);

const matFloor = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x222a30, metalness: 0.60, roughness: 0.70 });
const matCeil  = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x151c22, metalness: 0.40, roughness: 0.90 });
export const matWallCabin     = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x222a32, metalness: 0.45, roughness: 0.75, side: THREE.DoubleSide });
export const matWallMess      = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x222a32, metalness: 0.45, roughness: 0.78, side: THREE.DoubleSide });
export const matWallCorridor  = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x222a32, metalness: 0.50, roughness: 0.72, side: THREE.DoubleSide });
export const matWallQuarters  = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x222a32, metalness: 0.45, roughness: 0.75, side: THREE.DoubleSide });
export const matWallFlooded   = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x3a2c20, metalness: 0.35, roughness: 0.85, side: THREE.DoubleSide });
export const matWallGenerator = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x25272a, metalness: 0.55, roughness: 0.68, side: THREE.DoubleSide });
export const matWallBridge    = new THREE.MeshStandardMaterial({ map: rustTexture, normalMap: rustNormalMap, normalScale: new THREE.Vector2(1.0, 1.0), color: 0x25303b, metalness: 0.55, roughness: 0.65, side: THREE.DoubleSide });


const matDoorFrame = new THREE.MeshStandardMaterial({ color: 0x0f1317, metalness: 0.65, roughness: 0.60 });

// 3D panel seam and rivet materials (shared across all walls)
const seamMat  = new THREE.MeshStandardMaterial({ color: 0x181f26, metalness: 0.70, roughness: 0.45 });
const rivetMat = new THREE.MeshStandardMaterial({ color: 0x0d1015, metalness: 0.88, roughness: 0.22 });
const rivetGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.024, 8);

// Adds physical 3D horizontal seam strips and rivets to a wall mesh in local space.
// Seam heights are fixed at 1.0m and 2.2m from floor (bottom of wall).
function addWallDetails(wallMesh, w, h) {
  if (w < 0.9) return; // skip narrow door-surround pieces
  const seamHeights = [1.0, 2.2];
  const bottomY = -h / 2; // local-space bottom of wall

  seamHeights.forEach(sh => {
    const localY = bottomY + sh;
    if (localY > h / 2 - 0.05 || localY < -h / 2 + 0.05) return;

    // Horizontal seam strip — protrudes slightly from front face (+z in local space)
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.048, 0.018),
      seamMat
    );
    strip.position.set(0, localY, THICKNESS / 2 + 0.009);
    strip.castShadow = true;
    strip.receiveShadow = true;
    wallMesh.add(strip);

    // Rivets every 0.55m along the strip
    const spacing = 0.55;
    const count   = Math.max(2, Math.floor(w / spacing));
    const startX  = -(count - 1) * spacing / 2;
    for (let i = 0; i < count; i++) {
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.rotation.x = Math.PI / 2;          // cylinder faces outward
      rivet.position.set(startX + i * spacing, localY, THICKNESS / 2 + 0.024);
      rivet.castShadow = true;
      wallMesh.add(rivet);
    }
  });
}

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
  addWallDetails(m, w, h);
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

  const mat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.80, roughness: 0.35 });
  
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
  wallW(scene, b, 2, 8, -1.5, 0, CEIL_H, matWallCorridor);

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

  const waterNormal = createWaterNormalMap();
  waterNormal.repeat.set(3, 4);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x143447,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.75,
    normalMap: waterNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    side: THREE.DoubleSide
  });

  const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 10.0), waterMat);
  waterPlane.name = "waterPlane";
  waterPlane.rotation.x = -Math.PI / 2;
  waterPlane.position.set(2.0, -0.8, 3.0);
  scene.add(waterPlane);
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
  
  const woodTex = createWoodTexture();
  const doorMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x5a4a3b,
    metalness: 0.0,
    roughness: 0.88,
  });
  
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1c242c,
    metalness: 0.65,
    roughness: 0.60,
  });

  const barMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.80,
    roughness: 0.30,
  });
  
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb5a642,
    metalness: 0.75,
    roughness: 0.30,
  });

  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.75,
    roughness: 0.40,
  });

  const doorGroup = new THREE.Group();
  doorGroup.name = "madRoomDoor";
  scene.add(doorGroup);

  const thickness = 0.12;

  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x3d3228,
    metalness: 0.10,
    roughness: 0.92,
  });
  const ribGeo = new THREE.BoxGeometry(0.018, 0.06, 1.9); 
  const ribXOffsets = [thickness / 2 + 0.009, -(thickness / 2 + 0.009)];
  const ribYPositions = [0.35, 0.95, 2.15];
  
  ribXOffsets.forEach(xOff => {
    ribYPositions.forEach(yPos => {
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(doorX + xOff, yPos, doorZ);
      rib.castShadow = true;
      rib.receiveShadow = true;
      doorGroup.add(rib);
    });
  });

  const rivetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8);
  rivetGeo.rotateZ(Math.PI / 2);
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x2c3b48,
    metalness: 0.80,
    roughness: 0.35,
  });

  ribXOffsets.forEach(xOff => {
    ribYPositions.forEach(yPos => {
      for (let zOffset = -0.8; zOffset <= 0.8; zOffset += 0.4) {
        const rivet = new THREE.Mesh(rivetGeo, rivetMat);
        rivet.position.set(doorX + xOff + (xOff > 0 ? 0.006 : -0.006), yPos, doorZ + zOffset);
        rivet.castShadow = true;
        rivet.receiveShadow = true;
        doorGroup.add(rivet);
      }
    });
  });

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
