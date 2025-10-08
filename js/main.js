$(document).ready(() => {
  const context = new Context();
  const spaceShip = new SpaceShip(context.ctx, context.canvas);
  const game = new Game(context.ctx);
  let interval = null;
  let planets = null;
  let goal = null;
  const timeLeft = 1000;
  const gameOverCounter = 0;

  function draw() {
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
    if (goal.collision) {
      game.setLevel();
      game.level++;
      game.timeLeft = timeLeft;
      resetSpaceShip();
      goal = new Goal(game.goal);
      planets = game.planets.map((planet) => new Planet(planet));
    }
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
    game.timeLeft--;

    if (checkIfGameOver()) {
      game.level = 7;
      game.firstClick = true;
      gameOverCounter++;
    }
  }

  function engine() {
    if (game.level === 6) {
      game.winFrame();
    } else if (game.level === 7) {
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
