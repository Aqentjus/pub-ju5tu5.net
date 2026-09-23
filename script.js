const endpoints = [
  {
    id: "github",
    label: "GitHub",
    host: "github.com/Aqentjus",
    url: "https://github.com/Aqentjus"
  },
  {
    id: "projects",
    label: "Projects",
    host: "public repositories",
    url: "https://github.com/Aqentjus?tab=repositories"
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    host: "link pending",
    url: null
  },
  {
    id: "email",
    label: "Email",
    host: "link pending",
    url: null
  },
  {
    id: "steam",
    label: "Steam",
    host: "link pending",
    url: null
  },
  {
    id: "discord",
    label: "Discord",
    host: "link pending",
    url: null
  }
];

const desktopPositions = {
  core: [50, 50],
  github: [18, 24],
  projects: [78, 23],
  linkedin: [87, 56],
  email: [69, 80],
  steam: [28, 80],
  discord: [12, 56],

  a1: [30, 15],
  a2: [43, 20],
  a3: [62, 16],
  a4: [72, 35],
  a5: [90, 34],
  a6: [82, 73],
  a7: [54, 84],
  a8: [42, 72],
  a9: [11, 35],
  a10: [33, 42],
  a11: [61, 61],
  a12: [76, 58],
  a13: [40, 59],
  a14: [22, 63],
  a15: [56, 34],
  a16: [50, 8],
  a17: [95, 69],
  a18: [7, 78]
};

const mobilePositions = {
  core: [50, 42],
  github: [19, 18],
  projects: [79, 18],
  linkedin: [84, 48],
  email: [72, 75],
  steam: [28, 77],
  discord: [15, 49],

  a1: [33, 10],
  a2: [48, 15],
  a3: [66, 10],
  a4: [69, 29],
  a5: [91, 31],
  a6: [85, 66],
  a7: [55, 88],
  a8: [43, 68],
  a9: [9, 31],
  a10: [32, 31],
  a11: [61, 54],
  a12: [76, 48],
  a13: [39, 53],
  a14: [22, 59],
  a15: [56, 28],
  a16: [50, 4],
  a17: [94, 78],
  a18: [7, 72]
};

const edges = [
  ["e01", "core", "a10"],
  ["e02", "core", "a13"],
  ["e03", "core", "a15"],
  ["e04", "core", "a11"],

  ["e05", "github", "a1"],
  ["e06", "github", "a9"],
  ["e07", "a1", "a10"],
  ["e08", "a1", "a2"],
  ["e09", "a2", "a10"],
  ["e10", "a2", "a15"],

  ["e11", "projects", "a3"],
  ["e12", "projects", "a4"],
  ["e13", "a3", "a15"],
  ["e14", "a3", "a2"],
  ["e15", "a4", "a15"],
  ["e16", "a4", "a12"],

  ["e17", "linkedin", "a5"],
  ["e18", "linkedin", "a12"],
  ["e19", "a5", "a4"],
  ["e20", "a12", "a11"],

  ["e21", "email", "a6"],
  ["e22", "a6", "a7"],
  ["e23", "a6", "a12"],
  ["e24", "a7", "a11"],

  ["e25", "steam", "a8"],
  ["e26", "steam", "a18"],
  ["e27", "a8", "a13"],
  ["e28", "a8", "a14"],
  ["e29", "a18", "a14"],

  ["e30", "discord", "a9"],
  ["e31", "discord", "a14"],
  ["e32", "a9", "a10"],
  ["e33", "a14", "a13"],

  ["e34", "a11", "a12"],
  ["e35", "a11", "a7"],
  ["e36", "a13", "a8"],
  ["e37", "a10", "a14"],
  ["e38", "a15", "a16"],
  ["e39", "a3", "a16"],
  ["e40", "a12", "a17"],
  ["e41", "a6", "a17"]
];

