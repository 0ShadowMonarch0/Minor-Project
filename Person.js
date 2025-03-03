class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;

    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
    this.isAttacking = false;

    this.maxHealth = config.maxHealth || 100; // Hero's Maximum Health
    this.health = this.maxHealth;
    this.maxStamina = config.maxStamina || 100;
    this.stamina = this.maxStamina;
    this.staminaRegenRate = config.staminaRegenRate || 0.5; // Stamina Regen Per Step
  }

  recoverStamina() {
    this.stamina = Math.min(
      this.maxStamina,
      this.stamina + this.staminaRegenRate
    );
  }

  update(state) {
    this.recoverStamina();
    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      //Here cases for starting to walk will come here
      //
      //

      // Case : We are ready to provide input for the character to be moving and have key pressed
      if (
        !state.map.isCutscenePlaying &&
        this.isPlayerControlled &&
        state.arrow
      ) {
        this.startBehaviour(state, {
          type: "walk",
          direction: state.arrow,
        });
      }
      this.updateSprite(state);
    }
    this.handleAttack(state);
  }

  handleAttack(state) {
    if (this.isPlayerControlled && this.isAttacking && this.stamina >= 10) {
      const attackDirection = this.direction; // Use current direction for attack
      const attackRange = 24; // Reduced attack range
      // const { x, y } = utils.nextPosition(this.x, this.y, attackDirection);
      this.stamina -= 10;
      // Perform attack
      state.map.enemies.forEach((enemy) => {
        const distance = Math.sqrt(
          Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2)
        );
        if (distance <= attackRange) {
          console.log("Enemy hit!", enemy);
          enemy.takeDamage(10);
          this.pushBackEnemy(enemy, attackDirection, state.map);
        }
      });
    }
  }

  pushBackEnemy(enemy, direction, map) {
    const pushbackDistance = 16; // Adjust as needed
    const [property, change] = enemy.directionUpdate[direction];

    // Calculate the new enemy position
    const newX =
      enemy.x +
      (direction === "left"
        ? -pushbackDistance
        : direction === "right"
        ? pushbackDistance
        : 0);
    const newY =
      enemy.y +
      (direction === "up"
        ? -pushbackDistance
        : direction === "down"
        ? pushbackDistance
        : 0);
    let canPush = false;

    // Check if the new position is within map bounds and not a wall
    if (
      map.isWithinMapBounds(newX, newY) &&
      !map.walls[`${newX},${newY}`] &&
      !(map.gameObjects.hero.x === newX && map.gameObjects.hero.y === newY)
    ) {
      canPush = true;
    }

    if (canPush) {
      console.log("Pushing enemy", enemy.id, "in direction", direction);
      // Apply the pushback
      enemy[property] += change;
      enemy.movingProgressRemaining = pushbackDistance / enemy.speed;
    }
  }

  startBehaviour(state, behaviour) {
    //set the character direction to whatever behaviour has
    this.direction = behaviour.direction;

    if (behaviour.type === "walk") {
      //Stop here if space is not free

      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        behaviour.retry &&
          setTimeout(() => {
            this.startBehaviour(state, behaviour);
          }, 10);
        return;
      }

      //Ready to walk
      state.map.moveWall(this.x, this.y, this.direction);
      this.movingProgressRemaining = 16;
      this.updateSprite(state);
    }

    if (behaviour.type === "stand") {
      setTimeout(() => {
        utils.emitEvent("PersonStandComplete", {
          whoId: this.id,
        });
      }, behaviour.time);
    }
  }

  updatePosition() {
    if (this.movingProgressRemaining > 0) {
      const [property, change] = this.directionUpdate[this.direction];
      this[property] += change;
      this.movingProgressRemaining -= 1;

      if (this.movingProgressRemaining === 0) {
        //we finished the walk!
        utils.emitEvent("PersonWalkingComplete", {
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

    if (this.isAttacking) {
      this.sprite.setAnimation("attack-" + this.direction);
      return;
    }

    this.sprite.setAnimation("idle-" + this.direction);
  }
}
