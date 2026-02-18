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
const BASE_GRAVITY_INFLUENCE_RADIUS = 350;

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
  // Expand the planet's gravity reach using the same factor so denser
  // planets pull from farther away.
  this.gravityInfluenceRadius = Math.max(
    BASE_GRAVITY_INFLUENCE_RADIUS * massFactor,
    this.radius
  );
  this.colorProfile = generatePlanetColorProfile(this.density);
  //this.audio = new Audio("audio/metallic_space_impact.mp3");
}

function generatePlanetColorProfile(density) {
  const densityRatio = density / BASE_PLANET_DENSITY;
  const clampedRatio = Math.max(Math.min(densityRatio, 2.5), 0.2);

  const hue = 210 - (clampedRatio - 0.2) * 70;
  const saturation = 55 + clampedRatio * 10;
  const lightness = 55 - clampedRatio * 5;

  return {
    hue,
    saturation,
    lightness,
    highlight: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 12, 80)}%)`,
    mid: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    shadow: `hsl(${hue}, ${Math.min(saturation + 10, 100)}%, ${Math.max(
      lightness - 15,
      10
    )}%)`,
  };
}

Planet.prototype.draw = function (ctx) {
  const { posX, posY, radius } = this;
  const cp = this.colorProfile;
  const { hue, saturation, lightness } = cp;
  const densityRatio = this.density / BASE_PLANET_DENSITY;

  // 1. Gravity influence ring
  ctx.save();
  ctx.beginPath();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = cp.mid;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 10]);
  ctx.arc(posX, posY, this.gravityInfluenceRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.closePath();
  ctx.restore();

  // 2. Planetary ring for large planets (drawn behind the body)
  if (radius > 55) {
    drawPlanetRing(ctx, posX, posY, radius, hue, saturation, lightness);
  }

  // 3. Atmosphere glow
  ctx.save();
  const glowGrad = ctx.createRadialGradient(
    posX, posY, radius * 0.9,
    posX, posY, radius * 1.55
  );
  glowGrad.addColorStop(0, `hsla(${hue}, ${saturation}%, ${Math.min(lightness + 15, 85)}%, 0.3)`);
  glowGrad.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 1.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Main planet body
  ctx.save();
  ctx.beginPath();
  const bodyGrad = ctx.createRadialGradient(
    posX - radius * 0.35, posY - radius * 0.38, radius * 0.05,
    posX + radius * 0.1,  posY + radius * 0.1,  radius * 1.05
  );
  bodyGrad.addColorStop(0,    `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 22, 88)}%)`);
  bodyGrad.addColorStop(0.35, cp.highlight);
  bodyGrad.addColorStop(0.65, cp.mid);
  bodyGrad.addColorStop(0.88, cp.shadow);
  bodyGrad.addColorStop(1,    `hsl(${hue}, ${Math.min(saturation + 15, 100)}%, ${Math.max(lightness - 28, 5)}%)`);
  ctx.fillStyle = bodyGrad;
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Surface details (density-based)
  if (densityRatio < 0.85) {
    // Light/gas giant: soft horizontal bands
    drawPlanetGasBands(ctx, posX, posY, radius, hue, saturation, lightness);
  } else if (densityRatio >= 1.5) {
    // Dense/heavy planet: crater marks
    drawPlanetCraters(ctx, posX, posY, radius, hue, saturation, lightness);
  } else {
    // Rocky/terrestrial: subtle surface patches
    drawPlanetRockyPatches(ctx, posX, posY, radius, hue, saturation, lightness);
  }

  // 6. Specular highlight (glint from upper-left light source)
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.clip();
  const specGrad = ctx.createRadialGradient(
    posX - radius * 0.42, posY - radius * 0.42, 0,
    posX - radius * 0.42, posY - radius * 0.42, radius * 0.52
  );
  specGrad.addColorStop(0,   "rgba(255, 255, 255, 0.42)");
  specGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  specGrad.addColorStop(1,   "rgba(255, 255, 255, 0)");
  ctx.fillStyle = specGrad;
  ctx.fillRect(posX - radius, posY - radius, radius * 2, radius * 2);
  ctx.restore();

  // 7. Edge stroke
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${Math.max(lightness - 20, 8)}%, 0.75)`;
  ctx.lineWidth = Math.max(radius * 0.04, 1);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};

