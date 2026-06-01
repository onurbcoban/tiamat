import * as THREE from 'three';
import { state } from '../core/state.js';

export function createBreakerPuzzle(scene, interactables, hud, movement) {
  let solved = false;
  let active = false;
  let puzzleOverlay = null;
  
  const boxGroup = new THREE.Group();
  boxGroup.position.set(-1.38, 1.6, 0.0);
  boxGroup.rotation.y = Math.PI / 2;
  scene.add(boxGroup);

  const metalMat = new THREE.MeshPhongMaterial({ color: 0x2d343b, specular: 0x5a6a75, shininess: 30 });

  const wallThick = 0.01;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, wallThick), metalMat);
  backWall.position.set(0, 0, -0.035);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  boxGroup.add(backWall);

  const topWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, wallThick, 0.07), metalMat);
  topWall.position.set(0, 0.27, 0.005);
  topWall.castShadow = true;
  topWall.receiveShadow = true;
  boxGroup.add(topWall);

  const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, wallThick, 0.07), metalMat);
  bottomWall.position.set(0, -0.27, 0.005);
  bottomWall.castShadow = true;
  bottomWall.receiveShadow = true;
  boxGroup.add(bottomWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, 0.53, 0.07), metalMat);
  leftWall.position.set(-0.205, 0, 0.005);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  boxGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, 0.53, 0.07), metalMat);
  rightWall.position.set(0.205, 0, 0.005);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  boxGroup.add(rightWall);

  const casingHitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.55, 0.08),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  casingHitMesh.position.set(0, 0, 0);
  boxGroup.add(casingHitMesh);

  const coilGroup = new THREE.Group();
  coilGroup.position.set(0, 0, 0.005);
  boxGroup.add(coilGroup);

  const copperMat = new THREE.MeshPhongMaterial({
    map: createCoilTexture(),
    specular: 0xffcc88,
    shininess: 80,
    emissive: 0x3a1a00
  });
  const coreMat = new THREE.MeshPhongMaterial({
    color: 0x111111,
    specular: 0x555555,
    shininess: 30
  });
  const glowMat = new THREE.MeshPhongMaterial({
    color: 0x33ff66,
    emissive: 0x33ff66,
    emissiveIntensity: 0.8
  });

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

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.21, 0, 0.04);
  boxGroup.add(doorPivot);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.02), metalMat);
  door.position.set(0.21, 0, 0);
  door.castShadow = true;
  doorPivot.add(door);

  const stripeMat = new THREE.MeshPhongMaterial({ color: 0xc89825, emissive: 0x3a2c00 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.005), stripeMat);
  stripe.position.set(0.21, 0.08, 0.011);
  doorPivot.add(stripe);

  const latch = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.08, 0.02),
    new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x555555 })
  );
  latch.position.set(0.38, 0.0, 0.015);
  doorPivot.add(latch);

  const boxInteractable = {
    mesh: casingHitMesh,
    name: "Breaker Box",
    prompt: "F: Open Breaker Box",
    onInteract: () => {
      if (solved) return;
      openPuzzle();
    }
  };
  interactables.push(boxInteractable);

  let doorAngle = 0;
  let doorAnimating = false;

  function openPuzzle() {
    active = true;
    document.exitPointerLock();
    createUI();
  }

  function closePuzzle() {
    active = false;
    if (puzzleOverlay) {
      document.body.removeChild(puzzleOverlay);
      puzzleOverlay = null;
    }
    movement.controls.lock();
    hud.clearHovered();
  }

  function solvePuzzle() {
    solved = true;
    active = false;
    doorAnimating = true;
    
    if (puzzleOverlay) {
      document.body.removeChild(puzzleOverlay);
      puzzleOverlay = null;
    }
    
    movement.controls.lock();
    hud.clearHovered();
    console.log("[Tiamat] Breaker Box solved. Door opening to reveal Generator Coil.");
  }

  function createUI() {
    puzzleOverlay = document.createElement('div');
    puzzleOverlay.id = 'breaker-puzzle-overlay';
    puzzleOverlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.85)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'z-index:1000', 'font-family:monospace', 'color:#33ff66'
    ].join(';');

    const container = document.createElement('div');
    container.style.cssText = [
      'width:500px', 'height:400px', 'background:#070f08',
      'border:2px solid #33ff66', 'box-shadow:0 0 25px rgba(51,255,102,0.2)',
      'position:relative', 'display:flex', 'flex-direction:column',
      'padding:20px', 'box-sizing:border-box', 'border-radius:8px'
    ].join(';');
    puzzleOverlay.appendChild(container);

    const title = document.createElement('div');
    title.textContent = 'BREAKER WIRING SYSTEMS';
    title.style.cssText = 'text-align:center; font-size:16px; font-weight:bold; letter-spacing:2px; margin-bottom:20px;';
    container.appendChild(title);

    const gameArea = document.createElement('div');
    gameArea.style.cssText = 'flex:1; position:relative; overflow:hidden; background:#020502; border:1px solid #113311; border-radius:4px;';
    container.appendChild(gameArea);

    const leftTerminal = document.createElement('div');
    leftTerminal.style.cssText = 'position:absolute; left:10px; top:0; bottom:0; display:flex; flex-direction:column; justify-content:space-around; z-index:10; pointer-events:none;';
    const rightTerminal = document.createElement('div');
    rightTerminal.style.cssText = 'position:absolute; right:10px; top:0; bottom:0; display:flex; flex-direction:column; justify-content:space-around; z-index:10; pointer-events:none;';
    gameArea.appendChild(leftTerminal);
    gameArea.appendChild(rightTerminal);

    const colors = ['#ff3333', '#3366ff', '#ffff33', '#33cc33'];
    const leftOrder = [0, 1, 2, 3];
    const rightOrder = [0, 1, 2, 3];
    let isParallel = true;
    while (isParallel) {
      for (let i = rightOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rightOrder[i], rightOrder[j]] = [rightOrder[j], rightOrder[i]];
      }
      isParallel = rightOrder.every((val, idx) => val === idx);
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute; inset:0; pointer-events:auto;';
    gameArea.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const leftNodes = [];
    const rightNodes = [];

    leftOrder.forEach((colorIdx, i) => {
      const node = document.createElement('div');
      node.style.cssText = `width:20px; height:20px; border-radius:50%; background:${colors[colorIdx]}; border:2px solid #fff; cursor:pointer; box-shadow:0 0 10px ${colors[colorIdx]}; pointer-events:none;`;
      leftTerminal.appendChild(node);
      leftNodes.push({ element: node, colorIdx, i });
    });

    rightOrder.forEach((colorIdx, i) => {
      const node = document.createElement('div');
      node.style.cssText = `width:20px; height:20px; border-radius:50%; background:${colors[colorIdx]}; border:2px solid #fff; cursor:pointer; box-shadow:0 0 10px ${colors[colorIdx]}; pointer-events:none;`;
      rightTerminal.appendChild(node);
      rightNodes.push({ element: node, colorIdx, i });
    });

    const instr = document.createElement('div');
    instr.textContent = 'RESTORE ELECTRICAL CIRCUITS [CONNECT SAME COLORS]';
    instr.style.cssText = 'text-align:center; font-size:10px; color:#66aa66; margin-top:15px; letter-spacing:1px;';
    container.appendChild(instr);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CLOSE [ESC]';
    closeBtn.style.cssText = [
      'position:absolute', 'right:15px', 'top:15px',
      'background:transparent', 'border:1px solid #ff3333',
      'color:#ff3333', 'cursor:pointer', 'padding:3px 8px', 'font-size:9px'
    ].join(';');
    closeBtn.addEventListener('click', closePuzzle);
    container.appendChild(closeBtn);

    document.body.appendChild(puzzleOverlay);

    canvas.width = gameArea.clientWidth || 460;
    canvas.height = gameArea.clientHeight || 280;

    let draggingNode = null;
    let mousePos = { x: 0, y: 0 };
    const connections = [null, null, null, null];

    function getCanvasCoords(element) {
      const rect = element.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      if (draggingNode) {
        const start = getCanvasCoords(draggingNode.element);
        ctx.strokeStyle = colors[draggingNode.colorIdx];
        ctx.shadowColor = colors[draggingNode.colorIdx];
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      connections.forEach((conn, leftIdx) => {
        if (conn !== null) {
          const start = getCanvasCoords(leftNodes[leftIdx].element);
          const end = getCanvasCoords(rightNodes[conn].element);
          const colorIdx = leftNodes[leftIdx].colorIdx;
          ctx.strokeStyle = colors[colorIdx];
          ctx.shadowColor = colors[colorIdx];
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
    }

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let clickedNode = false;
      leftNodes.forEach((node) => {
        const coords = getCanvasCoords(node.element);
        const dist = Math.sqrt((mx - coords.x)**2 + (my - coords.y)**2);
        if (dist < 30 && connections[node.i] === null) {
          draggingNode = node;
          mousePos = { x: mx, y: my };
          clickedNode = true;
        }
      });

      if (!clickedNode) {
        draggingNode = null;
      }
      draw();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      
      let overNode = false;
      [...leftNodes, ...rightNodes].forEach((node) => {
        const coords = getCanvasCoords(node.element);
        const dist = Math.sqrt((mousePos.x - coords.x)**2 + (mousePos.y - coords.y)**2);
        if (dist < 30) {
          if (leftNodes.includes(node)) {
            if (connections[node.i] === null) {
              overNode = true;
            }
          } else {
            if (draggingNode && draggingNode.colorIdx === node.colorIdx) {
              overNode = true;
            }
          }
        }
      });
      canvas.style.cursor = overNode ? 'pointer' : 'default';

      if (draggingNode) {
        draw();

        rightNodes.forEach((rNode) => {
          const coords = getCanvasCoords(rNode.element);
          const dist = Math.sqrt((mousePos.x - coords.x)**2 + (mousePos.y - coords.y)**2);
          if (dist < 30 && rNode.colorIdx === draggingNode.colorIdx) {
            connections[draggingNode.i] = rNode.i;
            draggingNode = null;
            draw();

            const allConnected = connections.every(c => c !== null);
            if (allConnected) {
              setTimeout(solvePuzzle, 350);
            }
          }
        });
      }
    });

    canvas.addEventListener('mouseup', () => {});

    setTimeout(draw, 50);
  }

  const handleKeyDown = (e) => {
    if (e.code === 'Escape' && active) {
      closePuzzle();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  let shakeTime = 0;

  function update(delta) {
    if (active) {
      shakeTime += delta * 40.0;
      const doorGroup = scene.getObjectByName("madRoomDoor");
      if (doorGroup) {
        const dx = 0.02 * Math.sin(shakeTime * 0.7);
        const dz = 0.025 * Math.cos(shakeTime * 1.1);
        doorGroup.position.set(dx, 0, dz);
      }

      state.sanity = Math.max(0, state.sanity - 2.0 * delta);
      hud.updateStats(state);
    } else {
      const doorGroup = scene.getObjectByName("madRoomDoor");
      if (doorGroup && doorGroup.position.length() > 0.001) {
        doorGroup.position.set(0, 0, 0);
      }
    }

    if (doorAnimating) {
      const targetAngle = -Math.PI / 1.5;
      const diff = targetAngle - doorAngle;
      if (Math.abs(diff) > 0.001) {
        doorAngle += Math.sign(diff) * Math.min(Math.abs(diff), 2.5 * delta);
        doorPivot.rotation.y = doorAngle;
      } else {
        doorAngle = targetAngle;
        doorPivot.rotation.y = doorAngle;
        doorAnimating = false;
        
        boxInteractable.prompt = "F: Take Generator Coil";
        boxInteractable.onInteract = () => {
          if (state.heldItem) {
            if (typeof state.dropHeldItem === 'function') {
              state.dropHeldItem();
            }
          }
          state.heldItem = 'generator_coil';
          hud.updateStats(state);
          
          boxGroup.remove(coilGroup);
          
          const idx = interactables.indexOf(boxInteractable);
          if (idx > -1) interactables.splice(idx, 1);
          
          hud.clearHovered();
          console.log("[Tiamat] Generator Coil collected from Breaker Box.");
        };
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
