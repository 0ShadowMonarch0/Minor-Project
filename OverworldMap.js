class OverworldMap {
  constructor(config) {
    this.gameObjects = config.gameObjects;
    this.walls = config.walls || {};
    this.lowerImage = new Image();
    this.lowerImage.src = config.lowersrc;

    this.upperImage = new Image();
    this.upperImage.src = config.uppersrc;

    this.isCutscenePlaying = true;
    this.enemies = [];
    this.enemySpawnTimer = null;
    this.enemySpawnInterval = 3000; // spawn every 3 seconds
    this.maxEnemies = config.maxEnemies || 3; // limit to 15 enemies at a time 🔴 Changed here
    this.enemiesDefeated = 0; // New variable
    this.portal = null; // New variable to reference portal
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    );
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    );
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    if (this.portal && this.portal.x === x && this.portal.y === y) {
      return false;
    }

    // Check if next position is a wall or another enemy, then return true if space is taken
    return (
      this.walls[`${x},${y}`] ||
      this.isEnemySpaceTaken(x, y) ||
      !this.isWithinMapBounds(x, y) ||
      (this.gameObjects.hero.x === x && this.gameObjects.hero.y === y)
    );
  }

  isWithinMapBounds(x, y) {
    const maxX = utils.withGrid(39); // Adjust based on your map width in tiles
    const maxY = utils.withGrid(15); // Adjust based on your map height in tiles
    return x >= 2 && x < maxX && y >= 2 && y < maxY;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach((key) => {
      let object = this.gameObjects[key];
      object.id = key;
      //TODO : IF this object should actually mount

      object.mount(this);
    });
    document.addEventListener("EnemyDestroyed", (event) => {
      if (this.enemies.some((e) => e.id === event.detail.enemyId)) {
        this.enemiesDefeated += 1;
        this.checkWinCondition();
      }
    });
  }

  startEnemySpawning(lvl) {
    console.log("Starting enemy spawning for level:", lvl); // Debugging
    this.enemySpawnTimer = setInterval(() => {
      if (
        this.enemies.length < this.maxEnemies &&
        !this.isCutscenePlaying &&
        this.enemiesDefeated < this.maxEnemies
      ) {
        this.spawnEnemy(lvl);
      }
    }, this.enemySpawnInterval);
  }

  stopEnemySpawning() {
    clearInterval(this.enemySpawnTimer);
  }

  isEnemySpaceTaken(x, y) {
    return this.enemies.some((enemy) => {
      return enemy.x === x && enemy.y === y;
    });
  }

  spawnEnemy(level) {
    console.log("Spawning enemy for level:", level); // Debugging
    if (this.enemies.length >= this.maxEnemies) {
      return; // Prevent spawning more than maxEnemies
    }

    const hero = this.gameObjects.hero;
    let x, y;
    let attempts = 0;
    const maxAttempts = 50; // avoid infinite loops

    do {
      x = utils.withGrid(Math.floor(Math.random() * 20)); // Random x position
      y = utils.withGrid(Math.floor(Math.random() * 15)); // Random y position
      attempts++;
      if (attempts > maxAttempts) {
        console.warn(
          "Could not find a valid spawn point for enemy after " +
            maxAttempts +
            " attempts."
        );
        return; // Exit if no valid spawn point is found
      }
    } while (this.isSpaceTaken(x, y));

    // Get enemy configuration based on the level
    const enemyConfig = EnemyTypes[level] || EnemyTypes.lvl1; // Default to level1 if level is not found
    console.log("Enemy config:", enemyConfig); // Debugging

    const enemy = new Enemy({
      x: x,
      y: y,
      src: enemyConfig.src,
      speed: enemyConfig.speed, //Slower Speed
      maxHealth: enemyConfig.maxHealth,
      frameSize: enemyConfig.frameSize,
    });

    enemy.id = `enemy_${Date.now()}`;
    enemy.mount(this);
    this.enemies.push(enemy);
  }

  removeEnemy(enemyToRemove) {
    this.enemies = this.enemies.filter(
      (enemy) => enemy.id !== enemyToRemove.id
    );
    this.removeWall(enemyToRemove.x, enemyToRemove.y);
  }

  //Winning condition i.e. defeating required enemies
  // didWin() {
  //   return this.enemiesDefeated >= this.maxEnemies;
  // }
  checkWinCondition() {
    if (this.enemiesDefeated >= this.maxEnemies && !this.portal) {
      this.stopEnemySpawning();
      this.spawnPortal();
    }
  }
  spawnPortal() {
    const x = utils.withGrid(5); // fixed position
    const y = utils.withGrid(5); // fixed position
    this.portal = new GameObject({
      x: x,
      y: y,
      src: "/images/smallPortal.png", // img reference
      behaviourLoop: [],
    });
    this.portal.id = `portal_${Date.now()}`;
    this.portal.mount(this);
    this.addWall(x, y);
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    //start a loop of async events
    //await each one
    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      });
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }

  removeWall(x, y) {
    delete this.walls[`${x},${y}`];
  }

  moveWall(wasX, wasY, direction) {
    if (this.isCutscenePlaying || !this.gameObjects?.hero) {
      return;
    }

    this.removeWall(wasX, wasY);
    const { x, y } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }

  unmountObjects() {
    this.stopEnemySpawning(); // Stop the Timer to avoid memory problems

    Object.keys(this.gameObjects).forEach((key) => {
      let object = this.gameObjects[key];
      object.isMounted = false;
      this.removeWall(object.x, object.y);
    });
    this.enemies.forEach((enemy) => {
      this.removeWall(enemy.x, enemy.y);
    });

    this.enemies = [];
    if (this.portal) {
      this.removeWall(this.portal.x, this.portal.y);
    }
    this.portal = null;
  }
}

