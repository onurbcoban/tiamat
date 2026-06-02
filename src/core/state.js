export const state = {
  puzzles: {
    valve: false,
    pressure: false,
    simon: false,
  },
  doorOpen: false,
  powerRestored: false,
  pressureWheelAttached: false,

  sanity: 100,
  oxygen: 100,
  drowningTime: 0,
  heldItem: null,
  magnesiumCount: 0,
  isSwimming: false,
  waterDrained: false,
  isDead: false,
  madRoomSlamTriggered: false,

  readNotes: {
    captain: false,
    engineer: false,
    manifest: false,
    bridge: false,
  },

  get objectives() {
    const list = [];
    if (this.readNotes.captain) {
      list.push({
        id: 'investigate',
        title: "Find a way past Locked Bulkhead",
        desc: "The Captain's log mentions locking the East corridor bulkheads. Find a way to unlock/open them.",
        completed: this.puzzles.valve,
      });
    }
    if (this.readNotes.manifest) {
      list.push({
        id: 'findWheel',
        title: "Retrieve the Regulator Wheel",
        desc: "Machinist Yılmaz left the regulator wheel in his bunk (Bunk 3). Locate and take it.",
        completed: this.heldItem === 'pressure_valve_wheel' || this.pressureWheelAttached,
      });
    }
    if (this.readNotes.engineer) {
      list.push({
        id: 'calibratePressure',
        title: "Calibrate Hydraulic Pressure",
        desc: "Adjust hydraulic pressure on the lower deck regulator gauge to 6.0 ±0.2 Bar.",
        completed: this.puzzles.pressure,
      });
      list.push({
        id: 'alignValves',
        title: "Clear Turbine Blockage",
        desc: "Align drainage valves (left/right open, middle closed) to restore flow.",
        completed: this.waterDrained,
      });
      list.push({
        id: 'drainRoom',
        title: "Pull the Drainage Lever",
        desc: "Pull the bulkhead drainage lever once pressure and flow are cleared.",
        completed: this.puzzles.valve,
      });
      list.push({
        id: 'resetBreaker',
        title: "Reset the Generator Breaker Panel",
        desc: "Connect electrical wiring in the generator room's breaker box and insert the coil.",
        completed: this.powerRestored,
      });
    }
    if (this.readNotes.bridge) {
      list.push({
        id: 'escapeSequence',
        title: "Authorize Escape Hatch System",
        desc: "Input the final color synchronization code at the escape hatch control panel.",
        completed: this.puzzles.simon,
      });
    }
    return list;
  },

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

