const ARCADE_PALETTE = {
  cyan: "#00f0ff",
  magenta: "#ff2bb1",
  yellow: "#ffe300",
  green: "#00ff88",
  red: "#ff3344",
  pink: "#ff66aa",
  white: "#ffffff",
};

function drawArcadeText(ctx, text, x, y, options) {
  options = options || {};
  const font = options.font || "30px invasion";
  const color = options.color || ARCADE_PALETTE.cyan;
  const glowColor = options.glowColor || color;
  const glowBlur = options.glowBlur != null ? options.glowBlur : 16;
  const align = options.align || "center";
  const baseline = options.baseline || "middle";
  const fillColor = options.fillColor === undefined ? "#ffffff" : options.fillColor;
  const passes = options.passes || 2;
  const alpha = options.alpha != null ? options.alpha : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.fillStyle = color;
  for (let i = 0; i < passes; i++) {
    ctx.fillText(text, x, y);
  }

  if (fillColor) {
    ctx.shadowBlur = glowBlur * 0.35;
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

function drawChromaticTitle(ctx, text, x, y, options) {
  options = options || {};
  const font = options.font || "120px invasion";
  const offset = options.offset != null ? options.offset : 4;
  const baseColor = options.baseColor || ARCADE_PALETTE.cyan;
  const accentColor = options.accentColor || ARCADE_PALETTE.magenta;
  const glow = options.glow != null ? options.glow : 28;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalCompositeOperation = "lighter";

  ctx.shadowColor = baseColor;
  ctx.shadowBlur = glow;
  ctx.fillStyle = accentColor;
  ctx.fillText(text, x - offset, y);

  ctx.shadowColor = accentColor;
  ctx.fillStyle = baseColor;
  ctx.fillText(text, x + offset, y);

  ctx.shadowColor = baseColor;
  ctx.shadowBlur = glow * 0.45;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x, y);

  ctx.restore();
}

function padNumber(num, length) {
  return String(Math.max(0, Math.floor(num))).padStart(length, "0");
}

function drawCornerBrackets(ctx, x, y, w, h, options) {
  options = options || {};
  const len = options.len || 36;
  const color = options.color || "rgba(0, 240, 255, 0.85)";
  const glow = options.glow || ARCADE_PALETTE.cyan;
  const lineWidth = options.lineWidth || 2.5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
  ctx.stroke();
  ctx.restore();
}

function drawKeyCap(ctx, cx, cy, label, hint) {
  const size = 36;
  ctx.save();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.shadowColor = ARCADE_PALETTE.cyan;
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
  ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
  ctx.restore();

  drawArcadeText(ctx, label, cx, cy + 1, {
    font: "22px invasion",
    color: ARCADE_PALETTE.cyan,
    glowBlur: 10,
    fillColor: "#fff",
  });
  drawArcadeText(ctx, hint, cx + size / 2 + 12, cy + 1, {
    font: "16px invasion",
    color: "rgba(255, 255, 255, 0.85)",
    glowBlur: 0,
    fillColor: null,
    align: "left",
  });
}

function drawScanlines(ctx, canvas) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#000";
  for (let y = 0; y < canvas.height; y += 3) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  ctx.restore();
}

