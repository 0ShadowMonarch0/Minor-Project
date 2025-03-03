class DirectionInput {
  constructor() {
    this.heldDirections = [];
    this.map = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    this.randomDirectionInterval = null;
    this.randomizeDirection = this.randomizeDirection.bind(this);
    this.lastRandom = null;
    this.currentPressedDirection = null;
    this.isKeyDown = false;
  }

  get direction() {
    return this.heldDirections[0] || null;
  }

  startRandomDirection() {
    this.randomDirectionInterval = setInterval(() => {
      if (this.isKeyDown) {
        this.randomizeDirection();
      }
    }, 5000);
  }

  stopRandomDirection() {
    clearInterval(this.randomDirectionInterval);
    console.log("Stopping Direction listener!")
  }

  randomizeDirection() {
    const directions = ["up", "down", "left", "right"];
    let randomIndex;

    do {
      randomIndex = Math.floor(Math.random() * 4);
    } while (randomIndex === this.lastRandom);

    this.lastRandom = randomIndex;

    if (this.currentPressedDirection) {
      this.heldDirections = [];
      this.heldDirections.unshift(directions[randomIndex]);
    }
  }

  init() {
    this.startRandomDirection();

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
  }
}
