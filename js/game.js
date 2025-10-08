function Game(ctx) {
  this.level = 0;
  this.timeLeft = 100;
  this.planets = [];
  this.goal = {};
  this.firstClick = true;
  this.ctx = ctx;
  this.isTrained = false;
}

Game.prototype.firstFrameDraw = function () {
  const centerX = this.ctx.canvas.width / 2;
  const centerY = this.ctx.canvas.height / 2;

  this.ctx.save();
  this.ctx.beginPath();
  this.ctx.fillStyle = "#fff";
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";

  this.ctx.font = "80px invasion";
  this.ctx.fillText("IRONSPACE", centerX, centerY - 60);

  this.ctx.font = "50px invasion";
  this.ctx.fillText("PRESS ENTER TO START", centerX, centerY + 10);

  this.ctx.font = "30px invasion";
  this.ctx.fillText("W: THRUST  |  A/D: TURN", centerX, centerY + 70);

  this.ctx.closePath();
  this.ctx.restore();
};

Game.prototype.drawGameOver = function () {
  this.ctx.save();
  this.ctx.beginPath();
  this.ctx.fillStyle = "#fff";
  this.ctx.font = "80px invasion";
  this.ctx.fillText(
    "GAME OVER",
    this.ctx.canvas.width / 3 - 50,
    this.ctx.canvas.height / 2
  );
  this.ctx.font = "50px invasion";
  this.ctx.closePath();
  this.ctx.restore();
};

Game.prototype.levelText = function () {
  if (this.level < 6) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "50px invasion";
    this.ctx.fillText(`LEVEL ${this.level}`, 50, 50);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "50px invasion";
    this.ctx.fillText(`Time left ${this.timeLeft}`, this.ctx.canvas.width - 550, 50);
    this.ctx.closePath();
    this.ctx.restore();
  }
};

Game.prototype.winFrame = function () {
  this.ctx.save();
  this.ctx.beginPath();
  this.ctx.fillStyle = "#fff";
  this.ctx.font = "80px invasion";
  this.ctx.fillText(
    "YOU WIN!",
    this.ctx.canvas.width / 3,
    this.ctx.canvas.height / 2
  );
  this.ctx.closePath();
  this.ctx.restore();
};

Game.prototype.start = function (engine) {
  this.level++;
  this.firstClick = false;
  this.setLevel(this.ctx);
  return setInterval(engine, 1000 / 30);
};

Game.prototype.setLevel = function () {
  const levels = [
    { goal: { posX: 300, posY: 300 }, planets: [] },
    level1,
    level2,
    level3,
    level4(this.ctx),
  ];

  if (this.level > 4) {
    this.winFrame();
    return false;
  }

  this.planets = levels[this.level].planets;

  this.goal = levels[this.level].goal;

  return true;
};
