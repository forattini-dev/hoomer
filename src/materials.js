function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const cache = {};

function brick(ctx) {
  if (cache.brick) return cache.brick;
  const c = createCanvas(24, 12);
  const g = c.getContext('2d');
  g.fillStyle = '#b0a090';
  g.fillRect(0, 0, 24, 12);
  g.fillStyle = '#c0392b';
  g.fillRect(1, 1, 10, 4);
  g.fillRect(13, 1, 10, 4);
  g.fillStyle = '#a93226';
  g.fillRect(7, 7, 10, 4);
  g.fillRect(19, 7, 4, 4);
  g.fillRect(0, 7, 5, 4);
  cache.brick = ctx.createPattern(c, 'repeat');
  return cache.brick;
}

function concrete(ctx) {
  if (cache.concrete) return cache.concrete;
  const c = createCanvas(8, 8);
  const g = c.getContext('2d');
  g.fillStyle = '#95a5a6';
  g.fillRect(0, 0, 8, 8);
  g.fillStyle = '#7f8c8d';
  for (let i = 0; i < 6; i++) g.fillRect(Math.random() * 7, Math.random() * 7, 1, 1);
  g.fillStyle = '#a3b1b2';
  for (let i = 0; i < 4; i++) g.fillRect(Math.random() * 7, Math.random() * 7, 1, 1);
  cache.concrete = ctx.createPattern(c, 'repeat');
  return cache.concrete;
}

function wood(ctx) {
  if (cache.wood) return cache.wood;
  const c = createCanvas(16, 16);
  const g = c.getContext('2d');
  g.fillStyle = '#A0522D';
  g.fillRect(0, 0, 16, 16);
  g.strokeStyle = '#8B4513';
  g.lineWidth = 1;
  for (let y = 0; y < 16; y += 3) {
    g.beginPath();
    g.moveTo(0, y + Math.random() * 2);
    g.lineTo(16, y + Math.random() * 2);
    g.stroke();
  }
  cache.wood = ctx.createPattern(c, 'repeat');
  return cache.wood;
}

function drywall(ctx) {
  if (cache.drywall) return cache.drywall;
  const c = createCanvas(4, 4);
  const g = c.getContext('2d');
  g.fillStyle = '#dfe6e9';
  g.fillRect(0, 0, 4, 4);
  g.fillStyle = '#d5dce0';
  g.fillRect(0, 0, 1, 1);
  g.fillRect(2, 2, 1, 1);
  cache.drywall = ctx.createPattern(c, 'repeat');
  return cache.drywall;
}

function ceramic(ctx) {
  if (cache.ceramic) return cache.ceramic;
  const c = createCanvas(30, 30);
  const g = c.getContext('2d');
  g.fillStyle = '#f5f0e1';
  g.fillRect(0, 0, 30, 30);
  g.strokeStyle = '#c8b99a';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, 29, 29);
  g.strokeStyle = '#e0d5c0';
  g.strokeRect(2.5, 2.5, 25, 25);
  cache.ceramic = ctx.createPattern(c, 'repeat');
  return cache.ceramic;
}

function hardwood(ctx) {
  if (cache.hardwood) return cache.hardwood;
  const c = createCanvas(40, 10);
  const g = c.getContext('2d');
  g.fillStyle = '#8B5E3C';
  g.fillRect(0, 0, 40, 10);
  g.fillStyle = '#A67C52';
  g.fillRect(0, 0, 18, 9);
  g.fillRect(20, 0, 19, 9);
  g.strokeStyle = '#6B3E1C';
  g.lineWidth = 0.5;
  g.strokeRect(0.5, 0.5, 17, 8);
  g.strokeRect(20.5, 0.5, 18, 8);
  cache.hardwood = ctx.createPattern(c, 'repeat');
  return cache.hardwood;
}

function marble(ctx) {
  if (cache.marble) return cache.marble;
  const c = createCanvas(40, 40);
  const g = c.getContext('2d');
  g.fillStyle = '#f0eded';
  g.fillRect(0, 0, 40, 40);
  g.strokeStyle = '#d4cfcf';
  g.lineWidth = 0.5;
  g.beginPath();
  g.moveTo(0, 10); g.quadraticCurveTo(15, 5, 30, 15); g.lineTo(40, 12);
  g.stroke();
  g.beginPath();
  g.moveTo(5, 30); g.quadraticCurveTo(20, 25, 40, 35);
  g.stroke();
  g.strokeStyle = '#e0dbdb';
  g.beginPath();
  g.moveTo(0, 20); g.quadraticCurveTo(10, 22, 25, 18); g.lineTo(40, 22);
  g.stroke();
  cache.marble = ctx.createPattern(c, 'repeat');
  return cache.marble;
}

function cimentoQueimado(ctx) {
  if (cache.cimentoQueimado) return cache.cimentoQueimado;
  const c = createCanvas(8, 8);
  const g = c.getContext('2d');
  g.fillStyle = '#7f8c8d';
  g.fillRect(0, 0, 8, 8);
  g.fillStyle = '#6c7a7b';
  g.fillRect(1, 1, 2, 2);
  g.fillRect(5, 4, 2, 2);
  g.fillStyle = '#8e9b9c';
  g.fillRect(3, 5, 2, 1);
  cache.cimentoQueimado = ctx.createPattern(c, 'repeat');
  return cache.cimentoQueimado;
}

const generators = { brick, concrete, wood, drywall, ceramic, hardwood, marble, cimentoQueimado };

export const Materials = {
  getWall(name, ctx) {
    return (generators[name] || generators.brick)(ctx);
  },
  getFloor(name, ctx) {
    return (generators[name] || generators.ceramic)(ctx);
  },
};
