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

  function draw() {
    starField.draw();
    spaceShip.draw();
    goal.draw(spaceShip.ctx);
    game.levelText(spaceShip.ctx);
    planets.forEach((planet) => {
      planet.draw(spaceShip.ctx);
    });
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
  }

  function checkCollisionsWithGoal() {
    if (!goal.collision) {
      return;
    }

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
      game.winFrame();
    } else if (game.level === game.gameOverLevel) {
      clearInterval(interval);
      clearCanvas();
      game.drawGameOver();
    } else {
      update();
      draw();
    }
  }

  game.firstFrameDraw();

  function startGame() {
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
