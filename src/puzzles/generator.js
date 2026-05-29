import * as THREE from 'three';
import { state } from '../core/state.js';


export function createGeneratorPuzzle(scene, interactables, collidableBoxes, hud) {
  let setupDone = false;
  let slotMesh = null;
  let hitMesh = null;
  let insertedCoilGroup = null;
  let doorInteractable = null;

  let doorUnlocked = false;
  let doorOpen = false;
  let doorAnimating = false;
  let doorAngle = 0;

  let flickerActive = false;
  let flickerTimer = 0;

  const doorGroup = new THREE.Group();
  doorGroup.position.set(-1.5, 0.0, 4.0); 
  scene.add(doorGroup);

  const doorMat = new THREE.MeshPhongMaterial({
    color: 0x22303c,
    specular: 0x4a5d6e,
    shininess: 40
  });

  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.0), doorMat);
  doorMesh.position.set(0, 1.3, 1.0); 
  doorMesh.castShadow = true;
  doorMesh.receiveShadow = true;
  doorGroup.add(doorMesh);

  const steelMat = new THREE.MeshPhongMaterial({ color: 0x2e3b44, specular: 0x556677, shininess: 40 });
  const viewPortFrame = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), steelMat);
  viewPortFrame.rotation.y = Math.PI / 2;
  viewPortFrame.position.set(0, 1.6, 1.0);
  doorGroup.add(viewPortFrame);

  const viewPortBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), steelMat);
  viewPortBar.position.set(0, 1.6, 1.0);
  doorGroup.add(viewPortBar);

  const handleMat = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x555555, shininess: 80 });
  [-0.07, 0.07].forEach(offset => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), handleMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(offset, 1.2, 1.0);
    doorGroup.add(wheel);
  });

  const doorLightMat = new THREE.MeshPhongMaterial({
    color: 0xcc2222,
    emissive: 0x661111,
    shininess: 40
  });
  const doorLight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), doorLightMat);
  doorLight.position.set(0.06, 2.3, 1.8);
  doorGroup.add(doorLight);

  const doorCollision = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(-1.5, 1.3, 5.0),
    new THREE.Vector3(0.2, 2.6, 2.0)
  );
  collidableBoxes.push(doorCollision);

  doorInteractable = {
    mesh: doorMesh,
    name: "Bridge Door",
    prompt: "Locked (Requires Power)",
    onInteract: () => {
      hud.setHovered("Bridge Door", "Locked (Requires Power)");
    }
  };
  interactables.push(doorInteractable);

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

            doorUnlocked = true;
            doorOpen = true;
            doorAnimating = true;

            doorLightMat.color.setHex(0x22cc55);
            doorLightMat.emissive.setHex(0x116622);

            const idx = collidableBoxes.indexOf(doorCollision);
            if (idx > -1) collidableBoxes.splice(idx, 1);

            console.log("[Tiamat] Generator Coil inserted. Restoring main power surge...");
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

    if (doorAnimating) {
      const targetAngle = -Math.PI / 1.5;
      const diff = targetAngle - doorAngle;

      if (Math.abs(diff) > 0.001) {
        doorAngle += Math.sign(diff) * Math.min(Math.abs(diff), 1.2 * delta);
        doorGroup.rotation.y = doorAngle;
      } else {
        doorAngle = targetAngle;
        doorGroup.rotation.y = doorAngle;
        doorAnimating = false;

        const idx = interactables.indexOf(doorInteractable);
        if (idx > -1) interactables.splice(idx, 1);
        console.log("[Tiamat] Bridge door fully open.");
      }
    }
  }

  return { update };
}
