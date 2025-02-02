class OverworldMap {
  constructor(config) {
    this.gameObjects = config.gameObjects;
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowersrc;

    this.upperImage = new Image();
    this.upperImage.src = config.uppersrc;

    this.isCutscenePlaying = true;
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
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach((key) => {
      let object = this.gameObjects[key];
      object.id = key;
      //TODO : IF this object should actually mount

      object.mount(this);
    });
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
    this.removeWall(wasX, wasY);
    const { x, y } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }
}

window.OverworldMaps = {
  lvl1: {
    lowersrc: "/images/final_level1.png",
    uppersrc: "/images/layer_1.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
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
        if (x>=32){
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
    lowersrc: "/images/map4.jpg",
    uppersrc: "/images/map3.jpg",
    gameObjects: {
      hero: new GameObject({
        x: 9,
        y: 5,
      }),
      npc1: new GameObject({
        x: 6,
        y: 4,
        src: "/images/prince.png",
      }),
    },
  },
};