const routes = {
  github: ["e01", "e07", "e05"],
  projects: ["e03", "e13", "e11"],
  linkedin: ["e04", "e20", "e18"],
  email: ["e04", "e24", "e22", "e21"],
  steam: ["e02", "e27", "e25"],
  discord: ["e01", "e32", "e30"]
};

const TAU = Math.PI * 2;
const SAMPLES = 22;
const MAX_PULSES = 64;
const IDLE_HINT = "move through the network";

const canvas = document.querySelector("#graph");
const ctx = canvas.getContext("2d");
const network = document.querySelector("#network");
const linkLayer = document.querySelector("#link-layer");
const hint = document.querySelector("#hint");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const endpointIds = new Set(endpoints.map((endpoint) => endpoint.id));
const endpointEls = new Map();

const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, sx: 0, sy: 0, speed: 0, active: false, last: 0 };
const pulses = [];

let W = 0;
let H = 0;
let minDim = 1;
let time = 0;
let lastFrame = 0;
let frameId = 0;
let hintTimer;
let mainLayer;
let farLayer;
let stars = [];

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function isMobile() {
  return window.innerWidth <= 760;
}

/* ---------- glow sprites ---------- */

function makeSprite(rgb, falloff = 0.22) {
  const size = 128;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const g = sprite.getContext("2d");
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${rgb}, 1)`);
  gradient.addColorStop(falloff, `rgba(${rgb}, 0.32)`);
  gradient.addColorStop(0.55, `rgba(${rgb}, 0.07)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  return sprite;
}

const glowSprite = makeSprite("186, 222, 246");
const pulseSprite = makeSprite("228, 244, 255", 0.12);
const coreSprite = makeSprite("205, 228, 244", 0.3);

function drawSprite(sprite, x, y, size, alpha) {
  if (alpha <= 0.004) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
}

/* ---------- smooth wandering (layered sines) ---------- */

function makeWander() {
  const comps = [];
  for (let i = 0; i < 3; i += 1) {
    comps.push({
      fx: rand(0.025, 0.07) * (i + 1),
      fy: rand(0.025, 0.07) * (i + 1),
      px: rand(0, TAU),
      py: rand(0, TAU),
      a: 1 / ((i + 1.2) * 1.6)
    });
  }
  return comps;
}

function wander(comps, t) {
  let x = 0;
  let y = 0;
  for (const c of comps) {
    x += c.a * Math.sin(t * c.fx * TAU + c.px);
    y += c.a * Math.cos(t * c.fy * TAU + c.py);
  }
  return [x, y];
}

/* ---------- layers ---------- */

function makeNode(id, kind, ax, ay, wamp) {
  const dendrites = [];
  if (kind === "ambient") {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      dendrites.push({
        ang: rand(0, TAU),
        len: rand(7, 20),
        ph: rand(0, TAU),
        fr: rand(0.08, 0.2),
        curl: rand(-0.6, 0.6)
      });
    }
  }

  return {
    id,
    kind,
    ax,
    ay,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    fx: 0,
    fy: 0,
    wander: makeWander(),
    wamp,
    r: kind === "core" ? 3.2 : rand(1.6, 2.5),
    v: 0,
    flash: 0,
    refractory: 0,
    ring: 1,
    breath: rand(0, TAU),
    dendrites,
    edges: []
  };
}

function makeEdge(id, a, b, index) {
  const edge = {
    id,
    a,
    b,
    rest: 1,
    len: 1,
    tension: 1,
    glow: 0,
    route: false,
    bend: (index % 2 === 0 ? 1 : -1) * rand(0.025, 0.075),
    k: rand(0.55, 1.35),
    freq: rand(0.06, 0.18),
    ph: rand(0, TAU),
    ampF: rand(0.6, 1.2),
    bumps: [],
    pts: new Float32Array((SAMPLES + 1) * 2)
  };
  a.edges.push(edge);
  b.edges.push(edge);
  return edge;
}

