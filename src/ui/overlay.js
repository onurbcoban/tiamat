export function createOverlay(onStart) {
  const startEl = document.createElement('div');
  startEl.id = 'overlay';
  startEl.innerHTML = `
    <h1>TIAMAT</h1>
    <p class="subtitle">Submarine Escape</p>

    <div class="controls-list">
      <div class="ctrl-row"><span class="key">W A S D</span><span>Movement</span></div>
      <div class="ctrl-row"><span class="key">MOUSE</span><span>Look</span></div>
      <div class="ctrl-row"><span class="key">C</span><span>Crouch</span></div>
      <div class="ctrl-row"><span class="key">SPACE</span><span>Jump</span></div>
      <div class="ctrl-row"><span class="key">Q / E</span><span>Flashlight Brightness</span></div>
      <div class="ctrl-row"><span class="key">F</span><span>Interaction (valves, gauge)</span></div>
      <div class="ctrl-row"><span class="key">CLICK</span><span>Simon Says Panel</span></div>
    </div>

    <button id="start-btn">START</button>
  `;
  document.body.appendChild(startEl);

  const winEl = document.createElement('div');
  winEl.id = 'win-overlay';
  winEl.innerHTML = `
    <div class="win-box">
      <h2>ESCAPE SUCCESSFUL</h2>
      <p>You have escaped from Tiamat.</p>
    </div>
  `;
  document.body.appendChild(winEl);

  const deathEl = document.createElement('div');
  deathEl.id = 'death-overlay';
  deathEl.innerHTML = `
    <div class="death-box">
      <h2>YOU DROWNED</h2>
      <p>Your oxygen has run out.</p>
    </div>
  `;
  document.body.appendChild(deathEl);

  document.getElementById('start-btn').addEventListener('click', () => {
    startEl.classList.add('hidden');
    onStart();
  });

  return {
    showWin() {
      winEl.classList.add('visible');
      document.exitPointerLock();
    },
    showDeath(onComplete) {
      deathEl.classList.add('visible');
      document.exitPointerLock();
      setTimeout(() => {
        deathEl.classList.remove('visible');
        if (onComplete) onComplete();
      }, 3000);
    }
  };
}
