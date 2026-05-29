export function createHUD() {
  function el(tag, id) {
    const e = document.createElement(tag);
    if (id) e.id = id;
    return e;
  }

  const crosshair = el('div', 'crosshair');
  document.body.appendChild(crosshair);

  const nameEl = el('div', 'object-name');
  document.body.appendChild(nameEl);

  const promptEl = el('div', 'interaction-prompt');
  document.body.appendChild(promptEl);

  const journalEl = el('div', 'journal-overlay');
  journalEl.innerHTML = `
    <div class="journal-box">
      <div class="journal-header" id="journal-title">LOG ENTRY</div>
      <div class="journal-content" id="journal-text"></div>
      <button id="journal-close-btn">CLOSE</button>
    </div>
  `;
  document.body.appendChild(journalEl);

  const oxygenVignette = el('div', 'oxygen-vignette');
  document.body.appendChild(oxygenVignette);

  const sanityVignette = el('div', 'sanity-vignette');
  sanityVignette.style.cssText = [
    'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:11',
    'opacity:0', 'transition:opacity 1.2s ease',
    'background:radial-gradient(ellipse at center,transparent 35%,rgba(140,0,0,0.65) 100%)'
  ].join(';');
  document.body.appendChild(sanityVignette);

  const statusEl = el('div', 'puzzle-status');
  statusEl.innerHTML = `
    <div class="puzzle-status-title">OBJECTIVES</div>
    <div class="puzzle-indicator" id="ind-valve">
      <span class="puzzle-check">[ ]</span>
      <span>Valves</span>
    </div>
    <div class="puzzle-indicator" id="ind-pressure">
      <span class="puzzle-check">[ ]</span>
      <span>Pressure</span>
    </div>
    <div class="puzzle-indicator" id="ind-simon">
      <span class="puzzle-check">[ ]</span>
      <span>Panel</span>
    </div>
  `;
  document.body.appendChild(statusEl);

  const statsEl = el('div', 'stats-panel');
  statsEl.innerHTML = `
    <div class="stat-row">
      <span class="stat-label">SANITY</span>
      <div class="stat-bar-bg">
        <div class="stat-bar" id="bar-sanity"></div>
      </div>
    </div>
    <div class="stat-row" id="oxygen-row" style="display:none">
      <span class="stat-label">OXYGEN</span>
      <div class="stat-bar-bg">
        <div class="stat-bar" id="bar-oxygen"></div>
      </div>
    </div>
  `;
  document.body.appendChild(statsEl);

  const itemEl = el('div', 'item-panel');
  itemEl.innerHTML = `
    <div class="item-row" id="held-item-row">
      <span class="item-label">HOLDING</span>
      <span class="item-value" id="held-item-value">—</span>
    </div>
    <div class="item-row" id="magnesium-row" style="display:none">
      <span class="item-label">MAGNESIUM</span>
      <span class="item-value" id="magnesium-value">0</span>
      <span class="item-hint">[H]</span>
    </div>
  `;
  document.body.appendChild(itemEl);

  return {
    setHovered(name, prompt = null) {
      nameEl.textContent = name;
      nameEl.classList.add('visible');
      if (prompt) {
        promptEl.textContent = prompt;
        promptEl.classList.add('visible');
      } else {
        promptEl.classList.remove('visible');
      }
    },

    clearHovered() {
      nameEl.classList.remove('visible');
      promptEl.classList.remove('visible');
    },

    markSolved(puzzleName) {
      const ind = document.getElementById(`ind-${puzzleName}`);
      if (ind) {
        ind.classList.add('solved');
        const check = ind.querySelector('.puzzle-check');
        if (check) check.textContent = '[✓]';
      }
    },

    showJournal(title, text, onClose) {
      document.getElementById('journal-title').textContent = title;
      document.getElementById('journal-text').textContent = text;
      journalEl.classList.add('visible');

      const closeBtn = document.getElementById('journal-close-btn');
      const handleClose = () => {
        journalEl.classList.remove('visible');
        closeBtn.removeEventListener('click', handleClose);
        if (onClose) onClose();
      };
      closeBtn.addEventListener('click', handleClose);
    },

    updateStats(state) {
      const sanityBar = document.getElementById('bar-sanity');
      if (sanityBar) {
        sanityBar.style.width = `${state.sanity}%`;
        sanityBar.className = 'stat-bar' + (state.sanity < 30 ? ' danger' : state.sanity < 60 ? ' warn' : '');
      }

      const oxygenRow = document.getElementById('oxygen-row');
      if (oxygenRow) oxygenRow.style.display = (state.isSwimming || state.oxygen < 100) ? 'flex' : 'none';
      const oxygenBar = document.getElementById('bar-oxygen');
      if (oxygenBar) {
        oxygenBar.style.width = `${state.oxygen}%`;
        oxygenBar.className = 'stat-bar oxygen' + (state.oxygen < 30 ? ' danger' : '');
      }

      const oxyVig = document.getElementById('oxygen-vignette');
      if (oxyVig) {
        const intensity = state.oxygen < 60 ? (60 - state.oxygen) / 60 : 0;
        const drownIntensity = state.drowningTime / 4.0;
        oxyVig.style.opacity = Math.max(intensity, drownIntensity);
      }

      if (sanityVignette) {
        const vigIntensity = state.sanity < 70 ? (70 - state.sanity) / 70 : 0;
        sanityVignette.style.opacity = vigIntensity.toFixed(3);
      }

      const sanityBlur = state.sanity < 60 ? ((60 - state.sanity) / 60) * 5.0 : 0.0;
      let oxygenBlur = 0.0;
      if (state.oxygen < 40 && state.oxygen > 0) {
        oxygenBlur = ((40 - state.oxygen) / 40) * 4.0;
      } else if (state.oxygen === 0) {
        oxygenBlur = 4.0 + (state.drowningTime / 4.0) * 8.0;
      }
      const totalBlur = Math.max(sanityBlur, oxygenBlur);
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.filter = `blur(${totalBlur.toFixed(2)}px)`;
      }

      const heldValue = document.getElementById('held-item-value');
      if (heldValue) heldValue.textContent = state.heldItem ? state.heldItem.replace(/_/g, ' ').toUpperCase() : '—';

      const magRow = document.getElementById('magnesium-row');
      const magValue = document.getElementById('magnesium-value');
      if (magRow) magRow.style.display = state.magnesiumCount > 0 ? 'flex' : 'none';
      if (magValue) magValue.textContent = state.magnesiumCount;

      document.body.classList.toggle('swimming', !!state.isSwimming);
      document.body.classList.toggle('low-sanity', state.sanity < 40 || state.oxygen < 40);
      document.body.classList.toggle('critical-sanity', state.sanity < 20 || state.oxygen < 20);
    },
  };
}