function readHighScore() {
  try {
    const raw = localStorage.getItem("gravity.highScore");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch (_) {
    return 0;
  }
}

function Game(ctx) {
  this.level = 0;
  this.timeLeft = 100;
  this.planets = [];
  this.goal = {};
  this.firstClick = true;
  this.ctx = ctx;
  this.isTrained = false;
  this.totalLevels = TOTAL_PLAYABLE_LEVELS;
  this.winLevel = this.totalLevels + 1;
  this.gameOverLevel = this.totalLevels + 2;
  this.frame = 0;
  this.score = 0;
  this.highScore = readHighScore();
}

Game.prototype.persistHighScore = function () {
  if (this.score > this.highScore) {
    this.highScore = this.score;
    try {
      localStorage.setItem("gravity.highScore", String(this.highScore));
    } catch (_) {}
  }
};

Game.prototype.drawHud = function () {
  if (this.level <= 0 || this.level > this.totalLevels) return;

  const ctx = this.ctx;
  const W = ctx.canvas.width;

  // Top translucent panel
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#000814";
  ctx.fillRect(0, 0, W, 90);
  ctx.restore();

  // Bottom gradient line
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "rgba(0, 240, 255, 0)");
  grad.addColorStop(0.3, "rgba(0, 240, 255, 0.9)");
  grad.addColorStop(0.7, "rgba(255, 43, 177, 0.9)");
  grad.addColorStop(1, "rgba(255, 43, 177, 0)");
  ctx.strokeStyle = grad;
  ctx.shadowColor = ARCADE_PALETTE.cyan;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 89);
  ctx.lineTo(W, 89);
  ctx.stroke();
  ctx.restore();

  // LEVEL (left)
  drawArcadeText(ctx, "LEVEL", 40, 22, {
    font: "16px invasion",
    color: ARCADE_PALETTE.magenta,
    align: "left",
    glowBlur: 10,
    fillColor: "#fff",
  });
  drawArcadeText(ctx, `${padNumber(this.level, 2)} / ${padNumber(this.totalLevels, 2)}`, 40, 50, {
    font: "30px invasion",
    color: ARCADE_PALETTE.cyan,
    align: "left",
    glowBlur: 16,
    fillColor: "#fff",
  });

  // HI SCORE (center)
  drawArcadeText(ctx, "HI-SCORE", W / 2, 22, {
    font: "16px invasion",
    color: ARCADE_PALETTE.magenta,
    glowBlur: 10,
    fillColor: "#fff",
  });
  drawArcadeText(ctx, padNumber(Math.max(this.highScore, this.score), 6), W / 2, 50, {
    font: "30px invasion",
    color: ARCADE_PALETTE.yellow,
    glowBlur: 16,
    fillColor: "#fff",
  });

  // SCORE (right)
  drawArcadeText(ctx, "1UP", W - 40, 22, {
    font: "16px invasion",
    color: ARCADE_PALETTE.magenta,
    align: "right",
    glowBlur: 10,
    fillColor: "#fff",
  });
  drawArcadeText(ctx, padNumber(this.score, 6), W - 40, 50, {
    font: "30px invasion",
    color: ARCADE_PALETTE.green,
    align: "right",
    glowBlur: 16,
    fillColor: "#fff",
  });

  // Fuel/timer bar
  const barX = 40;
  const barY = 72;
  const barW = W - 80;
  const barH = 8;
  const ratio = Math.max(0, Math.min(1, this.timeLeft / 1000));
  const fillW = ratio * barW;
  const timerColor =
    this.timeLeft > 600 ? ARCADE_PALETTE.cyan :
    this.timeLeft > 300 ? ARCADE_PALETTE.yellow : ARCADE_PALETTE.red;

  ctx.save();
  // Track
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(barX, barY, barW, barH);
  // Fill
  ctx.shadowColor = timerColor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = timerColor;
  ctx.fillRect(barX, barY, fillW, barH);
  // Pulsing tip
  if (fillW > 4) {
    const pulse = 0.5 + Math.sin(this.frame * 0.25) * 0.5;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#fff";
    ctx.fillRect(barX + fillW - 3, barY, 3, barH);
  }
  ctx.globalAlpha = 1;
  // Bracket caps
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0, 240, 255, 0.85)";
  ctx.fillRect(barX - 8, barY - 3, 3, barH + 6);
  ctx.fillRect(barX + barW + 5, barY - 3, 3, barH + 6);
  ctx.restore();
};

Game.prototype.drawTitleScreen = function () {
  const ctx = this.ctx;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  // Title with chromatic aberration & pulsing glow
  const titleGlow = 28 + Math.sin(this.frame * 0.06) * 14;
  drawChromaticTitle(ctx, "GRAVITY", cx, cy - 140, {
    font: "150px invasion",
    offset: 5,
    baseColor: ARCADE_PALETTE.cyan,
    accentColor: "#ff007a",
    glow: titleGlow,
  });

  // Subtitle
  drawArcadeText(ctx, "// ESCAPE  THE  PULL  OF  THE  COSMOS //", cx, cy - 50, {
    font: "22px invasion",
    color: ARCADE_PALETTE.magenta,
    glowBlur: 14,
    fillColor: "#fff",
  });

  // Blinking PRESS ENTER
  const blink = Math.floor(this.frame / 15) % 2 === 0;
  if (blink) {
    drawArcadeText(ctx, "> PRESS ENTER TO START <", cx, cy + 30, {
      font: "40px invasion",
      color: ARCADE_PALETTE.yellow,
      glowBlur: 24,
      fillColor: "#fff",
    });
  }

  // Controls panel
  this.drawControlsPanel(cx, cy + 120);

  // High score banner
  drawArcadeText(ctx, `HIGH  SCORE   ${padNumber(this.highScore, 6)}`, cx, cy + 220, {
    font: "26px invasion",
    color: ARCADE_PALETTE.green,
    glowBlur: 16,
    fillColor: "#fff",
  });

  // Bottom credit
  drawArcadeText(ctx, "(C) 2026  GRAVITY  ARCADE  -  1 PLAYER", cx, H - 36, {
    font: "14px invasion",
    color: "rgba(0, 240, 255, 0.65)",
    glowBlur: 6,
    fillColor: null,
  });

  drawCornerBrackets(ctx, 20, 20, W - 40, H - 40);
};