function createMainLayer() {
  const layer = {
    name: "main",
    parallax: 16,
    push: 1,
    alpha: 1,
    scale: 1,
    branch: 0.44,
    ox: 0,
    oy: 0,
    nodes: new Map(),
    edges: [],
    edgeById: new Map()
  };

  for (const [id, [ax, ay]] of Object.entries(desktopPositions)) {
    const kind = id === "core" ? "core" : endpointIds.has(id) ? "endpoint" : "ambient";
    const wamp = kind === "core" ? 0.004 : kind === "endpoint" ? 0.012 : 0.026;
    layer.nodes.set(id, makeNode(id, kind, ax, ay, wamp));
  }

  edges.forEach(([id, from, to], index) => {
    const edge = makeEdge(id, layer.nodes.get(from), layer.nodes.get(to), index);
    layer.edges.push(edge);
    layer.edgeById.set(id, edge);
  });

  return layer;
}

function createFarLayer() {
  const layer = {
    name: "far",
    parallax: 6,
    push: 0.35,
    alpha: 0.42,
    scale: 0.62,
    branch: 0.5,
    ox: 0,
    oy: 0,
    nodes: new Map(),
    edges: [],
    edgeById: new Map()
  };

  const count = isMobile() ? 22 : 34;
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const node = makeNode(`f${i}`, "ambient", rand(-4, 104), rand(-4, 104), 0.035);
    node.dendrites.length = 0;
    layer.nodes.set(node.id, node);
    list.push(node);
  }

  const seen = new Set();
  list.forEach((node, index) => {
    const nearest = list
      .filter((other) => other !== node)
      .map((other) => [other, Math.hypot(other.ax - node.ax, (other.ay - node.ay) * 0.7)])
      .sort((p, q) => p[1] - q[1])
      .slice(0, 2);

    for (const [other] of nearest) {
      const key = [node.id, other.id].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const edge = makeEdge(key, node, other, index);
      layer.edges.push(edge);
      layer.edgeById.set(key, edge);
    }
  });

  return layer;
}

function createStars() {
  const count = Math.round(clamp((W * H) / 9000, 60, 190));
  stars = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() < 0.9 ? rand(0.3, 0.8) : rand(0.9, 1.4),
    a: rand(0.12, 0.55),
    tw: rand(0.1, 0.5),
    ph: rand(0, TAU),
    depth: rand(0.15, 1)
  }));
}

function syncAnchors() {
  const positions = isMobile() ? mobilePositions : desktopPositions;
  for (const [id, [ax, ay]] of Object.entries(positions)) {
    const node = mainLayer.nodes.get(id);
    node.ax = ax;
    node.ay = ay;
  }

  for (const endpoint of endpoints) {
    endpointEls.get(endpoint.id)?.classList.toggle("flip", positions[endpoint.id][0] > 55);
  }
}

/* ---------- simulation ---------- */

function computeTargets(layer, t) {
  const main = layer === mainLayer;
  const cx = W / 2;
  const cy = main && isMobile() ? H * 0.42 : H / 2;
  const dir = main ? 1 : -1;

  // the whole tissue breathes and stretches, slightly out of phase per axis
  const sx = 1 + 0.024 * Math.sin((t * TAU) / 11) * dir;
  const sy = 1 + 0.024 * Math.sin((t * TAU) / 13.5 + 1.3);
  const rot = (main ? 0.012 : 0.02) * Math.sin((t * TAU) / 23) * dir;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  for (const node of layer.nodes.values()) {
    const dx = ((node.ax / 100) * W - cx) * sx;
    const dy = ((node.ay / 100) * H - cy) * sy;
    const [wx, wy] = wander(node.wander, t);
    const pin = node.kind === "core" ? 0 : 1;

    node.tx = cx + (dx * cos - dy * sin) * pin + wx * node.wamp * minDim + layer.ox;
    node.ty = cy + (dx * sin + dy * cos) * pin + wy * node.wamp * minDim + layer.oy;

    if (node.kind === "endpoint") {
      node.tx = clamp(node.tx, 18, W - 18);
      node.ty = clamp(node.ty, 22, H - 22);
    }
  }

  for (const edge of layer.edges) {
    edge.rest = Math.hypot(edge.b.tx - edge.a.tx, edge.b.ty - edge.a.ty) || 1;
  }
}

