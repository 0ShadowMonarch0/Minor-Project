class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    this.keypressListener = null;
    this.hasAttacked = false; // New flag to track attack
    this.oldHeroPosition = null;
    this.directionInput = new DirectionInput();
    this.animationFrameId = null; // Track animation frame
    this.gameLoopActive = false; // Flag to control game loop
    //  this.gameSpeed = 60; // New property to control game speed (frames per second)
  }

  updateHeroUI() {
    if (!this.map?.gameObjects?.hero) {
      return;
    }
    const hero = this.map.gameObjects.hero;
    const healthPercent = (hero.health / hero.maxHealth) * 100;
    const staminaPercent = (hero.stamina / hero.maxStamina) * 100;

    document.querySelector(".health-level").style.width = `${healthPercent}%`;
    document.querySelector(".stamina-level").style.width = `${staminaPercent}%`;
  }

  //gameloop
  startGameloop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId); // Stop previous loop
    }

    this.gameLoopActive = true; // Mark loop as active

    const step = () => {
      if (!this.gameLoopActive) return; // Prevent duplicate loops

      //clear off the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      //Establish the Camera person
      const cameraPerson = this.map.gameObjects.hero;

      //update all objects
      Object.values(this.map.gameObjects).forEach((object) => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
          overworld: this,
        });
      });
      this.map.enemies.forEach((object) => {
        object.update({
          map: this.map,
          overworld: this,
        });
      });

      //Draw Lower Map
      this.map.drawLowerImage(this.ctx, cameraPerson);

      // //game objects
      // Object.values(this.map.gameObjects)

      // Draw game objects sorted by Y position (depth sorting)
      [...Object.values(this.map.gameObjects), ...this.map.enemies]
        .sort((a, b) => {
          return a.y - b.y;
        })
        .forEach((object) => {
          object.sprite.draw(this.ctx, cameraPerson);
        });
      this.map.enemies
        .sort((a, b) => {
          return a.y - b.y;
        })
        .forEach((object) => {
          object.sprite.draw(this.ctx, cameraPerson);
        });
      if (this.map.portal) {
        this.map.portal.sprite.draw(this.ctx, cameraPerson);
      }

      //Draw Upper Map
      this.map.drawUpperImage(this.ctx, cameraPerson);

      this.updateHeroUI();

      // Store the animation frame ID so it can be stopped properly
      this.animationFrameId = requestAnimationFrame(step);
    };
    this.animationFrameId = requestAnimationFrame(step);
    // step();
  }

  bindActionInput(bind = true) {
    if (!bind) {
      document.removeEventListener("keydown", this.keydownListener);
      document.removeEventListener("keyup", this.attackKeyUpListener);
      return;
    }
    this.keydownListener = (e) => {
      if (
        e.code === "Space" &&
        this.map.gameObjects.hero &&
        !this.hasAttacked
      ) {
        console.log("Space key pressed!");
        this.hasAttacked = true; // Set flag
        this.map.gameObjects.hero.isAttacking = true;
        setTimeout(() => {
          this.map.gameObjects.hero.isAttacking = false;
          this.hasAttacked = false; // Reset flag
        }, 200); // Attack duration
      }
    };
    document.addEventListener("keydown", this.keydownListener);

    this.attackKeyUpListener = (e) => {
      if (e.code === "Space") {
        this.hasAttacked = false;
      }
    };
    document.addEventListener("keyup", this.attackKeyUpListener);
  }

  bindHeroPositionCheck(bind = true) {
    if (!bind) {
      document.removeEventListener(
        "PersonWalkingComplete",
        this.positionCheckListener
      );
      return;
    }
    this.positionCheckListener = (e) => {
      if (e.detail.whoId === "hero") {
        const hero = this.map.gameObjects.hero;
        const portal = this.map.portal;
        if (!hero || !portal) {
          console.log("Hero or portal is null. Exiting.");
          return;
        }

        console.log(
          "PersonWalkingComplete Event - Hero Position: X=",
          hero.x,
          " Y=",
          hero.y
        );

        //Did position change?
        if (
          this.map.isSpaceTaken(
            this.map.gameObjects.hero.x,
            this.map.gameObjects.hero.y
          ) &&
          this.oldHeroPosition
        ) {
          console.warn("trying to move to taken position!");
          this.map.gameObjects.hero.x = this.oldHeroPosition.x;
          this.map.gameObjects.hero.y = this.oldHeroPosition.y;
          this.map.gameObjects.hero.direction = this.oldHeroPosition.direction;
        }
        this.oldHeroPosition = null;
        //Is going to touch the portal
        if (portal && hero) {
          console.log("Hero Position: X=", hero.x, " Y=", hero.y);
          console.log("Portal Position: X=", portal.x, " Y=", portal.y);

          //ADD THIS
          const heroGridX = hero.x;
          const heroGridY = hero.y;
          const portalGridX = portal.x;
          const portalGridY = portal.y;
          if (heroGridX === portalGridX && heroGridY === portalGridY) {
            if (this.mapId === "lvl1") {
              this.transitionTo("lvl2");
            } else {
              this.transitionTo("lvl3");
            }
          }
        }
      }
    };
    document.addEventListener(
      "PersonWalkingComplete",
      this.positionCheckListener
    );
  }

  //map transition
  transitionTo(mapId) {
    console.log("Transitioning to level:", mapId); // Debugging
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId); // Stop previous loop
      this.animationFrameId = null; // Reset frame ID
      this.gameLoopActive = false; // Mark loop as inactive
    }
    //CHECK MAPID VALUE
    //Update the reference to the new map
    this.directionInput.stop();
    this.bindActionInput(false);
    this.bindHeroPositionCheck(false);
    //UnmountObjects
    this.map.unmountObjects();

    const oldHero = this.map.gameObjects.hero;

    //Create new Board
    const newMap = new OverworldMap(window.OverworldMaps[mapId]);
    this.map = newMap;
    this.mapId = mapId;

    if (this.map.gameObjects.hero) {
      this.map.gameObjects.hero.isPlayerControlled = true;
      this.map.gameObjects.hero.x = oldHero.x; // Maintain hero position
      this.map.gameObjects.hero.y = oldHero.y;
      this.map.gameObjects.hero.isAttacking = false; // Reset attack state
    }

    this.map.isCutscenePlaying = false;

    //Init
    this.map.mountObjects(); // Add this line
    this.directionInput.init(); //Reinit Input
    this.bindActionInput();
    this.bindHeroPositionCheck();

    // Start enemy spawning for the new level
    this.map.startEnemySpawning(mapId); // Pass the mapId (e.g., "lvl1", "lvl2")

    //Start Gameloop
    this.startGameloop();
  }

  startNextLevelCutscene() {
    this.map.startCutscene([
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
    ]);
  }

  stopGameLoop() {
    this.gameLoopActive = false; // Set the flag to stop the game loop
    cancelAnimationFrame(this.animationFrameId); // Cancel the animation frame
  }

  showGameOverScreen() {
    const gameOverScreen = document.querySelector(".game-over-screen");
    gameOverScreen.classList.add("active");
  }

  init() {
    this.mapId = "lvl1";
    this.map = new OverworldMap(window.OverworldMaps[this.mapId]);
    this.map.mountObjects();

    this.directionInput = new DirectionInput();
    this.directionInput.init();
    this.bindActionInput();
    this.bindHeroPositionCheck();

    // Start enemy spawning for the initial level
    this.map.startEnemySpawning("lvl1");

    this.startGameloop();
    this.startNextLevelCutscene();

    this.map.startCutscene([
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "npcB", type: "walk", direction: "left" },
      { who: "npcB", type: "walk", direction: "left" },
      { who: "npcB", type: "walk", direction: "left" },
      { who: "npcB", type: "stand", direction: "up", time: 800 },
    ]);
  }
}
