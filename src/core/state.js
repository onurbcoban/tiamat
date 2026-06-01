export const state = {
  puzzles: {
    valve: false,
    pressure: false,
    simon: false,
  },
  doorOpen: false,
  powerRestored: false,

  sanity: 100,
  oxygen: 100,
  drowningTime: 0,
  heldItem: null,
  magnesiumCount: 0,
  isSwimming: false,
  waterDrained: false,
  isDead: false,
  madRoomSlamTriggered: false,

  get allSolved() {
    return this.puzzles.valve && this.puzzles.pressure && this.puzzles.simon;
  },

  onPuzzleSolved: null,

  solve(name) {
    if (this.puzzles[name]) return;
    this.puzzles[name] = true;
    console.log(`[Tiamat] Puzzle solved: ${name}`);
    if (this.onPuzzleSolved) this.onPuzzleSolved(name);
  },
};

