class GameObject {
  constructor(config) {
    this.id = null;
    this.isMounted = false;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || "down";
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "/images/char.jpg",
    });

    this.behaviourLoop = config.behaviourLoop || {};
    this.behaviourLoopIndex = 0;
  }

  mount(map) {
    console.log("Mounting");

    this.isMounted = true;
    map.addWall(this.x, this.y);

    //If we have a behaviour, kick off after a short delay
    setTimeout(() => {
      this.doBehaviourEvent(map);
    }, 10);
  }

  update() {}

  async doBehaviourEvent(map) {
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
    }

    //do it again
    this.doBehaviourEvent(map);
  }
}
