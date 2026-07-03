/**
 * @param  {number} posX - of planet
 * @param  {number} posY - of planet
 * @param  {number} radius - of planet
 * @param  {number} density - of planet
 */
const BASE_PLANET_RADIUS = 50;
const BASE_PLANET_DENSITY = Math.pow(10, 6);
const BASE_PLANET_MASS =
  Math.PI * Math.pow(BASE_PLANET_RADIUS, 2) * BASE_PLANET_DENSITY;
const BASE_GRAVITY_INFLUENCE_RADIUS = 420;

function Planet({ posX, posY, radius, density }) {
  this.posX = posX;
  this.posY = posY;
  this.originalRadius = radius;
  this.radius = radius;
  this.area = Math.PI * Math.pow(this.originalRadius, 2);
  this.density = density;
  this.mass = this.area * this.density;

  const massRatio = BASE_PLANET_MASS
    ? this.mass / BASE_PLANET_MASS
    : 1;
  const massFactor = Math.sqrt(Math.max(massRatio, 0));

  this.radius = Math.max(this.originalRadius * massFactor, 5);
  this.gravityInfluenceRadius = Math.max(
    BASE_GRAVITY_INFLUENCE_RADIUS * massFactor,
    this.radius
  );
  this.colorProfile = generatePlanetColorProfile(this.density);
  this.frame = Math.floor(Math.random() * 200);
  // How hard this planet is currently pulling the ship (0..1), set each tick
  // by the ship's gravity pass and used to make the well visibly react.
  this.pullStrength = 0;
}

function generatePlanetColorProfile(density) {
  const densityRatio = density / BASE_PLANET_DENSITY;
  const clampedRatio = Math.max(Math.min(densityRatio, 2.5), 0.2);

  // Map density to arcade hue: low = cyan/blue, mid = magenta/pink, high = orange/red
  const hue = 200 - (clampedRatio - 0.2) * 95;
  const sat = 95;

  return {
    hue,
    sat,
    densityRatio,
    body:    `hsl(${hue}, ${sat}%, 50%)`,
    light:   `hsl(${hue}, ${sat}%, 78%)`,
    dark:    `hsl(${hue}, ${sat}%, 22%)`,
    outline: `hsl(${hue}, ${sat}%, 8%)`,
    glow:    `hsl(${hue}, 100%, 62%)`,
    halo:    (a) => `hsla(${hue}, 100%, 62%, ${a})`,
  };
}

