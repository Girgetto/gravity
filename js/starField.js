function StarField(ctx, canvas, options = {}) {
  this.ctx = ctx;
  this.canvas = canvas;
  this.starCount = options.starCount || 200;
  this.minRadius = options.minRadius || 0.5;
  this.maxRadius = options.maxRadius || 2.2;
  this.minAlpha = options.minAlpha || 0.2;
  this.maxAlpha = options.maxAlpha || 0.9;
  this.stars = this.generateStars();
}

StarField.prototype.randomBetween = function (min, max) {
  return Math.random() * (max - min) + min;
};

StarField.prototype.generateStars = function () {
  const stars = [];

  for (let i = 0; i < this.starCount; i++) {
    stars.push({
      x: this.randomBetween(0, this.canvas.width),
      y: this.randomBetween(0, this.canvas.height),
      radius: this.randomBetween(this.minRadius, this.maxRadius),
      alpha: this.randomBetween(this.minAlpha, this.maxAlpha),
      twinkleSpeed: this.randomBetween(0.003, 0.01),
      alphaDirection: Math.random() > 0.5 ? 1 : -1,
    });
  }

  return stars;
};

StarField.prototype.twinkle = function (star) {
  star.alpha += star.twinkleSpeed * star.alphaDirection;

  if (star.alpha <= this.minAlpha) {
    star.alpha = this.minAlpha;
    star.alphaDirection = 1;
  }

  if (star.alpha >= this.maxAlpha) {
    star.alpha = this.maxAlpha;
    star.alphaDirection = -1;
  }
};

StarField.prototype.draw = function () {
  this.ctx.save();
  this.ctx.fillStyle = "#000";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.stars.forEach((star) => {
    this.ctx.beginPath();
    this.ctx.globalAlpha = star.alpha;
    this.ctx.fillStyle = "#fff";
    this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.closePath();
    this.twinkle(star);
  });

  this.ctx.restore();
};