Game.prototype.drawControlsPanel = function (cx, cy) {
  const ctx = this.ctx;
  const w = 560;
  const h = 70;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#001020";
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();

  drawKeyCap(ctx, x + 50, cy, "W", "THRUST");
  drawKeyCap(ctx, x + 230, cy, "A", "TURN L");
  drawKeyCap(ctx, x + 410, cy, "D", "TURN R");
};

Game.prototype.drawGameOver = function () {
  const ctx = this.ctx;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  // Dark overlay
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // GAME OVER with flicker
  const flicker = Math.random() < 0.04 ? 0.4 : 1;
  ctx.save();
  ctx.globalAlpha = flicker;
  drawChromaticTitle(ctx, "GAME OVER", cx, cy - 70, {
    font: "120px invasion",
    offset: 5,
    baseColor: ARCADE_PALETTE.red,
    accentColor: ARCADE_PALETTE.pink,
    glow: 32,
  });
  ctx.restore();

  drawArcadeText(ctx, `SCORE     ${padNumber(this.score, 6)}`, cx, cy + 30, {
    font: "30px invasion",
    color: ARCADE_PALETTE.cyan,
    glowBlur: 16,
    fillColor: "#fff",
  });
  drawArcadeText(ctx, `HI-SCORE  ${padNumber(this.highScore, 6)}`, cx, cy + 70, {
    font: "24px invasion",
    color: ARCADE_PALETTE.yellow,
    glowBlur: 12,
    fillColor: "#fff",
  });

  const blink = Math.floor(this.frame / 15) % 2 === 0;
  if (blink) {
    drawArcadeText(ctx, "> INSERT COIN -- PRESS ENTER <", cx, cy + 150, {
      font: "28px invasion",
      color: ARCADE_PALETTE.magenta,
      glowBlur: 18,
      fillColor: "#fff",
    });
  }

  drawCornerBrackets(ctx, 20, 20, W - 40, H - 40, {
    color: "rgba(255, 51, 68, 0.8)",
    glow: ARCADE_PALETTE.red,
  });
};

Game.prototype.drawWinScreen = function () {
  const ctx = this.ctx;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  drawChromaticTitle(ctx, "VICTORY!", cx, cy - 70, {
    font: "130px invasion",
    offset: 5,
    baseColor: ARCADE_PALETTE.green,
    accentColor: ARCADE_PALETTE.cyan,
    glow: 34,
  });

  drawArcadeText(ctx, "MISSION COMPLETE", cx, cy - 5, {
    font: "26px invasion",
    color: ARCADE_PALETTE.cyan,
    glowBlur: 14,
    fillColor: "#fff",
  });

  drawArcadeText(ctx, `FINAL SCORE   ${padNumber(this.score, 6)}`, cx, cy + 40, {
    font: "30px invasion",
    color: ARCADE_PALETTE.yellow,
    glowBlur: 16,
    fillColor: "#fff",
  });

  const isNewHigh = this.score > 0 && this.score >= this.highScore;
  if (isNewHigh) {
    const pulse = 0.5 + Math.sin(this.frame * 0.2) * 0.5;
    drawArcadeText(ctx, "*** NEW HIGH SCORE ***", cx, cy + 80, {
      font: "22px invasion",
      color: ARCADE_PALETTE.magenta,
      glowBlur: 18,
      fillColor: "#fff",
      alpha: 0.55 + pulse * 0.45,
    });
  } else {
    drawArcadeText(ctx, `HI-SCORE     ${padNumber(this.highScore, 6)}`, cx, cy + 80, {
      font: "22px invasion",
      color: ARCADE_PALETTE.cyan,
      glowBlur: 12,
      fillColor: "#fff",
    });
  }

  const blink = Math.floor(this.frame / 15) % 2 === 0;
  if (blink) {
    drawArcadeText(ctx, "> PRESS ENTER TO PLAY AGAIN <", cx, cy + 150, {
      font: "26px invasion",
      color: ARCADE_PALETTE.green,
      glowBlur: 18,
      fillColor: "#fff",
    });
  }

  drawCornerBrackets(ctx, 20, 20, W - 40, H - 40, {
    color: "rgba(0, 255, 136, 0.85)",
    glow: ARCADE_PALETTE.green,
  });
};

Game.prototype.setLevel = function () {
  if (this.level > this.totalLevels) {
    return false;
  }

  const { goal, planets } = getLevelConfiguration(this.level, this.ctx);
  const safePlanets = Array.isArray(planets) ? planets : [];

  this.planets = safePlanets.map((planet) => ({ ...planet }));
  this.goal = goal ? { ...goal } : { posX: 300, posY: 300 };

  return true;
};

// Backwards-compat alias kept in case anything else calls these.
Game.prototype.firstFrameDraw = Game.prototype.drawTitleScreen;
Game.prototype.winFrame = Game.prototype.drawWinScreen;
Game.prototype.levelText = Game.prototype.drawHud;
