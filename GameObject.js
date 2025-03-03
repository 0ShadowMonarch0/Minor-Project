class GameObject {
  constructor(config) {
    this.id = null;
    this.isMounted = false;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || "down";
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "/images/character.png",
    });

    this.behaviourLoop = config.behaviourLoop || {};
    this.behaviourLoopIndex = 0;
    this.isDestroyed = false; // New flag to track removal
  }

  mount(map) {
    console.log("Mounting");

    this.isMounted = true;
    map.addWall(this.x, this.y);

    //If we have a behaviour, kick off after a short delay
    setTimeout(() => {
      this.doBehaviourEvent(map);
    }, 100);
  }

  update() {}

  async doBehaviourEvent(map) {
    if (this.isDestroyed) {
      console.log(
        `GameObject ${this.id} is destroyed. Stopping behavior loop.`
      );
      return;
    }

    //Don't do anything if there is a more inportant cutscene or I don't have config to do anything anyway
    if (map.isCutscenePlaying || this.behaviourLoop.length === 0) {
      return;
    }

    //Setting up our event with relevent info
    let eventConfig = this.behaviourLoop[this.behaviourLoopIndex];
    eventConfig.who = this.id;

    //Create an event instance of our next event config
    const eventHandler = new OverworldEvent({ map, event: eventConfig });
    await eventHandler.init();

    //Setting the next event to fire
    this.behaviourLoopIndex += 1;
    if (this.behaviourLoopIndex === this.behaviourLoop.length) {
      this.behaviourLoopIndex = 0;
      setTimeout(() => {
        this.doBehaviourEvent(map);
      }, 1000); // Adjust delay as needed
    }
    //do it again
    // this.doBehaviourEvent(map);
  }
  destroy() {
    this.isDestroyed = true;
  }
}
