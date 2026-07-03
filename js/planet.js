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

// Shared line-work colors sampled from the spaceship sprite, so every planet
// looks like it was inked by the same hand that drew the ship.
const PLANET_INK = "hsl(216, 42%, 12%)";
const PLANET_CREAM = "hsl(46, 42%, 89%)";

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

  // Density picks the hull tint: light worlds read as steel blue, mid worlds
  // as slate gray-teal, dense worlds as rust-bronze — all desaturated to sit
  // alongside the ship's navy/slate/cream military palette.
  let hue, sat, lit;
  if (clampedRatio < 0.85) {
    hue = 211; sat = 26; lit = 58;
  } else if (clampedRatio < 1.5) {
    hue = 194; sat = 18; lit = 54;
  } else {
    hue = 24; sat = 36; lit = 50;
  }

  return {
    hue,
    sat,
    densityRatio,
    ink: PLANET_INK,
    cream: PLANET_CREAM,
    body:    `hsl(${hue}, ${sat}%, ${lit}%)`,
    light:   `hsl(${hue}, ${Math.max(sat - 8, 10)}%, ${lit + 16}%)`,
    dark:    `hsl(${hue}, ${sat + 8}%, ${lit - 20}%)`,
    deep:    `hsl(${hue}, ${sat + 10}%, ${Math.max(lit - 32, 8)}%)`,
    metal:   `hsl(${hue}, ${Math.round(sat * 0.55)}%, 42%)`,
    outline: PLANET_INK,
    glow:    `hsl(${hue}, 55%, 68%)`,
    halo:    (a) => `hsla(${hue}, 45%, 72%, ${a})`,
    shade:   (a) => `hsla(${hue}, ${sat + 10}%, ${Math.max(lit - 32, 8)}%, ${a})`,
    gleam:   (a) => `hsla(46, 42%, 89%, ${a})`,
  };
}

