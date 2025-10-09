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
  this.img = new Image();
  this.img.src = "./img/planet.png";
  //this.audio = new Audio("audio/metallic_space_impact.mp3");
}

Planet.prototype.draw = function (ctx) {
  ctx.save();
  ctx.beginPath();
  const diameter = this.radius * 2;
  ctx.drawImage(this.img, this.posX - this.radius, this.posY - this.radius, diameter, diameter);
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