function stepLayer(layer, dt) {
  const main = layer === mainLayer;

  for (const node of layer.nodes.values()) {
    const k = node.kind === "core" ? 34 : node.kind === "endpoint" ? 16 : 9;
    node.fx = (node.tx - node.x) * k;
    node.fy = (node.ty - node.y) * k;

    if (pointer.active) {
      const dx = node.x - pointer.x;
      const dy = node.y - pointer.y;
      const d = Math.hypot(dx, dy);
      const radius = main ? 150 : 110;
      if (d < radius && d > 0.5) {
        const s = Math.pow(1 - d / radius, 2) * 900 * layer.push * (node.kind === "ambient" ? 1 : 0.35);
        node.fx += (dx / d) * s;
        node.fy += (dy / d) * s;
      }
    }
  }

  // axons behave like soft elastic fibres
  for (const edge of layer.edges) {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const len = Math.hypot(dx, dy) || 1;
    edge.len = len;
    const f = ((len - edge.rest * edge.tension) / len) * 4.5;
    edge.a.fx += dx * f;
    edge.a.fy += dy * f;
    edge.b.fx -= dx * f;
    edge.b.fy -= dy * f;
    edge.tension += (1 - edge.tension) * (1 - Math.exp(-dt * 1.6));
    edge.glow *= Math.exp(-dt * 2.4);
    edge.bumps.length = 0;
  }

  const damping = Math.exp(-dt * 3.4);
  for (const node of layer.nodes.values()) {
    node.vx = (node.vx + node.fx * dt) * damping;
    node.vy = (node.vy + node.fy * dt) * damping;
    node.x += node.vx * dt;
    node.y += node.vy * dt;

    node.flash *= Math.exp(-dt * 3.2);
    node.v *= Math.exp(-dt * 0.9);
    node.refractory -= dt;
    if (node.ring < 1) node.ring = Math.min(1, node.ring + dt * 1.4);
  }
}

function snapLayer(layer) {
  for (const node of layer.nodes.values()) {
    node.x = node.tx;
    node.y = node.ty;
    node.vx = 0;
    node.vy = 0;
  }
  for (const edge of layer.edges) {
    edge.len = edge.rest;
  }
}

function shapeEdge(edge, t) {
  const { a, b, pts } = edge;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // slack fibres sag and ripple more, taut ones straighten out
  const slack = clamp(edge.rest / len, 0.55, 1.7);
  const loose = slack * slack;
  const bend = edge.bend * len * loose;
  const amp = Math.min(len * 0.04, 12) * edge.ampF * loose;

  for (let i = 0; i <= SAMPLES; i += 1) {
    const s = i / SAMPLES;
    const env = Math.sin(Math.PI * s);
    let off = env * (bend + amp * Math.sin(TAU * edge.k * s - t * edge.freq * TAU + edge.ph));

    for (const bump of edge.bumps) {
      const d = ((s - bump.s) * len) / 16;
      off += bump.amp * env * Math.exp(-d * d);
    }

    pts[i * 2] = a.x + dx * s + nx * off;
    pts[i * 2 + 1] = a.y + dy * s + ny * off;
  }
}

function pointAt(edge, s) {
  const f = clamp(s, 0, 1) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(f));
  const u = f - i;
  const p = edge.pts;
  return [p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * u, p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * u];
}

/* ---------- firing ---------- */