window.OverworldMaps = {
  lvl1: {
    mapId: "lvl1",
    lowersrc: "/images/final_level1.png",
    uppersrc: "/images/layer_1.png",
    maxEnemies: 5,
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
        maxHealth: 100,
        maxStamina: 100,
      }),
      npcA: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(10),
        src: "/images/prince.png",
        behaviourLoop: [
          { type: "stand", direction: "up", time: 800 },
          { type: "stand", direction: "left", time: 500 },
          { type: "stand", direction: "down", time: 600 },
          { type: "stand", direction: "right", time: 300 },
        ],
      }),
      npcB: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/images/santa.png",
        behaviourLoop: [
          { type: "walk", direction: "left" },
          { type: "stand", direction: "down", time: 800 },
          { type: "walk", direction: "down" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "up" },
        ],
      }),
    },
    walls: (() => {
      const walls = {};
      for (let y = 2; y <= 15; y++) {
        walls[utils.asGridCoord(0, y)] = true;
        walls[utils.asGridCoord(39, y)] = true;
      }
      for (let x = 0; x <= 39; x++) {
        walls[utils.asGridCoord(x, 1)] = true;
        walls[utils.asGridCoord(x, 15)] = true;
        if (x >= 32) {
          walls[utils.asGridCoord(x, 2)] = true;
        }
      }
      // Add other individual walls
      walls[utils.asGridCoord(14, 9)] = true;
      walls[utils.asGridCoord(15, 8)] = true;
      walls[utils.asGridCoord(16, 7)] = true;
      walls[utils.asGridCoord(17, 6)] = true;
      walls[utils.asGridCoord(18, 6)] = true;
      walls[utils.asGridCoord(19, 6)] = true;
      walls[utils.asGridCoord(20, 6)] = true;

      return walls;
    })(),
  },

  lvl2: {
    mapId: "lvl2",
    lowersrc: "/images/sprite-0004.png",
    uppersrc: "/images/level0004-1.png",
    maxEnemies: 5,
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
        maxHealth: 100,
        maxStamina: 100,
      }),
      npcA: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(10),
        src: "/images/prince.png",
        behaviourLoop: [
          { type: "stand", direction: "up", time: 800 },
          { type: "stand", direction: "left", time: 500 },
          { type: "stand", direction: "down", time: 600 },
          { type: "stand", direction: "right", time: 300 },
        ],
      }),
      npcB: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/images/santa.png",
        behaviourLoop: [
          { type: "walk", direction: "left" },
          { type: "stand", direction: "down", time: 800 },
          { type: "walk", direction: "down" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "up" },
        ],
      }),
    },
    walls: (() => {
      const walls = {};
      for (let y = 2; y <= 15; y++) {
        walls[utils.asGridCoord(0, y)] = true;
        walls[utils.asGridCoord(39, y)] = true;
      }
      for (let x = 0; x <= 39; x++) {
        walls[utils.asGridCoord(x, 1)] = true;
        walls[utils.asGridCoord(x, 15)] = true;
        if (x >= 32) {
          walls[utils.asGridCoord(x, 2)] = true;
        }
      }
      // Add other individual walls
      walls[utils.asGridCoord(14, 9)] = true;
      walls[utils.asGridCoord(15, 8)] = true;
      walls[utils.asGridCoord(16, 7)] = true;
      walls[utils.asGridCoord(17, 6)] = true;
      walls[utils.asGridCoord(18, 6)] = true;
      walls[utils.asGridCoord(19, 6)] = true;
      walls[utils.asGridCoord(20, 6)] = true;

      return walls;
    })(),
  },
  lvl3: {
    mapId: "lvl3",
    lowersrc: "/images/level3_.png",
    uppersrc: "/images/level3_1.png",
    maxEnemies: 2,
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
        maxHealth: 100,
        maxStamina: 100,
      }),
    },
  },
};
