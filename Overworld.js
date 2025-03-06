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
    // 🔴 Add background music
    this.backgroundMusic = new Audio(
      "/music/Warriyo - Mortals (feat. Laura Brehm)  Future Trap  NCS - Copyright Free Music.mp3"
    ); // Or .ogg
    this.backgroundMusic.loop = true;

    this.storyText = [];
    this.storyIndex = 0;
    this.storyTimer = null;
    this._this = this;

    this.isGameActive = false; // ✅ Flag to track active gameplay
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

  // Start the story sequence
  startStorySequence(storyArray, callback) {
    if (this.isStoryActive) {
      console.warn("Attempting to start a story while one is already active!");
      return; // Don't start a new story
    }
    this.isGameActive = false; // ⛔ Stop gameplay-related logic
    this.directionInput.stop(); // 🔴 Stop direction input during story
    this.bindActionInput(false); // 🔴 Disable action input during story
    this.bindHeroPositionCheck(false); // 🔴 Disable position check during story

    this.storyText = storyArray;
    this.storyIndex = 0;
    this.isStoryActive = true;
    this.gameLoopActive = false; // Pause game loop
    cancelAnimationFrame(this.animationFrameId); // 🔴 PREVENT RESTARTING LEVEL
    this.storyCallback = callback; // Save callback

    this.drawStoryText();
    // 🔴 Pause music
    this.backgroundMusic.pause();
    this.storyTimer = setInterval(() => {
      this.storyIndex++;
      if (this.storyIndex >= this.storyText.length) {
        this.stopStorySequence();
      } else {
        this.drawStoryText();
      }
    }, 3000); // Adjust timing as needed
  }

  // Stop the story sequence
  stopStorySequence() {
    clearInterval(this.storyTimer);
    this.storyTimer = null;
    this.storyText = [];
    this.storyIndex = 0;
    this.isStoryActive = false;

    if (this.mapId === "lvl3") {
      console.log("Game Completed! Showing completion screen.");
      this.showGameOverScreen(); // Make sure this function exists in Overworld.js
      return;
    }

    this.isGameActive = true; // ✅ Resume gameplay logic
    this.gameLoopActive = true; // Resume game loop
    this.directionInput.init(); // 🔴 Resume direction input after story
    this.bindActionInput(true); // 🔴 Enable action input after story
    this.bindHeroPositionCheck(true); // 🔴 Enable position check after story

    this.startGameloop();

    if (this.storyCallback) {
      this.storyCallback(); // Execute the callback
      this.storyCallback = null;
    }

    // 🔴 Resume music
    this.backgroundMusic.play();
  }

  // Draw the story text on the canvas
  drawStoryText() {
    if (!this.isStoryActive) return;

    //clear off the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "white";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    // Define max width for text wrapping
    const maxWidth = this.canvas.width * 0.8; // 80% of canvas width
    const lineHeight = 24; // Space between lines
    const x = this.canvas.width / 2; // Center horizontally
    const y = this.canvas.height / 2; // Start at center

    // 🔴 Word-wrap the text to fit inside the canvas
    const wrappedText = this.wrapText(
      this.storyText[this.storyIndex],
      maxWidth
    );

    // Draw each line of wrapped text
    wrappedText.forEach((line, i) => {
      this.ctx.fillText(line, x, y + i * lineHeight);
    });
  }

  wrapText(text, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const testWidth = this.ctx.measureText(testLine).width;

      if (testWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  }

  //gameloop
  startGameloop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId); // Stop previous loop
    }

    this.gameLoopActive = true; // Mark loop as active

    const step = () => {
      if (!this.gameLoopActive) return; // Prevent duplicate loops
      if (this.isStoryActive) return;
      //clear off the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#7C0000"; // Set background color to red
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // Fill the canvas

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
          return;
        }

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
          //ADD THIS
          const heroGridX = hero.x;
          const heroGridY = hero.y;
          const portalGridX = portal.x;
          const portalGridY = portal.y;
          if (heroGridX === portalGridX && heroGridY === portalGridY) {
            if (this.mapId === "lvl3" && this.map.levelComplete) {
              // ✅ CHECK IF LEVEL IS COMPLETE
              console.log(
                "🎉 Hero completed Level 3! Running completion sequence..."
              );

              // 🔴 Stop game loop immediately
              this.gameLoopActive = false;
              cancelAnimationFrame(this.animationFrameId);

              // 🔴 Clear the canvas to prevent flickering
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

              // 🔴 Add a short delay (optional) for a smooth effect
              setTimeout(() => {
                this.startStorySequence(completionStory, null);
              }, 100); // Small delay to smooth transition
              return;
            }
            if (this.mapId === "lvl1") {
              console.log(
                "Hero touching portal in lvl1. Transitioning to lvl2."
              );
              this.transitionTo("lvl2");
              return;
            }
            if (this.mapId === "lvl2") {
              console.log(
                "Hero touching portal in lvl2. Transitioning to lvl3."
              );
              this.transitionTo("lvl3");
              return;
            }
          } else {
            console.log("Hero is NOT touching the portal.");
          }
        } else {
          console.log(
            "PersonWalkingComplete event received, but not for hero."
          );
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

  stopGameLoop() {
    this.gameLoopActive = false; // Set the flag to stop the game loop
    cancelAnimationFrame(this.animationFrameId); // Cancel the animation frame
  }

  startNextLevelCutscene() {
    this.map.startCutscene([
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
    ]);
  }

  showGameOverScreen() {
    const gameOverScreen = document.querySelector(".game-over-screen");
    gameOverScreen.classList.add("active");
    this.isGameActive = false; // ⛔ Completely stop gameplay
    this.backgroundMusic.pause(); // 🔴 pause the music
    this.backgroundMusic.currentTime = 0; // set play time to beginning
  }

  init() {
    this.mapId = "lvl1";
    this.map = new OverworldMap(window.OverworldMaps[this.mapId]);
    this.map.mountObjects();

    this.directionInput = new DirectionInput();
    //   this.directionInput.init();
    this.directionInput.stop(); //🛑🛑🛑🛑🛑STOP THE RANDMOZATION
    this.bindActionInput();
    this.bindHeroPositionCheck();

    // Start enemy spawning for the initial level
    this.map.startEnemySpawning("lvl1");

    this.startGameloop();
    const callback = () => {
      this.startNextLevelCutscene();
    };
    this.startStorySequence(startStory, callback);

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
    // 🔴 Start playing the background music
    this.backgroundMusic.play();
  }
}