function spawnPulse(layer, edge, dir, options = {}) {
  if (pulses.length >= MAX_PULSES && !options.route) return;

  pulses.push({
    layer,
    edge,
    dir,
    s: 0,
    dur: options.dur ?? clamp(edge.len / rand(170, 300), 0.35, 1.7),
    strength: options.strength ?? rand(0.75, 1),
    chain: options.chain ?? [],
    route: Boolean(options.route)
  });
}

function fire(layer, node, fromEdge = null) {
  if (node.refractory > 0) return;

  node.flash = 1;
  node.v = 0;
  node.refractory = rand(1.1, 2.1);
  node.ring = 0;
  node.vx += rand(-18, 18);
  node.vy += rand(-18, 18);

  if (node.kind === "endpoint") flashEndpoint(node.id);

  for (const edge of node.edges) {
    edge.tension = Math.min(edge.tension, 0.95);
    if (edge === fromEdge) continue;
    if (Math.random() < layer.branch) {
      spawnPulse(layer, edge, edge.a === node ? 1 : -1);
    }
  }
}

function stimulate(layer, node, amount, fromEdge) {
  node.v += amount * rand(0.5, 0.95);
  node.flash = Math.max(node.flash, 0.25);
  if (node.v >= 1) fire(layer, node, fromEdge);
}

function updatePulses(dt) {
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    const p = pulses[i];
    p.s += dt / p.dur;

    const s = p.dir > 0 ? p.s : 1 - p.s;
    p.edge.glow = Math.max(p.edge.glow, p.strength * (p.route ? 0.85 : 0.55));
    p.edge.bumps.push({ s, amp: (p.route ? 3.2 : 2.2) * p.strength * (p.dir > 0 ? 1 : -1) });

    if (p.s < 1) continue;

    pulses.splice(i, 1);
    const node = p.dir > 0 ? p.edge.b : p.edge.a;

    if (p.chain.length) {
      const [next, ...rest] = p.chain;
      node.flash = Math.max(node.flash, 0.85);
      node.ring = 0;
      spawnPulse(p.layer, next.edge, next.dir, { dur: p.dur, strength: p.strength, chain: rest, route: true });
    } else if (p.route) {
      node.flash = 1;
      node.ring = 0;
      if (node.kind === "endpoint") flashEndpoint(node.id);
    } else {
      stimulate(p.layer, node, p.strength, p.edge);
    }
  }
}

function routeChain(id) {
  let current = mainLayer.nodes.get("core");
  return (routes[id] || []).map((edgeId) => {
    const edge = mainLayer.edgeById.get(edgeId);
    const dir = edge.a === current ? 1 : -1;
    current = dir > 0 ? edge.b : edge.a;
    return { edge, dir };
  });
}

function fireRoute(id, hopDuration) {
  const [first, ...rest] = routeChain(id);
  if (!first) return 0;
  const core = mainLayer.nodes.get("core");
  core.flash = 1;
  core.ring = 0;
  spawnPulse(mainLayer, first.edge, first.dir, { dur: hopDuration, strength: 1.25, chain: rest, route: true });
  return (rest.length + 1) * hopDuration;
}

function flashEndpoint(id) {
  const el = endpointEls.get(id);
  if (!el) return;
  el.classList.add("firing");
  clearTimeout(el.firingTimer);
  el.firingTimer = setTimeout(() => el.classList.remove("firing"), 420);
}

let mainTimer = 1;
let farTimer = 0.5;

function spontaneous(dt) {
  mainTimer -= dt;
  farTimer -= dt;

  if (mainTimer <= 0) {
    const ambient = [...mainLayer.nodes.values()].filter((n) => n.kind === "ambient");
    fire(mainLayer, pick(ambient));
    mainTimer = rand(0.8, 2.4);
  }

  if (farTimer <= 0) {
    fire(farLayer, pick([...farLayer.nodes.values()]));
    farTimer = rand(0.5, 1.6);
  }

  // brushing through the tissue excites whatever you touch
  if (pointer.active && pointer.speed > 70) {
    for (const node of mainLayer.nodes.values()) {
      if (node.kind !== "ambient") continue;
      if (Math.hypot(node.x - pointer.x, node.y - pointer.y) < 34) fire(mainLayer, node);
    }
  }
}

