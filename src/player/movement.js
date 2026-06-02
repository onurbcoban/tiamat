import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { state } from '../core/state.js';

export function createMovement(camera, collidableBoxes, domElement) {
  const controls = new PointerLockControls(camera, domElement);

  domElement.addEventListener('click', () => {
    if (!controls.isLocked) controls.lock();
  });

  const keys = {};
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  const STAND_HEIGHT  = 1.7;
  const CROUCH_HEIGHT = 1.0;
  const SPEED   = 4;
  const GRAVITY = -9.8;
  const JUMP_V  = 6;

  let velocityY = 0;
  let onGround  = true;
  let onLadder  = false;
  let baseFlashlightIntensity = 5.0;

  function getFloorYAt(x, z, y) {
    if (y < -0.2) {
      return -4;
    }
    if (x >= -1.0 && x <= 1.0 && z >= 6.0 && z <= 8.2) {
      return -4;
    }
    if (x >= -7.5 && x <= -5.5 && z >= 1.8 && z <= 4.0) {
      return -4;
    }
    return 0;
  }

  function isNearLadder(x, z) {
    if (x >= -1.0 && x <= 1.0 && z >= 6.0 && z <= 8.2) {
      return true;
    }
    if (x >= -7.5 && x <= -5.5 && z >= 1.8 && z <= 4.0) {
      return true;
    }
    return false;
  }

  function checkCollision(pos) {
    const box = new THREE.Box3().setFromCenterAndSize(
      pos,
      new THREE.Vector3(0.5, 1.6, 0.5)
    );
    return collidableBoxes.some(b => b.intersectsBox(box));
  }

  function update(delta) {
    const fl = camera.children.find(c => c.isSpotLight);
    if (fl) {
      if (keys['KeyQ']) baseFlashlightIntensity = Math.max(0,   baseFlashlightIntensity - 4 * delta);
      if (keys['KeyE']) baseFlashlightIntensity = Math.min(8.0, baseFlashlightIntensity + 4 * delta);

      let targetIntensity = baseFlashlightIntensity;

      if (state.sanity < 40 && !state.isDead) {
        const t = Date.now() * 0.001;
        const flicker =
          Math.sin(t * 11.3) * 0.4 +
          Math.sin(t * 23.7) * 0.3 +
          Math.sin(t * 47.1) * 0.2 +
          Math.sin(t *  5.9) * 0.1;

        const severity = state.sanity < 20
          ? 1.0
          : (40 - state.sanity) / 40;

        targetIntensity = Math.max(0, baseFlashlightIntensity + flicker * severity * 2.0);
      }
      fl.intensity = targetIntensity;
    }

    const isSwimming = (camera.position.y < -0.5 && !state.waterDrained);
    state.isSwimming = isSwimming;

    const nearLadder = isNearLadder(camera.position.x, camera.position.z);

    if (nearLadder && !onLadder) {
      if (keys['Space'] || keys['KeyC']) {
        onLadder = true;
        if (camera.position.z > 5.0) {
          camera.position.x = 0.0;
          camera.position.z = 7.40;
        } else {
          camera.position.x = -6.5;
          camera.position.z = 2.60;
        }
        velocityY = 0;
      }
    }

    if (!nearLadder && onLadder) {
      onLadder = false;
    }

    if (isSwimming) {
      if (!state.testMode) {
        if (state.oxygen > 0) {
          state.oxygen = Math.max(0, state.oxygen - 4 * delta);
          state.drowningTime = 0;
        } else {
          state.drowningTime = Math.min(4.0, state.drowningTime + delta);
        }
      }
    } else {
      state.oxygen = Math.min(100, state.oxygen + 15 * delta);
      state.drowningTime = Math.max(0, state.drowningTime - 2.0 * delta);
    }

    if (!state.isDead && !state.testMode) {
      let sanityDrain = 0;

      const isInCorridor = camera.position.y > 0 && camera.position.x >= -1.6 && camera.position.x <= 1.6;
      if (isInCorridor) {
        const madDoorX = 1.5;
        const madDoorZ = 0.0;
        const distToMadDoor = Math.sqrt(
          (camera.position.x - madDoorX) ** 2 +
          (camera.position.z - madDoorZ) ** 2
        );
        if (distToMadDoor < 1.5) {
          sanityDrain +=11;
        } else if (distToMadDoor < 4.5) {
          sanityDrain += 7;
        }
      }

      const flashlight = camera.children.find(c => c.isSpotLight);
      if (flashlight && flashlight.intensity < 0.8) {
        const darknessRatio = 1 - (flashlight.intensity / 0.8);
        sanityDrain += darknessRatio * 4;
      }

      if (state.oxygen < 100) {
        const oxygenLoss = 100 - state.oxygen;
        sanityDrain += (oxygenLoss / 100) * 5.0;
      }

      if (sanityDrain > 0) {
        state.sanity = Math.max(0, state.sanity - sanityDrain * delta);
      }
    }

    let currentSpeed = SPEED;
    if (isSwimming) {
      currentSpeed = SPEED * 0.5;
    }

    const forward = new THREE.Vector3();
    const right   = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (keys['KeyW']) move.addScaledVector(forward,  currentSpeed * delta);
    if (keys['KeyS']) move.addScaledVector(forward, -currentSpeed * delta);
    if (keys['KeyD']) move.addScaledVector(right,    currentSpeed * delta);
    if (keys['KeyA']) move.addScaledVector(right,   -currentSpeed * delta);

    if (onLadder) {
      const cy = camera.position.y;
      if (cy > -2.1 && cy < 1.5) {
        move.set(0, 0, 0);
      } else if (cy >= 1.5) {
        let exitClimb = false;
        if (camera.position.z > 5.0) {
          if (camera.position.x < -1.0 || camera.position.x > 1.0 || camera.position.z < 6.0) {
            exitClimb = true;
          }
        } else {
          if (camera.position.x < -7.5 || camera.position.x > -5.5 || camera.position.z > 4.0) {
            exitClimb = true;
          }
        }
        if (exitClimb) {
          onLadder = false;
        }
      } else {
        const lx = (camera.position.z > 5.0) ? 0.0 : -6.5;
        const lz = (camera.position.z > 5.0) ? 7.86 : 2.14;
        const dist = Math.sqrt((camera.position.x - lx)**2 + (camera.position.z - lz)**2);
        if (dist > 0.5) {
          onLadder = false;
        }
      }
    }

    const tryX = camera.position.clone();
    tryX.x += move.x;
    if (!checkCollision(tryX)) camera.position.x = tryX.x;

    const tryZ = camera.position.clone();
    tryZ.z += move.z;
    if (!checkCollision(tryZ)) camera.position.z = tryZ.z;

    const currentFloor = getFloorYAt(camera.position.x, camera.position.z, camera.position.y);
    const groundY = currentFloor + (keys['KeyC'] && !isSwimming ? CROUCH_HEIGHT : STAND_HEIGHT);

    if (isSwimming) {
      velocityY = 0;
      
      const bobSpeed = 1.6;
      const bobAmount = 0.15;
      const driftY = Math.sin(Date.now() * 0.001 * bobSpeed) * bobAmount * delta;
      camera.position.y += driftY;

      if (keys['Space']) {
        camera.position.y += 2.0 * delta;
      } else if (keys['KeyC']) {
        camera.position.y -= 2.0 * delta;
      }

      if (camera.position.y > -0.5) {
        camera.position.y = -0.5;
      }
      if (camera.position.y < groundY) {
        camera.position.y = groundY;
      }
      onGround = false;
    } else if (onLadder) {
      velocityY = 0;
      
      if (keys['Space']) {
        camera.position.y = Math.min(1.95, camera.position.y + 2.5 * delta);
      } else if (keys['KeyC']) {
        camera.position.y -= 2.5 * delta;
      }

      if (camera.position.y <= groundY) {
        camera.position.y = groundY;
        onGround = true;
      } else {
        onGround = false;
      }
    } else {
      const targetY = keys['KeyC'] ? (currentFloor + CROUCH_HEIGHT) : (currentFloor + STAND_HEIGHT);
      camera.position.y += (targetY - camera.position.y) * 10 * delta;

      if (onGround && keys['Space'] && !keys['KeyC']) {
        velocityY = JUMP_V;
        onGround  = false;
      }
      
      velocityY += GRAVITY * delta;
      camera.position.y += velocityY * delta;

      if (camera.position.y <= groundY) {
        camera.position.y = groundY;
        velocityY = 0;
        onGround  = true;
      }
    }
  }

  return {
    controls,
    update,
    isLocked: () => controls.isLocked,
  };
}
