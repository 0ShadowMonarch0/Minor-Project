const EnemyTypes = {
  lvl1: {
    type: "basic",
    src: "/images/enemy2.png",
    speed: 0.65,
    maxHealth: 150,
    frameSize: { x: 32, y: 32 }, //Individual Frame size
    spriteSheetSize: { x: 128, y: 192 }, //Total Sprite sheet size
  },
  lvl2: {
    type: "advanced",
    src: "/images/enemy3.png",
    speed: 0.4,
    maxHealth: 200,
    frameSize: { x: 32, y: 32 }, //Individual Frame size
    spriteSheetSize: { x: 128, y: 192 }, //Total Sprite sheet size
  },
  lvl3: {
    type: "boss",
    src: "/images/bigboi.png",
    speed: 0.2,
    maxHealth: 400,
    frameSize: { x: 64, y: 64 }, //Individual Frame size
    spriteSheetSize: { x: 256, y: 256 }, //Total Sprite sheet size
  },
};