Planet.prototype.draw = function (ctx) {
  this.frame++;

  const { posX, posY, radius } = this;
  const cp = this.colorProfile;
  const densityRatio = cp.densityRatio;

  const pull = Math.max(Math.min(this.pullStrength || 0, 1), 0);

  // 1. Gravity influence ring — animated dashed line that wakes up and spins
  // faster while the planet is actively pulling the ship.
  ctx.save();
  ctx.beginPath();
  ctx.globalAlpha = 0.3 + pull * 0.45;
  ctx.strokeStyle = cp.glow;
  ctx.shadowColor = cp.glow;
  ctx.shadowBlur = 4 + pull * 8;
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
    wellGrad.addColorStop(0, cp.halo(0.14 * pull + 0.03));
    wellGrad.addColorStop(0.5, cp.halo(0.06 * pull));
    wellGrad.addColorStop(1, cp.halo(0));
    ctx.fillStyle = wellGrad;
    ctx.beginPath();
    ctx.arc(posX, posY, this.gravityInfluenceRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ease the reaction back down between physics ticks / after the ship leaves
  this.pullStrength *= 0.9;

  // 2. Thin atmospheric haze hugging the disk — subtle, so the flat inked
  // body still pops against the star field the way the ship sprite does.
  const pulse = 1 + Math.sin(this.frame * 0.05) * 0.04;
  const hazeRadius = radius * 1.3 * pulse;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const hazeGrad = ctx.createRadialGradient(posX, posY, radius * 0.96, posX, posY, hazeRadius);
  hazeGrad.addColorStop(0, cp.halo(0.3));
  hazeGrad.addColorStop(0.5, cp.halo(0.1));
  hazeGrad.addColorStop(1, cp.halo(0));
  ctx.fillStyle = hazeGrad;
  ctx.beginPath();
  ctx.arc(posX, posY, hazeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Planetary ring for large planets — far half passes behind the body
  const hasRing = radius > 55;
  if (hasRing) {
    drawInkedPlanetRing(ctx, posX, posY, radius, cp, "back");
  }

  // 4. Main body — spherical shading: a radial gradient offset toward the
  // light source models the ball, then cel crescents crisp it up on top.
  ctx.save();
  ctx.beginPath();
  const lightX = posX - radius * 0.38;
  const lightY = posY - radius * 0.38;
  const bodyGrad = ctx.createRadialGradient(
    lightX, lightY, radius * 0.1,
    lightX, lightY, radius * 1.6
  );
  bodyGrad.addColorStop(0, cp.light);
  bodyGrad.addColorStop(0.38, cp.body);
  bodyGrad.addColorStop(0.75, cp.dark);
  bodyGrad.addColorStop(1, cp.deep);
  ctx.fillStyle = bodyGrad;
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Cel shading — hard-edged lit crescent (upper-left) and a two-step
  // shadow crescent (lower-right) layered over the gradient, so the sphere
  // reads round but keeps the ship's inked-illustration edges.
  fillLune(ctx, posX, posY, radius, radius * 0.19, radius * 0.19, radius * 1.08, cp.light, 0.45);
  fillLune(ctx, posX, posY, radius, -radius * 0.2, -radius * 0.2, radius * 1.04, cp.dark, 0.4);
  fillLune(ctx, posX, posY, radius, -radius * 0.14, -radius * 0.14, radius * 1.1, cp.deep, 0.65);

  // 5b. Limb darkening — soft falloff around the whole edge so the disk
  // curves away from the viewer instead of ending flat at the outline.
  ctx.save();
  ctx.beginPath();
  const limbGrad = ctx.createRadialGradient(posX, posY, radius * 0.6, posX, posY, radius);
  limbGrad.addColorStop(0, cp.shade(0));
  limbGrad.addColorStop(0.75, cp.shade(0.1));
  limbGrad.addColorStop(1, cp.shade(0.5));
  ctx.fillStyle = limbGrad;
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5c. Soft cream bloom on the lit shoulder — a gentle gradient under the
  // crisp specular dots that pushes the near side of the sphere forward.
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.clip();
  const bloomX = posX - radius * 0.42;
  const bloomY = posY - radius * 0.42;
  const bloomGrad = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, radius * 0.65);
  bloomGrad.addColorStop(0, cp.gleam(0.32));
  bloomGrad.addColorStop(0.6, cp.gleam(0.1));
  bloomGrad.addColorStop(1, cp.gleam(0));
  ctx.fillStyle = bloomGrad;
  ctx.fillRect(posX - radius, posY - radius, radius * 2, radius * 2);
  ctx.restore();

  // 6. Ink hatching across the terminator — the technical-illustration
  // shading used all over the spaceship sprite. The hatch band reaches a bit
  // past the shadow edge into the midtone so the strokes stay readable.
  hatchLune(ctx, posX, posY, radius, -radius * 0.24, -radius * 0.24, radius * 0.96, cp);

  // 7. Surface details (inked, density-based)
  if (densityRatio < 0.85) {
    drawInkedBands(ctx, posX, posY, radius, cp);
  } else if (densityRatio >= 1.5) {
    drawInkedCraters(ctx, posX, posY, radius, cp);
  } else {
    drawInkedPlates(ctx, posX, posY, radius, cp);
  }

  // 8. Cream specular highlights — crisp dots, no bloom
  ctx.save();
  ctx.fillStyle = cp.cream;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  const specR = Math.max(radius * 0.07, 1.5);
  ctx.arc(posX - radius * 0.48, posY - radius * 0.42, specR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(posX - radius * 0.32, posY - radius * 0.56, specR * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 9. Cream rim light on the lit edge, mirroring the ship's pale paneling
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.92, Math.PI * 1.05, Math.PI * 1.55);
  ctx.strokeStyle = cp.cream;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = Math.max(radius * 0.045, 1.5);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // 10. Bold ink outline — the same heavy line weight as the ship sprite
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = cp.ink;
  ctx.lineWidth = Math.max(radius * 0.07, 2);
  ctx.stroke();
  ctx.restore();

  // 11. Ring near half passes in front of the body
  if (hasRing) {
    drawInkedPlanetRing(ctx, posX, posY, radius, cp, "front");
  }
};

// Fills the crescent of the planet disk left uncovered by an offset cutting
// disk — the flat, hard-edged shading shape used in inked illustration.
function fillLune(ctx, posX, posY, radius, cutOffX, cutOffY, cutRadius, style, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.arc(posX + cutOffX, posY + cutOffY, cutRadius, 0, Math.PI * 2);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = style;
  ctx.fill("evenodd");
  ctx.restore();
}

// Diagonal ink hatch strokes clipped to the same crescent used for the
// shadow, echoing the hand-hatched shading on the spaceship's hull.
function hatchLune(ctx, posX, posY, radius, cutOffX, cutOffY, cutRadius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.arc(posX + cutOffX, posY + cutOffY, cutRadius, 0, Math.PI * 2);
  ctx.clip("evenodd");
  // Keep the hatch strokes on the shadowed (lower-right) side only
  ctx.beginPath();
  ctx.arc(posX + radius * 0.9, posY + radius * 0.9, radius * 1.5, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = cp.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(radius * 0.025, 1);
  ctx.beginPath();
  const step = Math.max(radius * 0.14, 4);
  for (let i = -radius * 2; i <= radius * 2; i += step) {
    ctx.moveTo(posX + i, posY - radius * 1.5);
    ctx.lineTo(posX + i - radius * 3, posY + radius * 1.5);
  }
  ctx.stroke();
  ctx.restore();
}

function drawInkedPlanetRing(ctx, posX, posY, radius, cp, half) {
  // In the squashed ellipse space, the lower half (0..PI) is the near side.
  const isFront = half === "front";
  const start = isFront ? 0 : Math.PI;
  const end = isFront ? Math.PI : Math.PI * 2;
  const ringR = radius * 1.5;
  const ringW = radius * 0.2;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(1, 0.28);

  // Slate metal band — the far half sits in the planet's shade, so it is
  // drawn darker and duller than the near half to give the ring depth.
  ctx.beginPath();
  ctx.strokeStyle = isFront ? cp.metal : cp.dark;
  ctx.lineWidth = ringW;
  ctx.arc(0, 0, ringR, start, end);
  ctx.stroke();

  // Cream highlight stripe along the band, like the ship's pale paneling
  ctx.beginPath();
  ctx.strokeStyle = cp.cream;
  ctx.globalAlpha = isFront ? 0.6 : 0.25;
  ctx.lineWidth = ringW * 0.28;
  ctx.arc(0, 0, ringR + ringW * 0.18, start, end);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Ink edges on both sides of the band
  ctx.strokeStyle = cp.ink;
  ctx.lineWidth = Math.max(radius * 0.03, 1.2);
  ctx.beginPath();
  ctx.arc(0, 0, ringR - ringW / 2, start, end);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ringR + ringW / 2, start, end);
  ctx.stroke();

  // Thin outer companion ring
  ctx.beginPath();
  ctx.strokeStyle = cp.dark;
  ctx.lineWidth = Math.max(radius * 0.04, 1.5);
  ctx.arc(0, 0, ringR + ringW * 1.6, start, end);
  ctx.stroke();

  ctx.restore();
}

function drawInkedBands(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();

  // Latitude bands bow downward like curves on a tilted globe, so the
  // stripes wrap around the sphere instead of lying flat across the disk.
  const bands = 5;
  const bandFullH = (radius * 2) / bands;
  const bow = (t) => radius * (0.08 + t * 0.22);
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.5) / bands;
    const y = posY - radius + t * radius * 2;
    const bandH = bandFullH * 0.55;
    const yTop = y - bandH / 2;
    const yBot = y + bandH / 2;
    if (i % 2 === 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = cp.light;
    } else {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = cp.dark;
    }
    ctx.beginPath();
    ctx.moveTo(posX - radius, yTop);
    ctx.quadraticCurveTo(posX, yTop + bow(t), posX + radius, yTop);
    ctx.lineTo(posX + radius, yBot);
    ctx.quadraticCurveTo(posX, yBot + bow(t), posX - radius, yBot);
    ctx.closePath();
    ctx.fill();

    // Thin ink separator under each band — panel-line work like the ship's
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = cp.ink;
    ctx.lineWidth = Math.max(radius * 0.02, 1);
    ctx.beginPath();
    ctx.moveTo(posX - radius, yBot);
    ctx.quadraticCurveTo(posX, yBot + bow(t), posX + radius, yBot);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInkedCraters(ctx, posX, posY, radius, cp) {
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
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = cp.deep;
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Bowl relief: refill the floor offset toward the light, leaving a deep
    // inner-shadow crescent on the wall facing the light source.
    ctx.beginPath();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = cp.dark;
    ctx.arc(cx + cr * 0.22, cy + cr * 0.22, cr * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Full ink outline
    ctx.beginPath();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = cp.ink;
    ctx.lineWidth = Math.max(cr * 0.18, 1);
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    // Cream rim arc on the lit side
    ctx.beginPath();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = cp.cream;
    ctx.lineWidth = Math.max(cr * 0.22, 1);
    ctx.arc(cx, cy, cr * 0.78, Math.PI * 1.05, Math.PI * 1.75);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInkedPlates(ctx, posX, posY, radius, cp) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(posX, posY, radius * 0.94, 0, Math.PI * 2);
  ctx.clip();

  // Continent/panel plates: pale patches with ink outlines, plus panel-line
  // tick marks — the same detailing language as the ship's hull sections.
  const plates = [
    { dx:  0.2,  dy: -0.26, rx: 0.34, ry: 0.2,  rot:  0.5 },
    { dx: -0.32, dy:  0.16, rx: 0.26, ry: 0.16, rot: -0.4 },
    { dx:  0.14, dy:  0.4,  rx: 0.22, ry: 0.13, rot:  0.2 },
  ];

  for (const p of plates) {
    const px = posX + p.dx * radius;
    const py = posY + p.dy * radius;

    // Drop shadow offset away from the light lifts the plate off the surface
    ctx.beginPath();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = cp.deep;
    ctx.ellipse(
      px + radius * 0.035, py + radius * 0.035,
      p.rx * radius, p.ry * radius, p.rot, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = cp.light;
    ctx.ellipse(px, py, p.rx * radius, p.ry * radius, p.rot, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = cp.ink;
    ctx.lineWidth = Math.max(radius * 0.025, 1);
    ctx.ellipse(px, py, p.rx * radius, p.ry * radius, p.rot, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Two thin latitude panel lines across the disk
  ctx.strokeStyle = cp.ink;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = Math.max(radius * 0.02, 1);
  for (const latY of [-0.45, 0.55]) {
    const y = posY + latY * radius;
    const halfW = Math.sqrt(Math.max(1 - latY * latY, 0)) * radius * 0.94;
    ctx.beginPath();
    ctx.moveTo(posX - halfW, y);
    ctx.quadraticCurveTo(posX, y + radius * 0.12, posX + halfW, y);
    ctx.stroke();
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
