import * as THREE from 'three';
import { state } from '../core/state.js';


export function createGeneratorPuzzle(scene, interactables, collidableBoxes, hud) {
  let setupDone = false;
  let slotMesh = null;
  let hitMesh = null;
  let insertedCoilGroup = null;

  let flickerActive = false;
  let flickerTimer = 0;

  let indicatorRingRef = null;
  let indicatorRingMat = null;

  function setupInteraction() {
    slotMesh = scene.getObjectByName("generator_slot");
    const genGroup = scene.getObjectByName("generator");

    if (slotMesh && genGroup) {
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      hitMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), hitMat);
      hitMesh.position.copy(slotMesh.position);
      genGroup.add(hitMesh);

      indicatorRingMat = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        emissive: 0xff8800,
        emissiveIntensity: 1.0,
        metalness: 0.1,
        roughness: 0.5
      });
      indicatorRingRef = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), indicatorRingMat);
      indicatorRingRef.rotation.y = Math.PI / 2;
      indicatorRingRef.position.set(-0.372, 2.0, 0);
      genGroup.add(indicatorRingRef);

      const genInteractable = {
        mesh: hitMesh,
        name: "Auxiliary Generator",
        prompt: "Locked (Requires Generator Coil)",
        onInteract: () => {
          if (state.powerRestored) return;

          if (state.heldItem === 'generator_coil') {
            state.heldItem = null;
            state.powerRestored = true;
            hud.updateStats(state);

            buildInsertedCoil();

            flickerActive = true;
            flickerTimer = 0;

            const emergency = scene.getObjectByName("emergencyLights");
            if (emergency) {
              emergency.visible = false;
            }

            console.log("[Tiamat] Generator Coil inserted. Restoring main power surge Surging...");
          } else {
            console.log("[Tiamat] Generator requires Generator Coil.");
            hud.setHovered("Auxiliary Generator", "Locked (Requires Generator Coil)");
          }
        }
      };
      interactables.push(genInteractable);
      setupDone = true;
    }
  }


  function buildInsertedCoil() {
    const genGroup = scene.getObjectByName("generator");
    if (!genGroup) return;

    insertedCoilGroup = new THREE.Group();
    insertedCoilGroup.position.set(-0.30, 2.0, 0);
    genGroup.add(insertedCoilGroup);

    const copperMat = new THREE.MeshStandardMaterial({
      map: createCoilTexture(),
      metalness: 0.75,
      roughness: 0.30,
      emissive: 0x3a1a00
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.65,
      roughness: 0.55
    });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 12), coreMat);
    core.rotation.z = Math.PI / 2;
    insertedCoilGroup.add(core);

    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), copperMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = -0.10 + i * 0.05;
      insertedCoilGroup.add(ring);
    }
  }

  function update(delta) {

    if (!setupDone) {
      setupInteraction();
    }

    if (setupDone && !state.powerRestored) {
      const genInteract = interactables.find(i => i.mesh === hitMesh);
      if (genInteract) {
        if (state.heldItem === 'generator_coil') {
          genInteract.prompt = "F: Insert Generator Coil";
        } else {
          genInteract.prompt = "Locked (Requires Generator Coil)";
        }
      }
    }


    if (state.powerRestored && insertedCoilGroup) {
      insertedCoilGroup.rotation.x += delta * 5.0;
    }

    if (indicatorRingMat) {
      if (!state.powerRestored) {
        const pulse = 0.4 + 0.6 * Math.sin(Date.now() * 0.006);
        indicatorRingMat.emissiveIntensity = pulse;
      } else {
        indicatorRingMat.color.setHex(0x33ff66);
        indicatorRingMat.emissive.setHex(0x33ff66);
        indicatorRingMat.emissiveIntensity = 1.0;
      }
    }

    if (flickerActive) {
      state.flickerActive = true;
      flickerTimer += delta;

      const ambient = scene.getObjectByName("ambientLight");
      const hemi = scene.getObjectByName("hemiLight");
      const dir = scene.getObjectByName("dirLight");
      const emergency = scene.getObjectByName("emergencyLights");
      const mainLights = scene.getObjectByName("mainLights");

      const setCeilingLightsState = (isMainOn, mainIntensity, isEmergencyOn) => {
        if (emergency) {
          emergency.visible = isEmergencyOn;
        }
        if (mainLights) {
          mainLights.visible = isMainOn;
          mainLights.children.forEach(child => {
            if (child.name === "mainPointLight") {
              child.intensity = isMainOn ? mainIntensity : 0;
            } else if (child.name === "mainBulbMesh" || child.name === "mainSocketMesh") {
              child.visible = isMainOn;
            }
          });
        }
      };

      if (ambient && hemi && dir) {
        if (flickerTimer < 0.2) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
          setCeilingLightsState(false, 0, false);
        } else if (flickerTimer < 0.35) {
          ambient.color.setHex(0xffffff); ambient.intensity = 1.5;
          hemi.color.setHex(0xffffff); hemi.intensity = 1.0;
          dir.color.setHex(0xffffff); dir.intensity = 0.5;
          setCeilingLightsState(true, 4.5, false);
        } else if (flickerTimer < 0.6) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
          setCeilingLightsState(false, 0, false);
        } else if (flickerTimer < 0.75) {
          ambient.color.setHex(0xffffff); ambient.intensity = 1.5;
          hemi.intensity = 1.0;
          dir.intensity = 0.5;
          setCeilingLightsState(true, 4.5, false);
        } else if (flickerTimer < 0.9) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
          setCeilingLightsState(false, 0, false);
        } else if (flickerTimer < 1.2) {
          const isWhite = Math.random() > 0.4;
          const flickerIntensity = 0.5 + Math.random() * 1.5;

          if (isWhite) {
            ambient.color.setHex(0xffffff);
            hemi.color.setHex(0xaabbcc);
            dir.color.setHex(0xffffff);
            setCeilingLightsState(true, flickerIntensity * 3.5, false);
          } else {
            ambient.color.setHex(0xaa1111);
            hemi.color.setHex(0xff2222);
            dir.color.setHex(0xff2222);
            setCeilingLightsState(false, 0, true);
          }
          ambient.intensity = flickerIntensity * 0.5;
          hemi.intensity = flickerIntensity * 0.4;
          dir.intensity = flickerIntensity * 0.2;
        } else if (flickerTimer < 1.5) {
          const t = (flickerTimer - 1.2) / 0.3; 
          ambient.color.setHex(0xffffff);
          hemi.color.setHex(0xaabbcc);
          hemi.groundColor.setHex(0x223344);
          dir.color.setHex(0xffffff);

          ambient.intensity = 0.5 + t * 0.7;
          hemi.intensity = 0.3 + t * 0.5;
          dir.intensity = 0.1 + t * 0.4;
          setCeilingLightsState(true, t * 5.5, false);
        } else {
          ambient.color.setHex(0xffffff); ambient.intensity = 2.2;
          hemi.color.setHex(0xaabbcc); hemi.groundColor.setHex(0x223344); hemi.intensity = 1.4;
          dir.color.setHex(0xffffff); dir.intensity = 0.8;
          setCeilingLightsState(true, 5.5, false);

          flickerActive = false;
          state.flickerActive = false;
          console.log("[Tiamat] Power grid locked. Daylight restored.");
        }
      }
    }

  }

  return { update };
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
