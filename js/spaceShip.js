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
  this.explosion = {
    active: false,
    frame: 0,
    duration: 30,
    maxRadius: 70,
    posX: 0,
    posY: 0,
  };

  // Trail and proximity state
  this.trail = [];
  this.dangerLevel = 0;
}

SpaceShip.prototype.collision = function (planet) {
  if (this.explosion.active) {
    return;
  }

  let diffX = planet.posX - this.posX;
  let diffY = planet.posY - this.posY;
  let distance = Math.sqrt(diffX * diffX + diffY * diffY);
  let angle = Math.atan2(diffY, diffX);

  const influenceRadius =
    planet.gravityInfluenceRadius || this.gravityInfluenceRadius;

  if (distance < planet.radius) {
    this.dx = 0;
    this.dy = 0;
  } else if (distance <= influenceRadius) {
    const force = this.gravityFormula(planet, distance, influenceRadius);
    this.dx += force * Math.cos(angle);
    this.dy += force * Math.sin(angle);
  }

  // Danger proximity: within 2x the planet radius
  const dangerZone = planet.radius * 2.5;
  if (distance > planet.radius && distance < dangerZone) {
    const t = 1 - (distance - planet.radius) / (dangerZone - planet.radius);
    this.dangerLevel = Math.max(this.dangerLevel, t);
  }
};

SpaceShip.prototype.gravityFormula = function (planet, distance, influenceRadius) {
  const safeDistance = Math.max(distance, 1);
  const gravityForce = (G_CONSTANT * planet.mass) / (safeDistance * safeDistance);
  const effectiveInfluenceRadius = influenceRadius || this.gravityInfluenceRadius;
  const distanceFactor =
    1 - Math.min(safeDistance / effectiveInfluenceRadius, 1);
  const scaledForce = gravityForce * Math.max(distanceFactor, 0);

  return Math.min(this.maxGravityForce, scaledForce);
};

SpaceShip.prototype.update = function () {
  if (this.explosion.active) {
    this.explosion.frame++;

    if (this.explosion.frame >= this.explosion.duration) {
      this.reset();
    }

    return;
  }

  // Record trail position before moving
  this.trail.push({ x: this.posX, y: this.posY });
  if (this.trail.length > 22) {
    this.trail.shift();
  }

  this.posY += this.dy;
  this.posX += this.dx;
  this.angle += this.dAngle;
  this.move();
};

SpaceShip.prototype.draw = function () {
  if (this.explosion.active) {
    this.drawExplosion();
    return;
  }

  // Draw motion trail
  this.drawTrail();

  // Danger proximity ring
  if (this.dangerLevel > 0) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";
    this.ctx.beginPath();
    this.ctx.strokeStyle = `rgba(255, 55, 55, ${Math.min(this.dangerLevel, 1) * 0.85})`;
    this.ctx.lineWidth = 2 + this.dangerLevel * 3;
    this.ctx.arc(this.posX, this.posY, 22 + this.dangerLevel * 12, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  this.ctx.save();
  this.ctx.translate(this.posX, this.posY);
  this.ctx.rotate(this.angle);

  if (this.throttle) {
    this.drawThrusterBurst();
  }

  if (this.imageLoaded) {
    this.ctx.save();
    this.ctx.rotate(Math.PI / 2);
    this.ctx.drawImage(
      this.baseImage,
      -this.baseImage.width / 8,
      -this.baseImage.height / 8,
      this.baseImage.width / 4,
      this.baseImage.height / 4
    );
    this.ctx.restore();
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

SpaceShip.prototype.drawTrail = function () {
  if (this.trail.length < 2) return;

  this.ctx.save();
  this.ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < this.trail.length; i++) {
    const t = this.trail[i];
    const progress = i / this.trail.length;
    const alpha = progress * 0.3;
    const radius = progress * 4.5;

    this.ctx.beginPath();
    this.ctx.fillStyle = `rgba(100, 190, 255, ${alpha})`;
    this.ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  this.ctx.restore();
};

SpaceShip.prototype.drawExplosion = function () {
  this.ctx.save();
  this.ctx.translate(this.explosion.posX, this.explosion.posY);

  const progress = this.explosion.frame / this.explosion.duration;
  const outerRadius = this.explosion.maxRadius * progress;
  const middleRadius = outerRadius * 0.65;
  const innerRadius = outerRadius * 0.35;

  this.ctx.globalCompositeOperation = "lighter";

  const layers = [
    { radius: outerRadius, color: "255, 112, 67", alpha: 0.4 },
    { radius: middleRadius, color: "255, 213, 79", alpha: 0.6 },
    { radius: innerRadius, color: "255, 255, 255", alpha: 0.8 },
  ];

  layers.forEach(({ radius, color, alpha }) => {
    if (radius <= 0) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.fillStyle = `rgba(${color}, ${Math.max(1 - progress, 0) * alpha})`;
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();
  });

  this.ctx.restore();
};

SpaceShip.prototype.triggerExplosion = function (posX, posY) {
  if (this.explosion.active) {
    return;
  }

  this.explosion.active = true;
  this.explosion.frame = 0;
  this.explosion.posX = posX;
  this.explosion.posY = posY;
  this.dx = 0;
  this.dy = 0;
  this.dAngle = 0;
  this.throttle = false;
};

SpaceShip.prototype.reset = function () {
  this.posX = 50;
  this.posY = this.canvas.height / 2;
  this.angle = 0;
  this.speed = 0;
  this.dx = 0;
  this.dy = 0;
  this.dAngle = 0;
  this.throttle = false;
  this.explosion.active = false;
  this.explosion.frame = 0;
  this.explosion.posX = this.posX;
  this.explosion.posY = this.posY;
  this.trail = [];
  this.dangerLevel = 0;
};

SpaceShip.prototype.drawThrusterBurst = function () {
  const baseRadius = 6;
  const flicker = Math.random() * 6;
  const burstRadius = baseRadius + flicker;
  const burstOffset = -this.baseImage.width / 16 - 8;

  this.ctx.save();
  this.ctx.globalCompositeOperation = "lighter";

  const gradient = this.ctx.createRadialGradient(
    burstOffset,
    0,
    baseRadius * 0.3,
    burstOffset,
    0,
    burstRadius * 1.4
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.7)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  this.ctx.beginPath();
  this.ctx.fillStyle = gradient;
  this.ctx.arc(burstOffset, 0, burstRadius * 1.2, 0, Math.PI * 2);
  this.ctx.fill();

  this.ctx.beginPath();
  this.ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  this.ctx.ellipse(
    burstOffset - burstRadius * 0.4,
    0,
    burstRadius * 1.6,
    burstRadius * 0.9,
    0,
    0,
    Math.PI * 2
  );
  this.ctx.fill();

  this.ctx.restore();
};

SpaceShip.prototype.setListeners = function () {
  onkeydown = onkeyup = function (e) {
    this.tutorial = false;
    e = e || event;
    map[e.keyCode] = e.type == "keydown";
  };
};

SpaceShip.prototype.move = function () {
  if (this.explosion.active) {
    this.dx = 0;
    this.dy = 0;
    return;
  }

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
