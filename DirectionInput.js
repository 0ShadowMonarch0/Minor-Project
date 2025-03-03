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
    //newly added
    this.randomDirectionInterval = null;
    this.randomizeDirection = this.randomizeDirection.bind(this);
    this.lastRandom = null;
    this.isPlayerControlled = true;
    //newly added end
  }

  get direction() {
    return this.heldDirections[0];
  }

  //newly added
  startRandomDirection() {
    this.randomizeDirection();
    this.randomDirectionInterval = setInterval(this.randomizeDirection, 5000); // 5 seconds
  }

  stopRandomDirection() {
    clearInterval(this.randomDirectionInterval);
  }

  randomizeDirection() {
    const directions = ["up", "down", "left", "right"];

    do {
      this.randomIndex = Math.floor(Math.random() * directions.length);
    } while (this.randomIndex === this.lastRandom);

    this.lastRandom = this.randomIndex;

    const newDirection = directions[this.randomIndex];

    // Clear the previous held direction
    this.heldDirections = [];

    // Add new random direction
    this.heldDirections.unshift(newDirection);
  }
  //newly added end

  stop() {
    document.removeEventListener("keydown", this.keydownListener);
    document.removeEventListener("keyup", this.keyupListener);
  }

  init() {
    this.startRandomDirection();

    this.keydownListener = (e) => {
      this.isPlayerControl = true;
      const dir = this.map[e.code];
      if (dir) {
        this.heldDirections = [];
        this.heldDirections.unshift(dir);
      }
    };

    this.keyupListener = (e) => {
      this.isPlayerControl = false;
      const dir = this.map[e.code];
      const index = this.heldDirections.indexOf(dir);
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    };

    document.addEventListener("keydown", this.keydownListener);
    document.addEventListener("keyup", this.keyupListener);
  }
}
