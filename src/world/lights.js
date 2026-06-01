import * as THREE from 'three';
 
export function createLights(scene, camera) {
  const ambient = new THREE.AmbientLight(0x182430, 0.12);
  ambient.name = "ambientLight";
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x283a4a, 0x0a0c10, 0.08);
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
    pl.castShadow = true;
    pl.shadow.bias = -0.002;
    emergencyGroup.add(pl);

    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, pos.y, pos.z);
    emergencyGroup.add(bulb);
  });

  const flashlight = new THREE.SpotLight(0xd0e8ff, 6.0);
  flashlight.position.set(0, 0, 0);
  flashlight.angle    = Math.PI / 6.0; // Widened from PI/9
  flashlight.penumbra = 0.6; // Slightly softer edges
  flashlight.decay    = 2.0;
  flashlight.distance = 36;
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

  let currentIntensity = 6.0;
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

  return { flashlight };
}
