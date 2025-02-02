class Sprite {
  constructor(config) {
    //set up image
    this.image = new Image();
    this.image.src = config.src;
    this.image.onload = () => {
      this.isloaded = true;
    };

    //shadow
    this.shadow = new Image();
    this.useShadow = true; //config.useShadow || false
    if (this.useShadow) {
      this.shadow.src = "/images/shadow.png";
    }
    this.shadow.onload = () => {
      this.isShadowloaded = true;
    };

    //configuring Animations and Initial states
    this.animations = config.animations || {
      "idle-down": [[0, 0]],
      "idle-left": [[0, 1]],
      "idle-right": [[0, 2]],
      "idle-up": [[0, 3]],
      "walk-down": [
        [1, 0],
        [0, 0],
        [3, 0],
        [0, 0],
      ],
      "walk-left": [
        [1, 1],
        [0, 1],
        [3, 1],
        [0, 1],
      ],
      "walk-right": [
        [1, 2],
        [0, 2],
        [3, 2],
        [0, 2],
      ],
      "walk-up": [
        [1, 3],
        [0, 3],
        [3, 3],
        [0, 3],
      ],
    };
    this.currentAnimation = "walk-left"; //config.currentAnimation || "idle-down";
    this.currentAnimationFrame = 0;

    this.animationFrameLimit = config.animationFrameLimit || 20; //how many game loop frames we wanna show the sprite sheet
    this.animationFrameProgress = this.animationFrameLimit;

    //reference the game object
    this.gameObject = config.gameObject;
  }

  get frame() {
    return this.animations[this.currentAnimation][this.currentAnimationFrame];
  }

  setAnimation(key) {
    if (this.currentAnimation !== key) {
      this.currentAnimation = key;
      this.currentAnimationFrame = 0;
      this.animationFrameProgress = this.animationFrameLimit;
    }
  }

  updateAnimationProgress() {
    //downtick frame progress
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }

    //reset the counter
    this.animationFrameProgress = this.animationFrameLimit;
    this.currentAnimationFrame += 1;
    if (this.frame === undefined) {
      this.currentAnimationFrame = 0;
    }
  }

  draw(ctx, cameraPerson) {
    const x = this.gameObject.x + utils.withGrid(10.5) - cameraPerson.x;
    const y = this.gameObject.y + utils.withGrid(6) - cameraPerson.y;

    this.isShadowloaded &&
      ctx.drawImage(this.shadow, 0, 0, 32, 32, x, y, 32, 32);

    const [frameX, frameY] = this.frame;

    this.isloaded &&
      ctx.drawImage(this.image, frameX * 32, frameY * 48, 32, 48, x, y, 32, 32); //cutting the sprite and drawing on the map
    this.updateAnimationProgress();
  }
}
