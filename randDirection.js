class DirectionInput {
  constructor() {
    this.heldDirections = [];
    this.defaultMap = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    this.map = { ...this.defaultMap };
    this.isKeyDown = false;
    this.currentPressedDirection = null;
    this.randomizationInterval = null;

    this.controlUI = new ControlUI(); // Use ControlUI

    this.controlUI.updateControlsDisplay(this.map); // Initial UI update
  }

  get direction() {
    return this.heldDirections[0] || null;
  }

  shuffleControls() {
    const directions = ["up", "down", "left", "right"];

    // Shuffle directions while ensuring no duplicates
    let shuffledDirections = [...directions].sort(() => Math.random() - 0.5);

    // Assign shuffled values to WASD
    this.map.KeyW = shuffledDirections[0];
    this.map.KeyA = shuffledDirections[1];
    this.map.KeyS = shuffledDirections[2];
    this.map.KeyD = shuffledDirections[3];

    // Mirror the WASD mapping to Arrow keys
    this.map.ArrowUp = this.map.KeyW;
    this.map.ArrowLeft = this.map.KeyA;
    this.map.ArrowDown = this.map.KeyS;
    this.map.ArrowRight = this.map.KeyD;

    console.log("New randomized controls:", this.map);

    // UI Updates
    this.controlUI.updateControlsDisplay(this.map);
    this.controlUI.showShuffleMessage();
    this.controlUI.playShuffleSound();
  }

  startRandomizingControls() {
    this.shuffleControls(); // Shuffle immediately
    this.randomizationInterval = setInterval(() => {
      this.shuffleControls();
    }, 10000); // Shuffle every 10 seconds
  }

  stopRandomizingControls() {
    clearInterval(this.randomizationInterval);
    this.map = { ...this.defaultMap }; // Reset to default controls
    console.log("Controls reset to default.");
  }

  init() {
    this.startRandomizingControls(); // Start control randomization

    this.keydownListener = (e) => {
      const dir = this.map[e.code];
      if (dir) {
        this.isKeyDown = true;
        this.currentPressedDirection = dir;
        this.heldDirections = [];
        this.heldDirections.unshift(dir);
      }
    };

    this.keyupListener = (e) => {
      const dir = this.map[e.code];
      if (dir && this.currentPressedDirection === dir) {
        this.isKeyDown = false;
        this.currentPressedDirection = null;
        this.heldDirections = [];
      }
    };

    document.addEventListener("keydown", this.keydownListener);
    document.addEventListener("keyup", this.keyupListener);
  }

  stop() {
    document.removeEventListener("keydown", this.keydownListener);
    document.removeEventListener("keyup", this.keyupListener);
    this.stopRandomizingControls();
  }
}
