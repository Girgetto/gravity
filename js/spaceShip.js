const G_CONSTANT = 0.0000012;
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
  this.maxSpeed = 10;
  this.speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  // Parameters to control the strength and reach of planetary gravity.
  this.maxGravityForce = 1.2;
  this.gravityInfluenceRadius = 420;
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

  // Net gravity acting on the ship this frame (for physics feedback visuals)
  this.gravity = { x: 0, y: 0, strength: 0 };
  this.dominantPull = null;
  this.pullParticles = [];
}

SpaceShip.prototype.resetGravity = function () {
  this.gravity.x = 0;
  this.gravity.y = 0;
  this.gravity.strength = 0;
  this.dominantPull = null;
};

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
    const forceX = force * Math.cos(angle);
    const forceY = force * Math.sin(angle);
    this.dx += forceX;
    this.dy += forceY;

    // Accumulate the net pull so the ship can visualize what it feels.
    this.gravity.x += forceX;
    this.gravity.y += forceY;
    this.gravity.strength = Math.sqrt(
      this.gravity.x * this.gravity.x + this.gravity.y * this.gravity.y
    );

    planet.pullStrength = Math.max(
      planet.pullStrength || 0,
      Math.min(force / this.maxGravityForce, 1)
    );
    if (!this.dominantPull || force > this.dominantPull.force) {
      this.dominantPull = { planet, force };
    }
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
  const effectiveInfluenceRadius = influenceRadius || this.gravityInfluenceRadius;

  // Softened inverse-square law: full Newtonian pull at mid range, with a
  // softening length near the surface so the force stays finite and playable.
  const softening = planet.radius * 0.6;
  const gravityForce =
    (G_CONSTANT * planet.mass) /
    (safeDistance * safeDistance + softening * softening);

  // Only fade the force in the outer 30% of the influence radius (smoothstep)
  // instead of linearly damping it everywhere — the pull stays strong and
  // noticeable across the whole well, then eases out at the edge.
  const t = Math.min(safeDistance / effectiveInfluenceRadius, 1);
  let edgeFade = 1;
  if (t > 0.7) {
    const s = (t - 0.7) / 0.3;
    edgeFade = 1 - s * s * (3 - 2 * s);
  }

  return Math.min(this.maxGravityForce, gravityForce * edgeFade);
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

  this.updatePullParticles();

  // Velocity is integrated into position exactly once per frame, in move().
  this.angle += this.dAngle;
  this.move();
};

SpaceShip.prototype.updatePullParticles = function () {
  for (const p of this.pullParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  this.pullParticles = this.pullParticles.filter((p) => p.life > 0);

  if (!this.dominantPull) {
    return;
  }

  const { planet, force } = this.dominantPull;
  const strength = Math.min(force / this.maxGravityForce, 1);
  if (strength < 0.04 || this.pullParticles.length > 50) {
    return;
  }

  const pullAngle = Math.atan2(planet.posY - this.posY, planet.posX - this.posX);
  const perpAngle = pullAngle + Math.PI / 2;
  const count = strength > 0.45 ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const sideOffset = (Math.random() - 0.5) * 44;
    const backOffset = Math.random() * 14;
    const speed = 2.5 + strength * 4.5;

    this.pullParticles.push({
      x: this.posX + Math.cos(perpAngle) * sideOffset - Math.cos(pullAngle) * backOffset,
      y: this.posY + Math.sin(perpAngle) * sideOffset - Math.sin(pullAngle) * backOffset,
      vx: Math.cos(pullAngle) * speed,
      vy: Math.sin(pullAngle) * speed,
      life: 16,
      maxLife: 16,
      hue: planet.colorProfile ? planet.colorProfile.hue : 190,
    });
  }
};

SpaceShip.prototype.draw = function () {
  if (this.explosion.active) {
    this.drawExplosion();
    return;
  }

  // Draw motion trail
  this.drawTrail();

  // Gravity feedback: streaks pulled toward the planet + net-force arrow
  this.drawPullParticles();
  this.drawGravityIndicator();

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

  // Subtle rumble when the pull is strong — the ship physically feels it
  const pullRatio = Math.min(this.gravity.strength / this.maxGravityForce, 1);
  const shake = pullRatio > 0.35 ? (pullRatio - 0.35) * 4 : 0;
  const shakeX = (Math.random() - 0.5) * 2 * shake;
  const shakeY = (Math.random() - 0.5) * 2 * shake;

  this.ctx.save();
  this.ctx.translate(this.posX + shakeX, this.posY + shakeY);
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

SpaceShip.prototype.drawPullParticles = function () {
  if (this.pullParticles.length === 0) return;

  this.ctx.save();
  this.ctx.globalCompositeOperation = "lighter";
  this.ctx.lineCap = "round";

  for (const p of this.pullParticles) {
    const fade = p.life / p.maxLife;
    this.ctx.beginPath();
    this.ctx.strokeStyle = `hsla(${p.hue}, 100%, 72%, ${fade * 0.55})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  }

  this.ctx.restore();
};

SpaceShip.prototype.drawGravityIndicator = function () {
  const strength = this.gravity.strength;
  if (strength < 0.025) return;

  const magnitude = Math.sqrt(
    this.gravity.x * this.gravity.x + this.gravity.y * this.gravity.y
  );
  if (magnitude === 0) return;

  const nx = this.gravity.x / magnitude;
  const ny = this.gravity.y / magnitude;
  const ratio = Math.min(strength / this.maxGravityForce, 1);

  // Cyan when the tug is gentle, shifting to red as it gets dangerous
  const hue = 190 - ratio * 190;
  const alpha = 0.35 + ratio * 0.55;
  const startDist = 20;
  const length = 22 + ratio * 42;
  const endX = this.posX + nx * (startDist + length);
  const endY = this.posY + ny * (startDist + length);

  this.ctx.save();
  this.ctx.globalCompositeOperation = "lighter";
  this.ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
  this.ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
  this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
  this.ctx.shadowBlur = 10;
  this.ctx.lineWidth = 2 + ratio * 2;
  this.ctx.lineCap = "round";

  this.ctx.beginPath();
  this.ctx.moveTo(this.posX + nx * startDist, this.posY + ny * startDist);
  this.ctx.lineTo(endX, endY);
  this.ctx.stroke();

  // Arrowhead
  const headSize = 6 + ratio * 5;
  const headAngle = Math.atan2(ny, nx);
  this.ctx.beginPath();
  this.ctx.moveTo(endX, endY);
  this.ctx.lineTo(
    endX - Math.cos(headAngle - 0.45) * headSize,
    endY - Math.sin(headAngle - 0.45) * headSize
  );
  this.ctx.lineTo(
    endX - Math.cos(headAngle + 0.45) * headSize,
    endY - Math.sin(headAngle + 0.45) * headSize
  );
  this.ctx.closePath();
  this.ctx.fill();

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
  this.pullParticles = [];
  this.resetGravity();
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

  var acceleration = 0.4; // Thrust applied along the ship's heading
  // Space has (almost) no drag: coasting keeps momentum so gravity visibly
  // bends the flight path and slingshots around planets are possible.
  var deceleration = 0.99;
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

  // Update the position (single integration step per frame)
  this.posX += this.dx;
  this.posY += this.dy;
};
