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

      indicatorRingMat = new THREE.MeshPhongMaterial({
        color: 0xff8800,
        emissive: 0xff8800,
        emissiveIntensity: 1.0,
        shininess: 30
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

    const copperMat = new THREE.MeshPhongMaterial({
      color: 0xb87333,
      specular: 0xffcc88,
      shininess: 80,
      emissive: 0x3a1a00
    });
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x111111,
      specular: 0x555555,
      shininess: 30
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
      flickerTimer += delta;

      const ambient = scene.getObjectByName("ambientLight");
      const hemi = scene.getObjectByName("hemiLight");
      const dir = scene.getObjectByName("dirLight");

      if (ambient && hemi && dir) {
        if (flickerTimer < 0.2) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
        } else if (flickerTimer < 0.35) {
          ambient.color.setHex(0xffffff); ambient.intensity = 3.0;
          hemi.color.setHex(0xffffff); hemi.intensity = 2.0;
          dir.color.setHex(0xffffff); dir.intensity = 1.5;
        } else if (flickerTimer < 0.6) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
        } else if (flickerTimer < 0.75) {
          ambient.color.setHex(0xffffff); ambient.intensity = 3.0;
          hemi.intensity = 2.0;
          dir.intensity = 1.5;
        } else if (flickerTimer < 0.9) {
          ambient.intensity = 0;
          hemi.intensity = 0;
          dir.intensity = 0;
        } else if (flickerTimer < 1.2) {
          const isWhite = Math.random() > 0.4;
          const flickerIntensity = 0.5 + Math.random() * 1.5;

          if (isWhite) {
            ambient.color.setHex(0xffffff);
            hemi.color.setHex(0xaabbcc);
            dir.color.setHex(0xffffff);
          } else {
            ambient.color.setHex(0xaa1111);
            hemi.color.setHex(0xff2222);
            dir.color.setHex(0xff2222);
          }
          ambient.intensity = flickerIntensity;
          hemi.intensity = flickerIntensity * 0.6;
          dir.intensity = flickerIntensity * 0.4;
        } else if (flickerTimer < 1.5) {
          const t = (flickerTimer - 1.2) / 0.3; 
          ambient.color.setHex(0xffffff);
          hemi.color.setHex(0xaabbcc);
          hemi.groundColor.setHex(0x223344);
          dir.color.setHex(0xffffff);

          ambient.intensity = 1.5 + t * 1.0;
          hemi.intensity = 0.8 + t * 0.7;
          dir.intensity = 0.6 + t * 0.4;
        } else {
          ambient.color.setHex(0xffffff); ambient.intensity = 2.5;
          hemi.color.setHex(0xaabbcc); hemi.groundColor.setHex(0x223344); hemi.intensity = 1.5;
          dir.color.setHex(0xffffff); dir.intensity = 1.0;

          flickerActive = false;
          console.log("[Tiamat] Power grid locked. Daylight restored.");
        }
      }
    }

  }

  return { update };
}
