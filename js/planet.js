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
    highlight: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 12, 80)}%)`,
    mid: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    shadow: `hsl(${hue}, ${Math.min(saturation + 10, 100)}%, ${Math.max(
      lightness - 15,
      10
    )}%)`,
  };
}

Planet.prototype.draw = function (ctx) {
  // Subtle gravity influence ring
  ctx.save();
  ctx.beginPath();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = this.colorProfile.mid;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 11]);
  ctx.arc(this.posX, this.posY, this.gravityInfluenceRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.closePath();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  const gradient = ctx.createRadialGradient(
    this.posX - this.radius * 0.35,
    this.posY - this.radius * 0.35,
    this.radius * 0.2,
    this.posX,
    this.posY,
    this.radius
  );

  gradient.addColorStop(0, this.colorProfile.highlight);
  gradient.addColorStop(0.6, this.colorProfile.mid);
  gradient.addColorStop(1, this.colorProfile.shadow);

  ctx.fillStyle = gradient;
  ctx.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = this.colorProfile.shadow;
  ctx.lineWidth = Math.max(this.radius * 0.04, 1);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};

Planet.prototype.collision = function (ship) {
  const diffX = ship.posX - this.posX;
  const diffY = ship.posY - this.posY;
  const distance = Math.sqrt(diffX * diffX + diffY * diffY);

  if (distance <= this.radius) {
    ship.triggerExplosion(ship.posX, ship.posY);
  }
};
