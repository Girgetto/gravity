$(document).ready(() => {
  const context = new Context();
  const spaceShip = new SpaceShip(context.ctx, context.canvas);
  const game = new Game(context.ctx);
  const starField = new StarField(context.ctx, context.canvas);
  let interval = null;
  let planets = null;
  let goal = null;
  const timeLeft = 1000;
  let gameOverCounter = 0;

  // Celebration state
  let levelClearDelay = 0;
  const LEVEL_CLEAR_DELAY = 55;
  let screenFlashAlpha = 0;

  function draw() {
    starField.draw();
    spaceShip.draw();
    goal.draw(spaceShip.ctx);
    game.levelText(spaceShip.ctx);
    planets.forEach((planet) => {
      planet.draw(spaceShip.ctx);
    });

    // Screen flash on goal reached
    if (screenFlashAlpha > 0) {
      spaceShip.ctx.save();
      spaceShip.ctx.fillStyle = `rgba(0, 255, 120, ${screenFlashAlpha})`;
      spaceShip.ctx.fillRect(0, 0, spaceShip.canvas.width, spaceShip.canvas.height);
      spaceShip.ctx.restore();
      screenFlashAlpha = Math.max(0, screenFlashAlpha - 0.045);
    }

    // "LEVEL CLEAR!" overlay during celebration
    if (levelClearDelay > 0) {
      const progress = levelClearDelay / LEVEL_CLEAR_DELAY;
      const alpha = progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25;
      const scale = 1 + (1 - Math.min(progress * 2, 1)) * 0.25;

      spaceShip.ctx.save();
      spaceShip.ctx.globalAlpha = alpha;
      spaceShip.ctx.translate(spaceShip.canvas.width / 2, spaceShip.canvas.height / 2);
      spaceShip.ctx.scale(scale, scale);
      spaceShip.ctx.font = "80px invasion";
      spaceShip.ctx.fillStyle = "#00ff88";
      spaceShip.ctx.textAlign = "center";
      spaceShip.ctx.textBaseline = "middle";
      spaceShip.ctx.fillText("LEVEL CLEAR!", 0, 0);
      spaceShip.ctx.restore();
    }
  }

  function resetSpaceShip() {
    spaceShip.reset();
  }

  function resetGame() {
    resetSpaceShip();
    game.level = 0;
    game.timeLeft = timeLeft;
    game.setLevel();
    goal = new Goal(game.goal);
    planets = game.planets.map((planet) => new Planet(planet));
    game.firstClick = true;
    levelClearDelay = 0;
    screenFlashAlpha = 0;
  }

  function advanceLevel() {
    game.level++;
    const hasNextLevel = game.setLevel();

    if (!hasNextLevel) {
      game.level = game.winLevel;
      game.firstClick = true;
      return;
    }

    game.timeLeft = timeLeft;
    resetSpaceShip();
    goal = new Goal(game.goal);
    planets = game.planets.map((planet) => new Planet(planet));
  }

  function checkCollisionsWithGoal() {
    if (levelClearDelay > 0) {
      return;
    }

    if (!goal.collision) {
      return;
    }

    goal.triggerCelebration();
    screenFlashAlpha = 0.65;
    levelClearDelay = 1;
  }

  function clearCanvas() {
    spaceShip.ctx.clearRect(
      0,
      0,
      spaceShip.canvas.width,
      spaceShip.canvas.height
    );
  }

  function checkIfGameOver() {
    return game.timeLeft <= 0;
  }

  function update() {
    spaceShip.dangerLevel = 0;
    planets.forEach((planet) => spaceShip.collision(planet));
    spaceShip.update();
    goal.update(spaceShip);
    planets.forEach((planet) => {
      planet.collision(spaceShip);
    });
    checkCollisionsWithGoal();
    if (game.level <= game.totalLevels) {
      game.timeLeft--;
    }

    if (checkIfGameOver()) {
      game.level = game.gameOverLevel;
      game.firstClick = true;
      gameOverCounter++;
    }
  }

  function engine() {
    if (game.level === game.winLevel) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      game.winFrame();
    } else if (game.level === game.gameOverLevel) {
      clearInterval(interval);
      clearCanvas();
      game.drawGameOver();
    } else {
      if (levelClearDelay === 0) {
        update();
      } else {
        levelClearDelay++;
        if (levelClearDelay >= LEVEL_CLEAR_DELAY) {
          levelClearDelay = 0;
          advanceLevel();
        }
      }
      draw();
    }
  }

  game.firstFrameDraw();

  function startGame() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    resetGame();
    interval = game.start(engine);
  }

  $(document).keypress((e) => {
    if (e.which === 13 && game.firstClick) {
      spaceShip.setListeners(e.which);
      startGame();
    }
  });
});
