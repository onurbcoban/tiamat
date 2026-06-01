import * as THREE from 'three';

const INTERACT_DISTANCE = 3.2;

export function createInteraction(camera, interactables, getIsLocked) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = INTERACT_DISTANCE;

  let hoveredItem = null;

  document.addEventListener('keydown', e => {
    if (e.code !== 'KeyF') return;
    if (!getIsLocked()) return;
    if (hoveredItem?.onInteract) hoveredItem.onInteract();
  });

  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (!getIsLocked()) return;
    if (hoveredItem?.onClick) hoveredItem.onClick();
  });

  function highlight(item) {
    if (!item) return;
    const target = item.highlightMesh ?? item.mesh;
    if (!target?.material) return;
    const mat = target.material;
    if (!mat.emissive) return;
    item._origEmissive = mat.emissive.getHex();
    mat.emissive.setHex(0x060c12);
  }

  function unhighlight(item) {
    if (!item) return;
    const target = item.highlightMesh ?? item.mesh;
    if (!target?.material) return;
    const mat = target.material;
    if (!mat.emissive) return;
    mat.emissive.setHex(item._origEmissive ?? 0x000000);
    item._origEmissive = undefined;
  }

  function update(hud) {
    if (!getIsLocked()) {
      if (hoveredItem) { unhighlight(hoveredItem); hoveredItem = null; }
      hud.clearHovered();
      return;
    }

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    const meshes = interactables.map(i => i.mesh).filter(Boolean);
    const hits   = raycaster.intersectObjects(meshes, false);

    if (hits.length > 0) {
      const newItem = interactables.find(i => i.mesh === hits[0].object);

      if (newItem !== hoveredItem) {
        unhighlight(hoveredItem);
        hoveredItem = newItem;
        highlight(hoveredItem);
      }
      hud.setHovered(hoveredItem.name, hoveredItem.prompt ?? null);
    } else {
      if (hoveredItem) {
        unhighlight(hoveredItem);
        hoveredItem = null;
      }
      hud.clearHovered();
    }
  }

  return { update };
}

const SANITY_RESTORE = 25;

export function createMagnesiumHotkey(state, hud, getIsLocked) {
  const flash = document.createElement('div');
  flash.id = 'magnesium-flash';
  flash.style.cssText = [
    'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:900',
    'background:radial-gradient(ellipse at center,rgba(80,220,120,0.18) 0%,rgba(40,180,80,0.10) 60%,transparent 100%)',
    'opacity:0', 'transition:opacity 0.08s ease-in'
  ].join(';');
  document.body.appendChild(flash);

  function doFlash() {
    flash.style.transition = 'opacity 0.08s ease-in';
    flash.style.opacity = '1';
    setTimeout(() => {
      flash.style.transition = 'opacity 0.55s ease-out';
      flash.style.opacity = '0';
    }, 120);
  }

  document.addEventListener('keydown', e => {
    if (e.code !== 'KeyH') return;
    if (!getIsLocked()) return;

    if (state.magnesiumCount <= 0) {
      console.log('[Tiamat] No magnesium tablets remaining.');
      return;
    }

    const before = state.sanity;
    state.magnesiumCount -= 1;
    state.sanity = Math.min(100, state.sanity + SANITY_RESTORE);
    hud.updateStats(state);
    doFlash();

    console.log(
      `[Tiamat] Used magnesium. Sanity: ${before} → ${state.sanity}. Remaining: ${state.magnesiumCount}`
    );
  });
}
