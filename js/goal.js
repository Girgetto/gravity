/**
 * @param  {number} posX - position x of goal
 * @param  {number} posY - position y of goal
 */
function Goal({ posX, posY }) {
  this.posX = posX;
  this.posY = posY;
  this.width = 100;
  this.height = 100;
  this.collision = false;
  this.img = new Image();
  this.img.src = "./img/target.png";
  this.frame = 0;

  // Celebration state
  this.particles = [];
  this.celebrating = false;
  this.celebrationFrame = 0;
  this.celebrationDuration = 55;
}

Goal.prototype.draw = function (ctx) {
  this.frame++;

  const cx = this.posX + this.width / 2;
  const cy = this.posY + this.height / 2;

  // Pulsing attraction rings
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 3; i++) {
    const phase = ((this.frame * 0.04) + i / 3) % 1;
    const radius = 55 + phase * 65;
    const alpha = (1 - phase) * 0.38;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 255, 140, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Background glow behind goal
  const glow = 0.18 + 0.14 * Math.sin(this.frame * 0.08);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 75);
  grad.addColorStop(0, `rgba(0, 255, 100, ${glow})`);
  grad.addColorStop(1, "rgba(0, 255, 100, 0)");
  ctx.beginPath();
  ctx.fillStyle = grad;
  ctx.arc(cx, cy, 75, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Target sprite and label
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.font = "20px invasion";
  ctx.fillText("TARGET", this.posX - 15, this.posY - 10);
  ctx.drawImage(this.img, this.posX, this.posY, this.width, this.height);
  ctx.closePath();
  ctx.restore();

  // Celebration burst
  if (this.celebrating) {
    this.drawCelebration(ctx);
  }
};

Goal.prototype.triggerCelebration = function () {
  if (this.celebrating) return;
  this.celebrating = true;
  this.celebrationFrame = 0;
  this.particles = [];

  const cx = this.posX + this.width / 2;
  const cy = this.posY + this.height / 2;
  const colors = ["#00ff88", "#ffff44", "#00ccff", "#ff88ff", "#ffffff", "#ff7722"];

  for (let i = 0; i < 75; i++) {
    const angle = (Math.PI * 2 * i) / 75 + Math.random() * 0.25;
    const speed = 1.8 + Math.random() * 6.5;
    this.particles.push({
      x: cx + (Math.random() - 0.5) * 20,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
};

Goal.prototype.drawCelebration = function (ctx) {
  this.celebrationFrame++;
  const progress = this.celebrationFrame / this.celebrationDuration;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  this.particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vx *= 0.985;

    const alpha = Math.max(0, 1 - progress * 1.15);
    if (alpha <= 0) return;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x, p.y, Math.max(p.r * (1 - progress * 0.5), 0.5), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.restore();

  if (this.celebrationFrame >= this.celebrationDuration) {
    this.celebrating = false;
    this.particles = [];
  }
};

Goal.prototype.update = function (ship) {
  const checkCollisionWithShip = () =>
    this.posX <= ship.posX &&
    ship.posX <= this.posX + this.width &&
    this.posY <= ship.posY &&
    ship.posY <= this.posY + this.height;

  this.collision = checkCollisionWithShip();

  return this.collision;
};
