class Enemy extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;
    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
    this.speed = config.speed || 1; // Default to 1, can be overridden
    this.directionChangeInterval = null;
    this.roamRange = config.roamRange || 64;
    this.chaseRange = config.chaseRange || 96;
    this.isChasing = false;
    this.isDestroyed = false;
    this.startingX = config.x;
    this.startingY = config.y;

    this.behaviourLoop = config.behaviourLoop || []; //  add a default loop
    this.maxHealth = config.maxHealth || 100;
    this.health = this.maxHealth;

    this.startRandomDirection();
  }

  startRandomDirection() {
    this.stopRandomDirection(); // Clear any existing interval before starting a new one
    this.directionChangeInterval = setInterval(() => {
      if (!this.isChasing && !this.isDestroyed) {
        this.randomDirection();
      }
    }, 2000);
  }

  stopRandomDirection() {
    if (this.directionChangeInterval) {
      clearInterval(this.directionChangeInterval);
      this.directionChangeInterval = null;
    }
  }

  takeDamage(damageAmount) {
    console.log(
      "Enemy " + this.id + " taking damage:",
      damageAmount,
      "Current health: " + this.health
    ); // Add this line
    this.health -= damageAmount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }
  }

  destroy() {
    this.isDestroyed = true; // Flag for removal from the map
    this.stopRandomDirection();
    utils.emitEvent("EnemyDestroyed", {
      enemyId: this.id,
    });
  }

  randomDirection() {
    const directions = ["up", "down", "left", "right"];
    const randomIndex = Math.floor(Math.random() * directions.length);
    this.direction = directions[randomIndex];
  }

  updateChaseDirection(hero) {
    const dx = hero.x - this.x;
    const dy = hero.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? "right" : "left";
    } else {
      this.direction = dy > 0 ? "down" : "up";
    }
  }

  update(state) {
    if (this.isDestroyed) {
      state.map.removeEnemy(this);
      return;
    }

    const hero = state.map.gameObjects.hero;
    const distanceToHero = Math.sqrt(
      Math.pow(hero.x - this.x, 2) + Math.pow(hero.y - this.y, 2)
    );

    if (distanceToHero <= this.chaseRange) {
      this.isChasing = true;
      this.stopRandomDirection();
      this.updateChaseDirection(hero);
    } else {
      if (this.isChasing) {
        this.isChasing = false;
        setTimeout(() => this.startRandomDirection(), 1000); // 🔴 Fix: Delay before returning to random movement
      }
    }

    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      if (
        !state.map.isCutscenePlaying &&
        state.map?.gameObjects?.hero &&
        !this.isDestroyed
      ) {
        this.startBehaviour(state, {
          type: "walk",
          direction: this.direction,
        });
      }
    }
    this.updateSprite();
  }

  startBehaviour(state, behaviour) {
    this.direction = behaviour.direction;

    if (behaviour.type === "walk") {
      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        setTimeout(() => {
          this.startBehaviour(state, behaviour);
        }, 10);
        return;
      }
      state.map.moveWall(this.x, this.y, this.direction);
      this.movingProgressRemaining = 16 / this.speed; // Adjust based on speed
      this.updateSprite(state);
    }
  }

  updatePosition() {
    if (this.movingProgressRemaining > 0) {
      const [property, change] = this.directionUpdate[this.direction];
      this[property] += change * this.speed;
      this.movingProgressRemaining -= 1;

      if (this.movingProgressRemaining === 0) {
        utils.emitEvent("EnemyWalkingComplete", {
          whoId: this.id,
        });
      }
    }
  }

  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation("walk-" + this.direction);
      return;
    }
    this.sprite.setAnimation("idle-" + this.direction);
  }

  cleanup() {
    this.stopRandomDirection();
    this.isDestroyed = true;
  }
}