Planet.prototype.draw = function (ctx) {
  this.frame++;

  const { posX, posY, radius } = this;
  const cp = this.colorProfile;
  const densityRatio = cp.densityRatio;

  const pull = Math.max(Math.min(this.pullStrength || 0, 1), 0);

  // 1. Gravity influence ring — animated dashed neon that wakes up and spins
  // faster while the planet is actively pulling the ship.
  ctx.save();
  ctx.beginPath();
  ctx.globalAlpha = 0.35 + pull * 0.45;
  ctx.strokeStyle = cp.glow;
  ctx.shadowColor = cp.glow;
  ctx.shadowBlur = 6 + pull * 10;
  ctx.lineWidth = 1.5 + pull * 1.5;
  ctx.setLineDash([6, 9]);
  ctx.lineDashOffset = -(this.frame * (0.5 + pull * 3)) % 15;
  ctx.arc(posX, posY, this.gravityInfluenceRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 1b. Gravity well shading — the whole field glows while it grips the ship
  if (pull > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const wellGrad = ctx.createRadialGradient(
      posX, posY, radius,
      posX, posY, this.gravityInfluenceRadius
    );
    wellGrad.addColorStop(0, cp.halo(0.16 * pull + 0.04));
    wellGrad.addColorStop(0.5, cp.halo(0.07 * pull));
    wellGrad.addColorStop(1, cp.halo(0));
    ctx.fillStyle = wellGrad;
    ctx.beginPath();
    ctx.arc(posX, posY, this.gravityInfluenceRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ease the reaction back down between physics ticks / after the ship leaves
  this.pullStrength *= 0.9;

  // 2. Outer pulsing halo
  const pulse = 1 + Math.sin(this.frame * 0.05) * 0.1;
  const haloRadius = radius * 1.85 * pulse;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const haloGrad = ctx.createRadialGradient(posX, posY, radius * 0.95, posX, posY, haloRadius);
  haloGrad.addColorStop(0,    cp.halo(0.55));
  haloGrad.addColorStop(0.45, cp.halo(0.18));
  haloGrad.addColorStop(1,    cp.halo(0));
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(posX, posY, haloRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Planetary ring (behind body) for large planets
  if (radius > 55) {
    drawArcadePlanetRing(ctx, posX, posY, radius, cp);
  }

  // 4. Main body — flat saturated color with neon shadow glow
  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = cp.glow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = cp.body;
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Shadow crescent (clipped offset disk)
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = cp.dark;
  ctx.arc(posX + radius * 0.45, posY + radius * 0.45, radius * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. Surface details (chunky, density-based)
  if (densityRatio < 0.85) {
    drawArcadeBands(ctx, posX, posY, radius, cp);
  } else if (densityRatio >= 1.5) {
    drawArcadeCraters(ctx, posX, posY, radius, cp);
  } else {
    drawArcadePixels(ctx, posX, posY, radius, cp);
  }

  // 7. Specular highlight dot
  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  const specR = Math.max(radius * 0.09, 2);
  ctx.arc(posX - radius * 0.45, posY - radius * 0.45, specR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 8. Thick outline
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = cp.outline;
  ctx.lineWidth = Math.max(radius * 0.07, 2);
  ctx.stroke();
  ctx.restore();

  // 9. Inner rim accent (neon edge highlight on lit side)
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.97, Math.PI * 1.1, Math.PI * 1.85);
  ctx.strokeStyle = cp.light;
  ctx.lineWidth = Math.max(radius * 0.04, 1.5);
  ctx.shadowColor = cp.glow;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
};

function drawArcadePlanetRing(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(1, 0.28);

  ctx.shadowColor = cp.glow;
  ctx.shadowBlur = 14;

  // Inner thick ring
  ctx.beginPath();
  ctx.strokeStyle = cp.body;
  ctx.lineWidth = radius * 0.22;
  ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // Outer thin ring
  ctx.beginPath();
  ctx.strokeStyle = cp.light;
  ctx.lineWidth = radius * 0.06;
  ctx.arc(0, 0, radius * 1.85, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring outline
  ctx.beginPath();
  ctx.strokeStyle = cp.outline;
  ctx.lineWidth = Math.max(radius * 0.025, 1);
  ctx.shadowBlur = 0;
  ctx.arc(0, 0, radius * 1.5 - radius * 0.11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.5 + radius * 0.11, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawArcadeBands(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();

  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.5) / bands;
    const y = posY - radius + t * radius * 2;
    const bandH = (radius * 2) / bands * 0.55;
    if (i % 2 === 0) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = cp.light;
    } else {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = cp.dark;
    }
    ctx.fillRect(posX - radius, y - bandH / 2, radius * 2, bandH);
  }
  ctx.restore();
}

function drawArcadeCraters(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.94, 0, Math.PI * 2);
  ctx.clip();

  const craters = [
    { dx:  0.28, dy: -0.22, r: 0.16 },
    { dx: -0.32, dy:  0.18, r: 0.13 },
    { dx:  0.08, dy:  0.38, r: 0.10 },
    { dx: -0.18, dy: -0.36, r: 0.09 },
    { dx:  0.42, dy:  0.12, r: 0.08 },
  ];

  for (const c of craters) {
    const cx = posX + c.dx * radius;
    const cy = posY + c.dy * radius;
    const cr = c.r * radius;

    // Crater bowl
    ctx.beginPath();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = cp.dark;
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Bright rim arc on the lit side
    ctx.beginPath();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = cp.light;
    ctx.lineWidth = Math.max(cr * 0.25, 1);
    ctx.arc(cx, cy, cr * 0.92, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArcadePixels(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.92, 0, Math.PI * 2);
  ctx.clip();

  const pixels = [
    { dx:  0.22, dy: -0.28, s: 0.18 },
    { dx: -0.30, dy:  0.18, s: 0.16 },
    { dx:  0.08, dy:  0.34, s: 0.14 },
    { dx: -0.42, dy: -0.18, s: 0.12 },
    { dx:  0.36, dy:  0.10, s: 0.13 },
  ];

  for (const p of pixels) {
    const px = posX + p.dx * radius;
    const py = posY + p.dy * radius;
    const size = p.s * radius;

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = cp.light;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);

    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = cp.outline;
    ctx.lineWidth = Math.max(size * 0.12, 1);
    ctx.strokeRect(px - size / 2, py - size / 2, size, size);
  }
  ctx.restore();
}

Planet.prototype.collision = function (ship) {
  const diffX = ship.posX - this.posX;
  const diffY = ship.posY - this.posY;
  const distance = Math.sqrt(diffX * diffX + diffY * diffY);

  if (distance <= this.radius) {
    ship.triggerExplosion(ship.posX, ship.posY);
  }
};