function drawPlanetRing(ctx, posX, posY, radius, hue, saturation, lightness) {
  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(1, 0.28);

  const ringInner = radius * 1.22;
  const ringOuter = radius * 1.82;
  const ringGrad = ctx.createRadialGradient(0, 0, ringInner, 0, 0, ringOuter);
  ringGrad.addColorStop(0,   `hsla(${hue}, ${saturation}%, ${lightness + 5}%, 0)`);
  ringGrad.addColorStop(0.2, `hsla(${hue - 10}, ${saturation}%, ${lightness + 14}%, 0.55)`);
  ringGrad.addColorStop(0.55,`hsla(${hue}, ${saturation}%, ${lightness + 6}%, 0.38)`);
  ringGrad.addColorStop(0.8, `hsla(${hue + 5}, ${Math.max(saturation - 10, 0)}%, ${lightness + 2}%, 0.2)`);
  ringGrad.addColorStop(1,   `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

  ctx.beginPath();
  ctx.arc(0, 0, ringOuter, 0, Math.PI * 2);
  ctx.fillStyle = ringGrad;
  ctx.fill();

  ctx.restore();
}

function drawPlanetGasBands(ctx, posX, posY, radius, hue, saturation, lightness) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();

  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.5) / bands;
    const y = posY - radius + t * radius * 2 - (radius * 0.2 / bands);
    const bandH = radius * 0.28;
    const hShift = i % 2 === 0 ? 14 : -10;
    const lShift = i % 2 === 0 ? 9 : -4;
    const alpha = 0.06 + Math.sin(t * Math.PI) * 0.07;
    ctx.fillStyle = `hsla(${hue + hShift}, ${saturation}%, ${lightness + lShift}%, ${alpha})`;
    ctx.fillRect(posX - radius, y, radius * 2, bandH);
  }
  ctx.restore();
}

function drawPlanetCraters(ctx, posX, posY, radius, hue, saturation, lightness) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.93, 0, Math.PI * 2);
  ctx.clip();

  const craters = [
    { dx:  0.28, dy: -0.22, r: 0.14 },
    { dx: -0.32, dy:  0.18, r: 0.11 },
    { dx:  0.08, dy:  0.38, r: 0.09 },
    { dx: -0.18, dy: -0.36, r: 0.07 },
    { dx:  0.42, dy:  0.28, r: 0.08 },
  ];

  for (const c of craters) {
    const cx = posX + c.dx * radius;
    const cy = posY + c.dy * radius;
    const cr = c.r * radius;

    // Crater bowl (darker fill)
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${Math.max(lightness - 22, 5)}%, 0.45)`;
    ctx.fill();

    // Rim highlight (upper-left arc — lit by upper-left light source)
    ctx.beginPath();
    ctx.arc(cx - cr * 0.1, cy - cr * 0.1, cr * 0.85, Math.PI, Math.PI * 1.5);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${Math.min(lightness + 20, 88)}%, 0.32)`;
    ctx.lineWidth = Math.max(cr * 0.22, 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanetRockyPatches(ctx, posX, posY, radius, hue, saturation, lightness) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.9, 0, Math.PI * 2);
  ctx.clip();

  const patches = [
    { dx:  0.22, dy: -0.28, r: 0.16 },
    { dx: -0.28, dy:  0.15, r: 0.13 },
    { dx:  0.05, dy:  0.32, r: 0.11 },
    { dx: -0.40, dy: -0.20, r: 0.10 },
  ];

  for (const p of patches) {
    const px = posX + p.dx * radius;
    const py = posY + p.dy * radius;
    const pr = p.r * radius;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + 8}, ${Math.max(saturation - 8, 0)}%, ${lightness + 7}%, 0.18)`;
    ctx.fill();
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
