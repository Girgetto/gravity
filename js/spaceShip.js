const G_CONSTANT = 0.0000005;
const map = {};
const A_KEY = 65;
const D_KEY = 68;
const W_KEY = 87;
const spaceShipColor = "#FFF";

function SpaceShip(ctx, canvas) {
  this.canvas = canvas;
  this.ctx = ctx;
  this.posX = 50;
  this.posY = this.canvas.height / 2;
  this.v = [
    [-5, -10],
    [-5, 0],
    [10, -5],
  ];
  this.angle = 0;
  this.dx = 0;
  this.dy = 0;
  this.dAngle = 0;
  //this.audio = new Audio("audio/rocket.mp3");
  this.tutorial = true;
  this.throttle = false;
  this.isTurningRight = false;
  this.isTurningLeft = false;
  this.maxSpeed = 5;
  this.speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  // Parameters to control the strength and reach of planetary gravity.
  this.maxGravityForce = 0.6;
  this.gravityInfluenceRadius = 350;
  this.baseImage = new Image();
  this.baseImage.src = './img/spaceship.png';
  this.baseImage.onload = () => {
    this.imageLoaded = true;
  };
}

SpaceShip.prototype.collision = function (planet) {
  let diffX = planet.posX - this.posX;
  let diffY = planet.posY - this.posY;
  let distance = Math.sqrt(diffX * diffX + diffY * diffY);
  let angle = Math.atan2(diffY, diffX);

  if (distance < planet.radius) {
    this.dx = 0;
    this.dy = 0;
  } else if (distance <= this.gravityInfluenceRadius) {
    const force = this.gravityFormula(planet, distance);
    this.dx += force * Math.cos(angle);
    this.dy += force * Math.sin(angle);
  }
};

SpaceShip.prototype.gravityFormula = function (planet, distance) {
  const safeDistance = Math.max(distance, 1);
  const gravityForce = (G_CONSTANT * planet.mass) / (safeDistance * safeDistance);
  const distanceFactor = 1 - Math.min(safeDistance / this.gravityInfluenceRadius, 1);
  const scaledForce = gravityForce * Math.max(distanceFactor, 0);

  return Math.min(this.maxGravityForce, scaledForce);
};

SpaceShip.prototype.update = function () {
  this.posY += this.dy;
  this.posX += this.dx;
  this.angle += this.dAngle;
  this.move();
};

SpaceShip.prototype.draw = function () {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.save();
  this.ctx.translate(this.posX, this.posY);
  this.ctx.rotate(this.angle);

  if (this.imageLoaded) {
    this.ctx.rotate(Math.PI / 2);
    this.ctx.drawImage(
      this.baseImage,
      -this.baseImage.width / 8,
      -this.baseImage.height / 8,
      this.baseImage.width / 4,
      this.baseImage.height / 4
    );
  }

  this.ctx.restore();

  if (this.posX < 0) {
    this.dx *= -1;
  }

  if (this.posY < 0) {
    this.dy *= -1;
  }

  if (this.posX > this.canvas.width) {
    this.dx *= -1;
  }

  if (this.posY > this.canvas.height) {
    this.dy *= -1;
  }
};

SpaceShip.prototype.setListeners = function () {
  onkeydown = onkeyup = function (e) {
    this.tutorial = false;
    e = e || event;
    map[e.keyCode] = e.type == "keydown";
  };
};

SpaceShip.prototype.move = function () {
  var acceleration = 0.2; // Increased acceleration
  var deceleration = 0.98; // Deceleration factor for smooth easing
  var angleChange = 0.1; // Factor for how quickly the ship turns

  // Handling the forward thrust
  if (map[W_KEY]) {
    this.tutorial = false;
    this.throttle = true;
  } else {
    this.throttle = false;
  }

  // Handling the rotation left
  if (map[A_KEY]) {
    this.angle -= angleChange;
  }

  // Handling the rotation right
  if (map[D_KEY]) {
    this.angle += angleChange;
  }

  // Apply acceleration if throttle is on
  if (this.throttle) {
    this.dx += Math.cos(this.angle) * acceleration;
    this.dy += Math.sin(this.angle) * acceleration;
  } else {
    // Apply deceleration if throttle is off
    this.dx *= deceleration;
    this.dy *= deceleration;
  }

  // Clamp the speed to the maximum speed
  var currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  if (currentSpeed > this.maxSpeed) {
    this.dx = (this.dx / currentSpeed) * this.maxSpeed;
    this.dy = (this.dy / currentSpeed) * this.maxSpeed;
  }

  // Update the position
  this.posX += this.dx;
  this.posY += this.dy;

  // Wrap around logic for screen edges
  if (this.posX > this.W + 5) {
    this.posX = -5;
  } else if (this.posX < -5) {
    this.posX = this.W + 5;
  }

  if (this.posY > this.H + 5) {
    this.posY = -5;
  } else if (this.posY < -5) {
    this.posY = this.H + 5;
  }
};

