/* eslint-disable no-unused-vars */
const levelDefinitions = [
  () => ({
    goal: { posX: 300, posY: 300 },
    planets: [],
  }),
  () => ({
    goal: { posX: 900, posY: 400 },
    planets: [
      {
        posX: 550,
        posY: 400,
        radius: 35,
        density: Math.pow(10, 6) * 0.9,
      },
    ],
  }),
  () => ({
    goal: { posX: 1200, posY: 150 },
    planets: [
      {
        posX: 650,
        posY: 420,
        radius: 55,
        density: Math.pow(10, 6) * 1.1,
      },
      {
        posX: 820,
        posY: 220,
        radius: 28,
        density: Math.pow(10, 6) * 0.8,
      },
    ],
  }),
  () => ({
    goal: { posX: 1250, posY: 600 },
    planets: [
      {
        posX: 700,
        posY: 350,
        radius: 42,
        density: Math.pow(10, 6) * 1.2,
      },
      {
        posX: 460,
        posY: 520,
        radius: 30,
        density: Math.pow(10, 6) * 0.7,
      },
      {
        posX: 900,
        posY: 220,
        radius: 24,
        density: Math.pow(10, 6) * 1.4,
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 250,
      posY: ctx.canvas.height / 2,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2,
        radius: 60,
        density: Math.pow(10, 6) * 1.5,
      },
      {
        posX: ctx.canvas.width / 3,
        posY: ctx.canvas.height / 3,
        radius: 35,
        density: Math.pow(10, 7) * 0.6,
      },
      {
        posX: (ctx.canvas.width / 3) * 2,
        posY: (ctx.canvas.height / 4) * 3,
        radius: 30,
        density: Math.pow(10, 6),
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 180,
      posY: 140,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2,
        posY: 180,
        radius: 38,
        density: Math.pow(10, 6) * 1.3,
      },
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2,
        radius: 40,
        density: Math.pow(10, 6) * 1.2,
      },
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height - 180,
        radius: 38,
        density: Math.pow(10, 6) * 1.3,
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 250,
      posY: ctx.canvas.height - 150,
    },
    planets: [
      {
        posX: 400,
        posY: ctx.canvas.height / 3,
        radius: 30,
        density: Math.pow(10, 7) * 0.6,
      },
      {
        posX: 600,
        posY: (ctx.canvas.height / 3) * 2,
        radius: 28,
        density: Math.pow(10, 7) * 0.8,
      },
      {
        posX: 850,
        posY: ctx.canvas.height / 2,
        radius: 36,
        density: Math.pow(10, 6) * 1.4,
      },
      {
        posX: 1100,
        posY: ctx.canvas.height / 2 - 120,
        radius: 26,
        density: Math.pow(10, 6),
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 180,
      posY: ctx.canvas.height - 140,
    },
    planets: [
      { posX: 500, posY: 200, radius: 26, density: Math.pow(10, 6) * 0.8 },
      { posX: 720, posY: 320, radius: 34, density: Math.pow(10, 6) },
      { posX: 520, posY: 520, radius: 26, density: Math.pow(10, 6) * 0.8 },
      { posX: 860, posY: ctx.canvas.height / 2, radius: 32, density: Math.pow(10, 6) * 0.9 },
      {
        posX: ctx.canvas.width - 320,
        posY: (ctx.canvas.height / 5) * 4,
        radius: 24,
        density: Math.pow(10, 6) * 0.7,
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 200,
      posY: 100,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2,
        radius: 70,
        density: Math.pow(10, 6) * 1.8,
      },
      {
        posX: ctx.canvas.width / 3,
        posY: ctx.canvas.height / 4,
        radius: 32,
        density: Math.pow(10, 6),
      },
      {
        posX: ctx.canvas.width - 450,
        posY: ctx.canvas.height - 220,
        radius: 28,
        density: Math.pow(10, 6) * 1.2,
      },
      {
        posX: ctx.canvas.width / 3,
        posY: (ctx.canvas.height / 4) * 3,
        radius: 28,
        density: Math.pow(10, 6) * 1.1,
      },
    ],
  }),
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 200,
      posY: ctx.canvas.height / 3,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2 - 180,
        radius: 38,
        density: Math.pow(10, 6) * 0.6,
      },
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2 + 180,
        radius: 38,
        density: Math.pow(10, 6) * 0.6,
      },
      {
        posX: ctx.canvas.width / 2 - 220,
        posY: ctx.canvas.height / 2,
        radius: 32,
        density: Math.pow(10, 6) * 0.7,
      },
      {
        posX: ctx.canvas.width / 2 + 220,
        posY: ctx.canvas.height / 2,
        radius: 32,
        density: Math.pow(10, 6) * 0.7,
      },
      {
        posX: ctx.canvas.width - 380,
        posY: ctx.canvas.height / 2,
        radius: 26,
        density: Math.pow(10, 6) * 0.6,
      },
    ],
  }),
  // Level 10 — Binary: two massive planets forming a gravity channel
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 150,
      posY: ctx.canvas.height / 2,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2 - 80,
        posY: ctx.canvas.height / 4,
        radius: 58,
        density: Math.pow(10, 6) * 1.7,
      },
      {
        posX: ctx.canvas.width / 2 + 80,
        posY: (ctx.canvas.height / 4) * 3,
        radius: 58,
        density: Math.pow(10, 6) * 1.7,
      },
      {
        posX: ctx.canvas.width - 370,
        posY: ctx.canvas.height / 2 - 160,
        radius: 24,
        density: Math.pow(10, 6) * 0.9,
      },
      {
        posX: ctx.canvas.width - 370,
        posY: ctx.canvas.height / 2 + 160,
        radius: 24,
        density: Math.pow(10, 6) * 0.9,
      },
    ],
  }),
  // Level 11 — Solar System: a giant central planet with orbital guards
  (ctx) => ({
    goal: {
      posX: ctx.canvas.width - 150,
      posY: 90,
    },
    planets: [
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2,
        radius: 80,
        density: Math.pow(10, 6) * 2.0,
      },
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2 - 255,
        radius: 22,
        density: Math.pow(10, 6) * 0.8,
      },
      {
        posX: ctx.canvas.width / 2 + 285,
        posY: ctx.canvas.height / 2,
        radius: 22,
        density: Math.pow(10, 6) * 0.8,
      },
      {
        posX: ctx.canvas.width / 2,
        posY: ctx.canvas.height / 2 + 255,
        radius: 22,
        density: Math.pow(10, 6) * 0.8,
      },
      {
        posX: ctx.canvas.width / 2 - 285,
        posY: ctx.canvas.height / 2,
        radius: 22,
        density: Math.pow(10, 6) * 0.8,
      },
    ],
  }),
];

const TOTAL_PLAYABLE_LEVELS = levelDefinitions.length - 1;

function getLevelConfiguration(levelIndex, ctx) {
  const resolver = levelDefinitions[levelIndex];

  if (!resolver) {
    return {
      goal: { posX: 300, posY: 300 },
      planets: [],
    };
  }

  if (typeof resolver === "function") {
    return resolver(ctx);
  }

  return resolver;
}
