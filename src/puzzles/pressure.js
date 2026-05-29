import * as THREE from 'three';
import { state } from '../core/state.js';

const TARGET  = 6.0;
const MAX_VAL = 10.0;
const WALL_X  = 5.24;

export function createPressurePuzzle(scene, interactables) {
  let currentValue   = 0.0;
  let needleTarget   = valueToAngle(0.0);
  let needleCurrent  = valueToAngle(0.0);

  let valve1Open = false;
  let valve2Open = false;
  let valve3Open = false;

  let stableTimer = 0.0;
  const activeBubbles = [];

  const group = new THREE.Group();
  group.position.set(WALL_X, -2.2, 2.0);
  group.rotation.y = -Math.PI / 2;
  scene.add(group);

  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.8, 0.16),
    new THREE.MeshPhongMaterial({ color: 0x1f272e, specular: 0x4a5568, shininess: 30 })
  );
  backPanel.position.set(0, -0.2, -0.08);
  group.add(backPanel);

  const canvas = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  drawFace(ctx, currentValue, "STANDBY", 0);

  const faceTex = new THREE.CanvasTexture(canvas);
  const faceMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 32),
    new THREE.MeshPhongMaterial({ map: faceTex, specular: 0x223344, shininess: 30 })
  );
  faceMesh.position.set(0, 0.35, 0.01);
  group.add(faceMesh);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.04, 8, 32),
    new THREE.MeshPhongMaterial({ color: 0x4a6070, specular: 0x99bbcc, shininess: 100 })
  );
  rim.position.set(0, 0.35, 0.01);
  group.add(rim);

  const needleGroup = new THREE.Group();
  needleGroup.position.set(0, 0.35, 0.04);
  group.add(needleGroup);

  const needleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.38, 0.015),
    new THREE.MeshPhongMaterial({ color: 0xff3333, specular: 0xff7777, shininess: 70 })
  );
  needleBody.position.y = 0.12;
  needleGroup.add(needleBody);

  const cap = new THREE.Mesh(
    new THREE.CircleGeometry(0.035, 16),
    new THREE.MeshPhongMaterial({ color: 0x1a2230 })
  );
  cap.position.z = 0.01;
  needleGroup.add(cap);

  needleGroup.rotation.z = needleCurrent;

  const brassMat = new THREE.MeshPhongMaterial({ color: 0xc2a649, specular: 0xffe891, shininess: 80 });
  const steelMat = new THREE.MeshPhongMaterial({ color: 0x5a6a7a, specular: 0x8899aa, shininess: 50 });
  const ledRed   = new THREE.MeshPhongMaterial({ color: 0xcc2222, emissive: 0x991111, emissiveIntensity: 0.8 });
  const ledGreen = new THREE.MeshPhongMaterial({ color: 0x22cc55, emissive: 0x119933, emissiveIntensity: 0.8 });

  const v1Group = new THREE.Group();
  v1Group.position.set(-0.35, -0.5, 0.01);
  group.add(v1Group);

  const v1Stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), steelMat);
  v1Stem.rotation.x = Math.PI / 2;
  v1Stem.position.z = 0.04;
  v1Group.add(v1Stem);

  const v1Led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), ledRed.clone());
  v1Led.position.set(0, 0.18, 0.03);
  v1Group.add(v1Led);

  const v1Wheel = buildThreeSpokeWheel(steelMat, brassMat);
  v1Wheel.position.z = 0.08;
  v1Wheel.visible = true;
  v1Group.add(v1Wheel);

  const v1HitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  v1HitMesh.position.z = 0.06;
  v1Group.add(v1HitMesh);

  const v2Group = new THREE.Group();
  v2Group.position.set(0, -0.5, 0.01);
  group.add(v2Group);

  const v2Stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), steelMat);
  v2Stem.rotation.x = Math.PI / 2;
  v2Stem.position.z = 0.04;
  v2Group.add(v2Stem);

  const v2Led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), ledRed.clone());
  v2Led.position.set(0, 0.18, 0.03);
  v2Group.add(v2Led);

  const v2Wheel = buildThreeSpokeWheel(steelMat, brassMat);
  v2Wheel.position.z = 0.08;
  v2Group.add(v2Wheel);

  const v2HitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  v2HitMesh.position.z = 0.06;
  v2Group.add(v2HitMesh);

  const v3Group = new THREE.Group();
  v3Group.position.set(0.35, -0.5, 0.01);
  group.add(v3Group);

  const v3Stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), steelMat);
  v3Stem.rotation.x = Math.PI / 2;
  v3Stem.position.z = 0.04;
  v3Group.add(v3Stem);

  const v3Led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), ledRed.clone());
  v3Led.position.set(0, 0.18, 0.03);
  v3Group.add(v3Led);

  const v3Wheel = buildThreeSpokeWheel(steelMat, brassMat);
  v3Wheel.position.z = 0.08;
  v3Wheel.visible = false;
  v3Group.add(v3Wheel);

  const v3HitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  v3HitMesh.position.z = 0.06;
  v3Group.add(v3HitMesh);

  const v1Interactable = {
    mesh: v1HitMesh,
    name: "Regulator Valve A",
    prompt: "F: Open Valve",
    onInteract: () => {
      if (state.puzzles.pressure) return;
      valve1Open = !valve1Open;
      updateLED(v1Led, valve1Open);
    }
  };

  const v2Interactable = {
    mesh: v2HitMesh,
    name: "Inlet Valve B",
    prompt: "F: Open Valve",
    onInteract: () => {
      if (state.puzzles.pressure) return;
      valve2Open = !valve2Open;
      updateLED(v2Led, valve2Open);
    }
  };

  const v3Interactable = {
    mesh: v3HitMesh,
    name: "Release Valve C",
    prompt: "Missing Wheel (Requires Regulator Wheel)",
    onInteract: () => handleV3Interact()
  };

  interactables.push(v1Interactable, v2Interactable, v3Interactable);

  function handleV3Interact() {
    if (state.puzzles.pressure) return;

    if (!state.pressureWheelAttached) {
      if (state.heldItem === 'pressure_valve_wheel') {
        state.pressureWheelAttached = true;
        state.heldItem = null;
        state.hud.updateStats(state);

        v3Wheel.visible = true;
        v3Interactable.prompt = "F: Open Valve";
        console.log("[Tiamat] Regulator wheel attached to Valve 3.");
      } else {
        console.log("[Tiamat] Valve 3 is missing its wheel.");
        state.hud.setHovered("Release Valve C", "Missing Wheel (Requires Regulator Wheel)");
      }
    } else {
      valve3Open = !valve3Open;
      updateLED(v3Led, valve3Open);
    }
  }

  function updateLED(ledMesh, isOpen) {
    ledMesh.material = isOpen ? ledGreen : ledRed;
  }

  function emitBubbles(localOffset, count, heavy = false) {
    const spawnPos = new THREE.Vector3();
    spawnPos.copy(localOffset).applyMatrix4(group.matrixWorld);

    for (let i = 0; i < count; i++) {
      const size = (heavy ? 0.02 : 0.01) + Math.random() * 0.015;
      const bubbleGeo = new THREE.SphereGeometry(size, 6, 6);
      const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: heavy ? 0.8 : 0.5
      });
      const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      mesh.position.copy(spawnPos);
      mesh.position.x += (Math.random() - 0.5) * 0.15;
      mesh.position.z += (Math.random() - 0.5) * 0.15;

      scene.add(mesh);

      activeBubbles.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.8 + Math.random() * 0.6,
        vz: (Math.random() - 0.5) * 0.25,
        age: 0,
        life: 0.8 + Math.random() * 0.7
      });
    }
  }

  function triggerBlowout() {
    console.log("[Tiamat] Pressure system blowout!");
    emitBubbles(new THREE.Vector3(0, 0.35, 0.1), 80, true);

    const blurOverlay = document.createElement('div');
    blurOverlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(255,255,255,0.9)',
      'backdrop-filter:blur(15px)', '-webkit-backdrop-filter:blur(15px)',
      'z-index:9999', 'pointer-events:none', 'opacity:0',
      'transition:opacity 0.1s ease-out'
    ].join(';');
    document.body.appendChild(blurOverlay);
    blurOverlay.style.opacity = '1';
    
    setTimeout(() => {
      blurOverlay.style.transition = 'opacity 2.2s ease-in';
      blurOverlay.style.opacity = '0';
      setTimeout(() => blurOverlay.remove(), 2300);
    }, 300);

    currentValue = 0.0;
    valve1Open = false;
    valve2Open = false;
    valve3Open = false;
    stableTimer = 0.0;

    updateLED(v1Led, false);
    updateLED(v2Led, false);
    updateLED(v3Led, false);
  }

  function update(delta) {
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
      const b = activeBubbles[i];
      b.mesh.position.x += b.vx * delta;
      b.mesh.position.y += b.vy * delta;
      b.mesh.position.z += b.vz * delta;

      b.age += delta;
      b.mesh.material.opacity = 0.6 * (1.0 - b.age / b.life);

      if (b.age >= b.life) {
        scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        activeBubbles.splice(i, 1);
      }
    }

    if (state.puzzles.pressure) {
      updateLED(v1Led, true);
      updateLED(v2Led, true);
      updateLED(v3Led, true);
      
      needleTarget = valueToAngle(TARGET);
      const diff = needleTarget - needleCurrent;
      if (Math.abs(diff) > 0.001) {
        needleCurrent += diff * Math.min(1, 7 * delta);
        needleGroup.rotation.z = needleCurrent - Math.PI / 2;
      }
      return;
    }

    v1Interactable.prompt = valve1Open ? "F: Close Valve" : "F: Open Valve";
    v2Interactable.prompt = valve2Open ? "F: Close Valve" : "F: Open Valve";
    if (!state.pressureWheelAttached) {
      v3Interactable.prompt = (state.heldItem === 'pressure_valve_wheel')
        ? "F: Attach Regulator Wheel"
        : "Missing Wheel (Requires Regulator Wheel)";
    } else {
      v3Interactable.prompt = valve3Open ? "F: Close Valve" : "F: Open Valve";
    }

    const v1Rate = valve1Open ? 0.30 : 0.0;
    const v2Rate = valve2Open ? 0.35 : 0.0;
    const v3Rate = (state.pressureWheelAttached && valve3Open) ? -0.50 : 0.0;
    const netRate = v1Rate + v2Rate + v3Rate;

    const noise = (Math.random() - 0.5) * 0.06;

    if (netRate !== 0 || currentValue > 0) {
      currentValue += (netRate + noise) * delta;
      currentValue = Math.max(0.0, Math.min(MAX_VAL, currentValue));
    }

    if (currentValue >= MAX_VAL) {
      triggerBlowout();
    }

    if (valve1Open && Math.random() < 0.15) {
      emitBubbles(new THREE.Vector3(-0.35, -0.5, 0.06), 2);
      v1Wheel.rotation.z += delta * 3.5;
    }
    if (valve2Open && Math.random() < 0.15) {
      emitBubbles(new THREE.Vector3(0, -0.5, 0.06), 2);
      v2Wheel.rotation.z += delta * 3.5;
    }
    if (state.pressureWheelAttached && valve3Open && Math.random() < 0.35) {
      emitBubbles(new THREE.Vector3(0.35, -0.5, 0.06), 4, true);
      v3Wheel.rotation.z += delta * 3.5;
    }

    const isStable = currentValue >= 5.8 && currentValue <= 6.2;
    let statusText = "FLOWING...";
    if (netRate === 0 && currentValue === 0) statusText = "STANDBY";
    else if (netRate > 0) statusText = "FLOW: +" + netRate.toFixed(2) + " B/S";
    else if (netRate < 0) statusText = "FLOW: " + netRate.toFixed(2) + " B/S";

    if (isStable) {
      stableTimer += delta;
      const remain = Math.max(0.0, 1.5 - stableTimer);
      statusText = "STABILIZING: " + remain.toFixed(1) + "S";

      if (stableTimer >= 1.5) {
        state.solve('pressure');
        console.log("[Tiamat] Pressure system successfully calibrated!");
        emitBubbles(new THREE.Vector3(0, 0.35, 0.1), 50, true);
        statusText = "SYSTEM STABLE";
      }
    } else {
      stableTimer = 0.0;
    }

    drawFace(ctx, currentValue, statusText, isStable ? stableTimer : 0);
    faceTex.needsUpdate = true;

    needleTarget = valueToAngle(currentValue);
    const diff = needleTarget - needleCurrent;
    if (Math.abs(diff) > 0.001) {
      needleCurrent += diff * Math.min(1, 7 * delta);
      needleGroup.rotation.z = needleCurrent - Math.PI / 2;
    }
  }

  function valueToAngle(v) {
    return Math.PI * (1.0 - v / 10.0);
  }

  function drawFace(ctx, val, statusStr, stableTime) {
    const W = 256, H = 256, cx = 128, cy = 128;

    ctx.fillStyle = '#09121a';
    ctx.beginPath();
    ctx.arc(cx, cy, 110, Math.PI, 0, false);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1d3547';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 110, Math.PI, 0, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 110, cy);
    ctx.lineTo(cx + 110, cy);
    ctx.stroke();

    for (let v = 0; v <= MAX_VAL; v += 0.5) {
      const theta = valueToAngle(v);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const isMajor = v % 1 === 0;
      
      const r0 = isMajor ? 88 : 96;
      const r1 = 106;

      ctx.strokeStyle = isMajor ? '#3a6678' : '#1d3547';
      ctx.lineWidth   = isMajor ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.moveTo(cx + r0 * cos, cy - r0 * sin);
      ctx.lineTo(cx + r1 * cos, cy - r1 * sin);
      ctx.stroke();

      if (isMajor) {
        const lr = 70;
        ctx.fillStyle = '#4b8296';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${v}`, cx + lr * cos, cy - lr * sin);
      }
    }

    ctx.fillStyle = stableTime > 0 ? '#22cc55' : '#3da2b8';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val.toFixed(1) + " BAR", cx, cy + 34);

    ctx.font = '11px monospace';
    ctx.fillStyle = stableTime > 0 ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#22cc55' : '#09121a') : '#365a6e';
    ctx.fillText(statusStr, cx, cy + 62);
  }

  return { update };
}

function buildThreeSpokeWheel(steelMat, brassMat) {
  const wheel = new THREE.Group();

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), steelMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8), brassMat);
    spoke.rotation.z = angle;
    spoke.position.set(0.055 * Math.sin(angle), 0.055 * Math.cos(angle), 0);
    wheel.add(spoke);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), brassMat);
    knob.position.set(0.11 * Math.sin(angle), 0.11 * Math.cos(angle), 0);
    wheel.add(knob);
  }

  return wheel;
}