/* ---------- drawing ---------- */

function drawStars(t) {
  ctx.fillStyle = "rgb(214, 228, 240)";
  for (const star of stars) {
    const x = (((star.x + t * 0.0012 * star.depth) % 1) * W) - pointer.sx * 4 * star.depth;
    const y = star.y * H - pointer.sy * 4 * star.depth;
    ctx.globalAlpha = star.a * (0.55 + 0.45 * Math.sin(t * star.tw * TAU + star.ph));
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEdges(layer) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const edge of layer.edges) {
    const alpha = layer.alpha * (0.1 + edge.glow * 0.38 + (edge.route ? 0.26 : 0));
    ctx.strokeStyle = `rgba(200, 220, 234, ${alpha.toFixed(3)})`;
    ctx.lineWidth = layer.scale * (0.9 + edge.glow * 0.7 + (edge.route ? 0.4 : 0));

    const p = edge.pts;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (let i = 1; i <= SAMPLES; i += 1) ctx.lineTo(p[i * 2], p[i * 2 + 1]);
    ctx.stroke();
  }
}

function drawDendrites(layer, t) {
  ctx.lineWidth = 0.8;
  for (const node of layer.nodes.values()) {
    if (!node.dendrites.length) continue;
    const alpha = layer.alpha * (0.09 + node.flash * 0.35);
    ctx.strokeStyle = `rgba(200, 220, 234, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    for (const d of node.dendrites) {
      const ang = d.ang + 0.4 * Math.sin(t * d.fr * TAU + d.ph);
      const len = d.len * (1 + node.flash * 0.25);
      const tipX = node.x + Math.cos(ang) * len;
      const tipY = node.y + Math.sin(ang) * len;
      const bend = ang + d.curl + 0.3 * Math.sin(t * d.fr * 1.7 * TAU + d.ph);
      ctx.moveTo(node.x, node.y);
      ctx.quadraticCurveTo(
        node.x + Math.cos(bend) * len * 0.6,
        node.y + Math.sin(bend) * len * 0.6,
        tipX,
        tipY
      );
    }
    ctx.stroke();
  }
}

function drawPulses() {
  ctx.globalCompositeOperation = "lighter";
  for (const p of pulses) {
    const scale = p.layer.scale;
    const alphaScale = p.layer.alpha;
    const fade = Math.min(1, p.s * 6, (1 - p.s) * 6 + 0.35);
    const tail = clamp(46 / p.edge.len, 0.04, 0.4);

    for (let i = 6; i >= 1; i -= 1) {
      const back = p.s - (tail * i) / 6;
      if (back < 0) continue;
      const [x, y] = pointAt(p.edge, p.dir > 0 ? back : 1 - back);
      const k = 1 - i / 7;
      drawSprite(pulseSprite, x, y, (8 + 10 * k) * scale * p.strength, 0.28 * k * fade * alphaScale);
    }

    const [x, y] = pointAt(p.edge, p.dir > 0 ? p.s : 1 - p.s);
    drawSprite(glowSprite, x, y, 34 * scale * p.strength, 0.5 * fade * alphaScale);
    drawSprite(pulseSprite, x, y, 11 * scale * p.strength, 1 * fade * alphaScale);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function drawNodes(layer, t) {
  ctx.globalCompositeOperation = "lighter";
  for (const node of layer.nodes.values()) {
    if (node.kind === "core") {
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.6 + node.breath);
      drawSprite(coreSprite, node.x, node.y, 70 + breathe * 16 + node.flash * 70, 0.22 + breathe * 0.06 + node.flash * 0.6);
    } else {
      const size = (node.kind === "endpoint" ? 26 : 16) + node.flash * 60;
      drawSprite(glowSprite, node.x, node.y, size * layer.scale, layer.alpha * (0.07 + node.v * 0.12 + node.flash * 0.8));
    }

    if (node.ring < 1) {
      const e = 1 - Math.pow(1 - node.ring, 3);
      ctx.globalAlpha = layer.alpha * (1 - node.ring) * 0.32;
      ctx.strokeStyle = "rgb(196, 226, 246)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, (4 + e * 36) * layer.scale, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  for (const node of layer.nodes.values()) {
    if (node.kind === "endpoint") continue;
    const pulse = 1 + 0.12 * Math.sin(t * 0.9 + node.breath);
    const radius = (node.r * pulse + node.flash * 1.5) * layer.scale;
    const base = node.kind === "core" ? 0.75 : 0.32;
    ctx.fillStyle = `rgba(224, 236, 243, ${(layer.alpha * Math.min(1, base + node.flash * 0.65 + node.v * 0.2)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, TAU);
    ctx.fill();
  }
}

function placeEndpoints() {
  for (const endpoint of endpoints) {
    const node = mainLayer.nodes.get(endpoint.id);
    const el = endpointEls.get(endpoint.id);
    el.style.translate = `${node.x.toFixed(1)}px ${node.y.toFixed(1)}px`;
  }
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  drawStars(t);

  for (const layer of [farLayer, mainLayer]) {
    for (const edge of layer.edges) shapeEdge(edge, t);
    drawEdges(layer);
    if (layer === mainLayer) drawDendrites(layer, t);
    drawNodes(layer, t);
  }

  drawPulses();
  placeEndpoints();
}

/* ---------- loop ---------- */

function update(dt) {
  // parallax drifts with the pointer, or wanders slowly on its own
  const idleX = 0.25 * Math.sin((time * TAU) / 29);
  const idleY = 0.25 * Math.cos((time * TAU) / 37);
  const goalX = pointer.active ? pointer.nx : idleX;
  const goalY = pointer.active ? pointer.ny : idleY;
  const ease = 1 - Math.exp(-dt * 1.5);
  pointer.sx += (goalX - pointer.sx) * ease;
  pointer.sy += (goalY - pointer.sy) * ease;
  pointer.speed *= Math.exp(-dt * 6);

  for (const layer of [farLayer, mainLayer]) {
    layer.ox = -pointer.sx * layer.parallax;
    layer.oy = -pointer.sy * layer.parallax;
    computeTargets(layer, time);
    stepLayer(layer, dt);
  }

  updatePulses(dt);
  spontaneous(dt);
}

function frame(now) {
  const dt = Math.min(1 / 30, (now - lastFrame) / 1000 || 1 / 60);
  lastFrame = now;
  time += dt;

  update(dt);
  draw(time);

  frameId = requestAnimationFrame(frame);
}

function renderStill() {
  for (const layer of [farLayer, mainLayer]) {
    computeTargets(layer, 0);
    snapLayer(layer);
  }
  draw(0);
}

function start() {
  cancelAnimationFrame(frameId);
  pulses.length = 0;

  if (reducedMotion.matches) {
    renderStill();
    return;
  }

  lastFrame = performance.now();
  frameId = requestAnimationFrame(frame);
}

function resize() {
  const box = network.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = box.width;
  H = box.height;
  minDim = Math.min(W, H);

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  syncAnchors();
  createStars();

  for (const layer of [farLayer, mainLayer]) {
    computeTargets(layer, time);
    snapLayer(layer);
  }

  if (reducedMotion.matches) draw(0);
}

/* ---------- links & interaction ---------- */

function renderLinks() {
  linkLayer.innerHTML = "";
  endpointEls.clear();

  for (const endpoint of endpoints) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `link-node${endpoint.url ? "" : " unconfigured"}`;
    button.dataset.id = endpoint.id;

    const text = document.createElement("span");
    const label = document.createElement("span");
    const host = document.createElement("span");
    label.className = "label";
    host.className = "host";
    label.textContent = endpoint.label;
    host.textContent = endpoint.host;
    text.append(label, host);
    button.append(text);

    button.addEventListener("mouseenter", () => activateRoute(endpoint.id));
    button.addEventListener("mouseleave", () => deactivateRoute(endpoint.id));
    button.addEventListener("focus", () => activateRoute(endpoint.id));
    button.addEventListener("blur", () => deactivateRoute(endpoint.id));
    button.addEventListener("click", (event) => openEndpoint(endpoint, event));

    endpointEls.set(endpoint.id, button);
    linkLayer.appendChild(button);
  }
}

function setRouteHighlight(id, on) {
  for (const { edge } of routeChain(id)) edge.route = on;
  endpointEls.get(id)?.classList.toggle("active", on);
  if (reducedMotion.matches) draw(0);
}

function activateRoute(id) {
  setRouteHighlight(id, true);
  if (!reducedMotion.matches) fireRoute(id, 0.3);

  const endpoint = endpoints.find((item) => item.id === id);
  setHint(endpoint?.url ? endpoint.host : `${endpoint?.label ?? id} · not connected yet`);
}

function deactivateRoute(id) {
  setRouteHighlight(id, false);
  setHint(IDLE_HINT, false);
}

function setHint(text, flash = true) {
  clearTimeout(hintTimer);
  hint.textContent = text;
  hint.classList.toggle("flash", flash);

  if (flash) {
    hintTimer = setTimeout(() => hint.classList.remove("flash"), 900);
  }
}

function openEndpoint(endpoint, event) {
  if (!endpoint.url) {
    activateRoute(endpoint.id);
    setHint(`${endpoint.label} · endpoint not connected yet`);
    setTimeout(() => deactivateRoute(endpoint.id), 900);
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey) {
    window.open(endpoint.url, "_blank", "noopener,noreferrer");
    return;
  }

  if (reducedMotion.matches) {
    window.location.href = endpoint.url;
    return;
  }

  setRouteHighlight(endpoint.id, true);
  setHint(`routing to ${endpoint.host}`);
  const travel = fireRoute(endpoint.id, 0.17);

  setTimeout(() => {
    window.location.href = endpoint.url;
  }, travel * 1000 + 90);
}

function handlePointer(event) {
  const box = network.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  const now = performance.now();

  if (pointer.active) {
    const elapsed = Math.max(8, now - pointer.last);
    const speed = (Math.hypot(x - pointer.x, y - pointer.y) / elapsed) * 1000;
    pointer.speed = Math.max(pointer.speed * 0.6, speed);
  }

  pointer.x = x;
  pointer.y = y;
  pointer.nx = x / W - 0.5;
  pointer.ny = y / H - 0.5;
  pointer.last = now;
  pointer.active = true;
}

function releasePointer(event) {
  if (event.pointerType === "mouse" && event.type === "pointerup") return;
  pointer.active = false;
  pointer.x = pointer.y = -9999;
}

/* ---------- boot ---------- */

renderLinks();
mainLayer = createMainLayer();
farLayer = createFarLayer();
resize();
start();

// ResizeObserver fires before paint, so the canvas never draws at a stale, stretched size
new ResizeObserver(resize).observe(network);

window.addEventListener("pointermove", handlePointer, { passive: true });
window.addEventListener("pointerdown", handlePointer, { passive: true });
window.addEventListener("pointerup", releasePointer);
window.addEventListener("pointercancel", releasePointer);
document.documentElement.addEventListener("pointerleave", releasePointer);

reducedMotion.addEventListener?.("change", start);

window.addEventListener("pagehide", () => cancelAnimationFrame(frameId));
window.addEventListener("pageshow", (event) => {
  if (event.persisted) start();
});
