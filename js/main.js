$(document).ready(() => {
  const context = new Context();
  const spaceShip = new SpaceShip(context.ctx, context.canvas);
  const game = new Game(context.ctx);
  const starField = new StarField(context.ctx, context.canvas);
  let planets = [];
  let goal = null;
  const TIME_LEFT_START = 1000;
  const FPS = 30;

  let levelClearDelay = 0;
  const LEVEL_CLEAR_DELAY = 55;
  let screenFlashAlpha = 0;
  let scorePopups = [];

  function drawGameplay() {
    starField.draw();
    spaceShip.draw();
    if (goal) goal.draw(spaceShip.ctx);
    planets.forEach((p) => p.draw(spaceShip.ctx));
    drawScorePopups(spaceShip.ctx);
    game.drawHud();

    if (screenFlashAlpha > 0) {
      spaceShip.ctx.save();
      spaceShip.ctx.fillStyle = `rgba(0, 255, 120, ${screenFlashAlpha})`;
      spaceShip.ctx.fillRect(0, 0, spaceShip.canvas.width, spaceShip.canvas.height);
      spaceShip.ctx.restore();
      screenFlashAlpha = Math.max(0, screenFlashAlpha - 0.045);
    }

    if (levelClearDelay > 0) {
      const progress = levelClearDelay / LEVEL_CLEAR_DELAY;
      const alpha = progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25;
      const scale = 1 + (1 - Math.min(progress * 2, 1)) * 0.3;

      spaceShip.ctx.save();
      spaceShip.ctx.globalAlpha = alpha;
      spaceShip.ctx.translate(spaceShip.canvas.width / 2, spaceShip.canvas.height / 2);
      spaceShip.ctx.scale(scale, scale);
      drawChromaticTitle(spaceShip.ctx, "LEVEL CLEAR!", 0, 0, {
        font: "84px invasion",
        offset: 4,
        baseColor: ARCADE_PALETTE.green,
        accentColor: ARCADE_PALETTE.cyan,
        glow: 28,
      });
      spaceShip.ctx.restore();
    }
  }

  function drawScorePopups(ctx) {
    if (scorePopups.length === 0) return;
    scorePopups = scorePopups.filter((p) => p.life > 0);
    scorePopups.forEach((p) => {
      p.life--;
      p.y -= 1.2;
      const alpha = Math.max(0, p.life / p.maxLife);
      drawArcadeText(ctx, p.text, p.x, p.y, {
        font: "26px invasion",
        color: ARCADE_PALETTE.yellow,
        glowBlur: 14,
        fillColor: "#fff",
        alpha,
      });
    });
  }

  function drawMenuFrame() {
    starField.draw();
    if (game.level === 0) {
      game.drawTitleScreen();
    } else if (game.level === game.winLevel) {
      game.drawWinScreen();
    } else if (game.level === game.gameOverLevel) {
      game.drawGameOver();
    }
  }

  function resetSpaceShip() {
    spaceShip.reset();
  }

  function advanceLevel() {
    game.level++;
    const hasNextLevel = game.setLevel();

    if (!hasNextLevel) {
      game.level = game.winLevel;
      game.firstClick = true;
      game.persistHighScore();
      return;
    }

    game.timeLeft = TIME_LEFT_START;
    resetSpaceShip();
    goal = new Goal(game.goal);
    planets = game.planets.map((planet) => new Planet(planet));
  }

  function awardLevelClearScore() {
    const base = 1000;
    const timeBonus = Math.max(0, game.timeLeft) * 2;
    const total = base + timeBonus;
    game.score += total;

    const popupX = goal ? goal.posX + goal.width / 2 : spaceShip.canvas.width / 2;
    const popupY = goal ? goal.posY - 20 : spaceShip.canvas.height / 2;
    scorePopups.push({
      text: `+${total}`,
      x: popupX,
      y: popupY,
      life: 50,
      maxLife: 50,
    });
  }

  function checkCollisionsWithGoal() {
    if (levelClearDelay > 0) return;
    if (!goal || !goal.collision) return;

    goal.triggerCelebration();
    awardLevelClearScore();
    screenFlashAlpha = 0.65;
    levelClearDelay = 1;
  }

  function checkIfGameOver() {
    return game.timeLeft <= 0;
  }

  function update() {
    spaceShip.dangerLevel = 0;
    planets.forEach((planet) => spaceShip.collision(planet));
    spaceShip.update();
    if (goal) goal.update(spaceShip);
    planets.forEach((planet) => planet.collision(spaceShip));
    checkCollisionsWithGoal();

    if (game.level <= game.totalLevels) {
      game.timeLeft--;
    }

    if (checkIfGameOver()) {
      game.level = game.gameOverLevel;
      game.firstClick = true;
      game.persistHighScore();
    }
  }

  function gameplayTick() {
    if (levelClearDelay === 0) {
      update();
    } else {
      levelClearDelay++;
      if (levelClearDelay >= LEVEL_CLEAR_DELAY) {
        levelClearDelay = 0;
        advanceLevel();
      }
    }

    if (game.firstClick) {
      drawMenuFrame();
    } else {
      drawGameplay();
    }
  }

  function tick() {
    game.frame++;
    if (game.firstClick) {
      drawMenuFrame();
    } else {
      gameplayTick();
    }
  }

  function startGame() {
    game.level = 0;
    game.timeLeft = TIME_LEFT_START;
    game.score = 0;
    game.firstClick = false;
    game.setLevel();
    resetSpaceShip();
    goal = new Goal(game.goal);
    planets = game.planets.map((planet) => new Planet(planet));
    levelClearDelay = 0;
    screenFlashAlpha = 0;
    scorePopups = [];
  }

  setInterval(tick, 1000 / FPS);

  $(document).keypress((e) => {
    if (e.which === 13 && game.firstClick) {
      spaceShip.setListeners(e.which);
      startGame();
    }
  });
});
