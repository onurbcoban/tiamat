import * as THREE from 'three';
import { state } from '../core/state.js';
 
export function createLights(scene, camera) {
  const ambient = new THREE.AmbientLight(0x7a8fa5, 1.1);
  ambient.name = "ambientLight";
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x6a8fa5, 0x1a222a, 0.7);
  hemi.name = "hemiLight";
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0x2a3e50, 0.0);
  dir.name = "dirLight";
  dir.position.set(0, 10, 0);
  scene.add(dir);

  const emergencyGroup = new THREE.Group();
  emergencyGroup.name = "emergencyLights";
  scene.add(emergencyGroup);

  const redLightPositions = [
    { x: 4.0,  y: 3.0,  z: -22.0 },
    { x: -4.5, y: 3.0,  z: -13.0 },
    { x: 4.5,  y: 3.0,  z: -13.0 },
    { x: 0.0,  y: 3.0,  z: -20.0 },
    { x: 0.0,  y: 3.0,  z: -8.0  },
    { x: 0.0,  y: 3.0,  z: 2.0   },
    { x: 0.0,  y: -1.0, z: 3.0   },
    { x: -6.5, y: -1.0, z: 5.0   },
    { x: -6.5, y: 3.0,  z: 5.0   },
  ];

  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const bulbGeo = new THREE.SphereGeometry(0.04, 8, 8);

  redLightPositions.forEach(pos => {
    const pl = new THREE.PointLight(0xff2222, 0.55, 4.2, 1.8);
    pl.position.set(pos.x, pos.y - 0.1, pos.z);
    pl.castShadow = false;
    emergencyGroup.add(pl);

    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, pos.y, pos.z);
    emergencyGroup.add(bulb);
  });

  const mainLightsGroup = new THREE.Group();
  mainLightsGroup.name = "mainLights";
  scene.add(mainLightsGroup);

  const whiteBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const whiteBulbGeo = new THREE.SphereGeometry(0.05, 8, 8);

  redLightPositions.forEach(pos => {
    // Determine custom distance based on room size to prevent light leaking through walls
    let dist = 7.5;
    let ceilY = 3.2; // upper deck ceiling Y
    if (Math.abs(pos.z + 13.0) < 0.1) {
      dist = 8.5; // Mess Hall and Crew Quarters (larger rooms)
    } else if (Math.abs(pos.x) < 0.1 && pos.y > 0) {
      dist = 5.0; // Corridor lights (narrow corridor)
    } else if (pos.y < 0) {
      dist = 6.5; // Lower deck rooms (Flooded Room and Generator Room)
      ceilY = -0.4; // lower deck ceiling Y
    }

    const socketY = ceilY - 0.04;
    const bulbY = ceilY - 0.08;
    const lightY = ceilY - 0.12;

    // Convert to SpotLight pointing straight down for realistic cone lighting (Math.PI / 1.5 is ~120 degrees for maximum coverage)
    const pl = new THREE.SpotLight(0xe8f4ff, 0.0, dist, Math.PI / 1.5, 1.0, 1.0);
    pl.position.set(pos.x, lightY, pos.z);
    pl.castShadow = false; // Keep disabled to maximize FPS
    pl.name = "mainPointLight"; // Keep name for compatibility with updates
    
    const target = new THREE.Object3D();
    target.position.set(pos.x, lightY - 3.0, pos.z);
    scene.add(target);
    pl.target = target;
    
    mainLightsGroup.add(pl);

    // Visual dark metal socket/fixture base to connect the bulb to the ceiling
    const socketGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8);
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x1a2228, metalness: 0.8, roughness: 0.4 });
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.set(pos.x, socketY, pos.z);
    socket.name = "mainSocketMesh";
    socket.visible = false;
    mainLightsGroup.add(socket);

    // Visual bulb mesh
    const bulb = new THREE.Mesh(whiteBulbGeo, whiteBulbMat);
    bulb.position.set(pos.x, bulbY, pos.z);
    bulb.name = "mainBulbMesh";
    bulb.visible = false;
    mainLightsGroup.add(bulb);
  });

  const flashlight = new THREE.SpotLight(0xd0e8ff, 9.0);
  flashlight.position.set(0.3, -0.25, -0.1);
  flashlight.angle    = Math.PI / 4.5;
  flashlight.penumbra = 0.5;
  flashlight.decay    = 1.8;
  flashlight.distance = 40;
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.width = 1024;
  flashlight.shadow.mapSize.height = 1024;
  flashlight.shadow.camera.near = 0.5;
  flashlight.shadow.camera.far = 40;
  flashlight.shadow.bias = -0.001;
  camera.add(flashlight);
  camera.add(flashlight.target);
  flashlight.target.position.set(0, 0, -15);
 
  const spillLight = new THREE.SpotLight(0xd0e8ff, 0.15);
  spillLight.angle    = Math.PI / 2.0;
  spillLight.penumbra = 1.0;
  spillLight.decay    = 3.0; // Faster decay to avoid lighting distant walls
  spillLight.distance = 8.0; // Localized to 8 meters
  flashlight.add(spillLight);
  spillLight.target = flashlight.target;
 
  let currentIntensity = 9.0;
  Object.defineProperty(flashlight, 'intensity', {
    get: () => currentIntensity,
    set: (val) => {
      currentIntensity = val;
      spillLight.intensity = val * 0.08; // 8% of flashlight brightness
    },
    configurable: true,
    enumerable: true
  });
 
  // Keep spillLight visibility synchronized with flashlight visibility
  let currentVisible = true;
  Object.defineProperty(flashlight, 'visible', {
    get: () => currentVisible,
    set: (val) => {
      currentVisible = val;
      spillLight.visible = val;
    },
    configurable: true,
    enumerable: true
  });
 
  const updateRoomLights = (pos, powerRestored) => {
    if (!powerRestored || state.flickerActive) {
      // If power is not restored or flickering is in progress, do not override
      return;
    }

    // Smoothly calculate intensities based on distance to the player (Yöntem 2)
    // d < 6.0m: fully on (18.0)
    // d > 12.0m: fully off (0.0)
    // 6.0m <= d <= 12.0m: smoothly interpolated
    const minOnDist = 6.0;
    const maxOffDist = 12.0;
    const maxIntensity = 18.0;

    for (let i = 0; i < 9; i++) {
      const pl = mainLightsGroup.children[i * 3];
      const socket = mainLightsGroup.children[i * 3 + 1];
      const bulb = mainLightsGroup.children[i * 3 + 2];
      if (!pl || !socket || !bulb) continue;

      const dist = pos.distanceTo(pl.position);
      let targetIntensity = 0.0;

      if (dist < minOnDist) {
        targetIntensity = maxIntensity;
      } else if (dist < maxOffDist) {
        const factor = (dist - minOnDist) / (maxOffDist - minOnDist); // 0 to 1
        targetIntensity = (1.0 - factor) * maxIntensity;
      } else {
        targetIntensity = 0.0;
      }

      pl.intensity = targetIntensity;
      pl.castShadow = false; // Completely disabled to guarantee 60+ FPS without shader recompilations
      
      const isVisible = targetIntensity > 0.1;
      socket.visible = isVisible;
      bulb.visible = isVisible;
    }
  };

  return { flashlight, updateRoomLights };
}
