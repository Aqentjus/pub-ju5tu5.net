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
    host: "Linkedin",
    url: "https://www.linkedin.com/in/justusven/"
  },
  {
    id: "X",
    label: "X",
    host: "X",
    url: "https://x.com/justusven"
  },
  {
    id: "Instagram",
    label: "Instagram",
    host: "Instagram",
    url: "https://www.instagram.com/justusven_/"
  },
];

const TAU = Math.PI * 2;
const SEG = 12;
const MAX_SPIKES = 110;
const HOME_PITCH = 0.16;

const canvas = document.querySelector("#graph");
const ctx = canvas.getContext("2d");
const network = document.querySelector("#network");
const linkLayer = document.querySelector("#link-layer");
const indexNav = document.querySelector("#index");
const intro = document.querySelector(".intro");
const hint = document.querySelector("#hint");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");

const view = { W: 0, H: 0, cx: 0, cy: 0, f: 1, portrait: null, title: null };
const cam = {
  yaw: 0.6,
  pitch: HOME_PITCH,
  yawVel: 0,
  pitchVel: 0,
  dist: 2.7,
  targetDist: 2.7,
  spin: 0.03,
  spinScale: 1,
  offYaw: 0,
  offPitch: 0,
  cyaw: 1,
  syaw: 0,
  cp: 1,
  sp: 0
};
const pointer = { x: 0, y: 0, nx: 0, ny: 0, down: false, dragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0, lastT: 0, speed: 0, inside: false };

let shape = { sx: 1.3, sy: 0.82, sz: 1.1 };
let neurons = [];
let axons = [];
let pulses = [];
let stars = [];
let sparks = [];
let core = null;
const hubs = new Map();
const labelEls = new Map();
const indexEls = new Map();
let routes = new Map();
let children = new Map();
let routesDirty = true;
let focusedId = null;

let time = 0;
let lastFrame = 0;
let frameId = 0;
let hintTimer;
let routeTimer = 0;
let spontaneousTimer = 1;
let plasticityTimer = 4;
let waveTimer = 6;

const tmp = new Float32Array(4);

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function randomVector(scale) {
  const u = rand(-1, 1);
  const a = rand(0, TAU);
  const r = Math.sqrt(1 - u * u);
  return [Math.cos(a) * r * scale, u * scale, Math.sin(a) * r * scale];
}

/* ---------- glow sprites ---------- */

function makeSprite(rgb, core = 0.2) {
  const size = 128;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const g = sprite.getContext("2d");
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${rgb}, 1)`);
  gradient.addColorStop(core, `rgba(${rgb}, 0.34)`);
  gradient.addColorStop(0.55, `rgba(${rgb}, 0.06)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  return sprite;
}

const sprites = {
  glow: makeSprite("176, 214, 244"),
  soma: makeSprite("232, 244, 255", 0.1),
  core: makeSprite("206, 228, 246", 0.28),
  warm: makeSprite("255, 222, 188", 0.12),
  wave: makeSprite("160, 232, 255", 0.12)
};

function drawSprite(sprite, x, y, size, alpha) {
  if (alpha <= 0.005 || size <= 0.2) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
}

/* ---------- world generation ---------- */

function makeNeuron(x, y, z, kind) {
  const neuron = {
    i: neurons.length,
    kind,
    bx: x,
    by: y,
    bz: z,
    x,
    y,
    z,
    kx: 0,
    ky: 0,
    kz: 0,
    kvx: 0,
    kvy: 0,
    kvz: 0,
    px: 0,
    py: 0,
    ps: 0,
    pf: 0,
    size: kind === "core" ? 1.8 : kind === "hub" ? 1.35 : rand(0.55, 1.1),
    ph: rand(0, TAU),
    v: 0,
    flash: 0,
    refractory: 0,
    ring: 1,
    endpoint: null,
    axons: []
  };
  neurons.push(neuron);
  return neuron;
}

function distance(a, b) {
  return Math.hypot(a.bx - b.bx, a.by - b.by, a.bz - b.bz);
}

function makeAxon(a, b, state = "live") {
  const len = distance(a, b);
  const axon = {
    a,
    b,
    len,
    state,
    grow: state === "live" ? 1 : 0,
    weight: state === "live" ? rand(0.35, 0.95) : 0.4,
    glow: 0,
    route: false,
    m1: randomVector(len * 0.26),
    m2: randomVector(len * 0.26),
    s1: randomVector(len * 0.12),
    s2: randomVector(len * 0.12),
    freq: rand(0.05, 0.13),
    ph: rand(0, TAU),
    pts: new Float32Array((SEG + 1) * 4)
  };
  a.axons.push(axon);
  b.axons.push(axon);
  axons.push(axon);
  return axon;
}

function connected(a, b) {
  return a.axons.some((axon) => axon.a === b || axon.b === b);
}

function lumpiness(dx, dy, dz) {
  return 0.8 + 0.13 * Math.sin(dx * 3.1 + 0.7) * Math.cos(dy * 2.4 - 0.3) + 0.07 * Math.sin(dz * 4.2 + dx * 1.3);
}

function generate() {
  neurons = [];
  axons = [];
  pulses = [];
  hubs.clear();

  const portrait = view.H > view.W * 1.1;
  shape = portrait ? { sx: 1, sy: 1.65, sz: 1 } : { sx: 1.3, sy: 0.82, sz: 1.1 };

  core = makeNeuron(0, 0, 0, "core");

  endpoints.forEach((endpoint, index) => {
    const az = (index / endpoints.length) * TAU + 0.35;
    const el = (index % 2 ? -1 : 1) * 0.34 + rand(-0.08, 0.08);
    const r = 0.8;
    const hub = makeNeuron(
      Math.cos(el) * Math.sin(az) * r * shape.sx,
      Math.sin(el) * r * shape.sy,
      Math.cos(el) * Math.cos(az) * r * shape.sz,
      "hub"
    );
    hub.endpoint = endpoint;
    hubs.set(endpoint.id, hub);
  });

  const count = Math.min(view.W, view.H) < 560 ? 150 : 240;
  const spacing = count > 200 ? 0.1 : 0.12;
  let tries = 0;

  while (neurons.length < count && tries < count * 80) {
    tries += 1;
    const x = rand(-1, 1);
    const y = rand(-1, 1);
    const z = rand(-1, 1);
    const r = Math.hypot(x, y, z);
    if (r > 1 || r < 0.08 || r > lumpiness(x / r, y / r, z / r)) continue;

    const candidate = { bx: x * shape.sx, by: y * shape.sy, bz: z * shape.sz };
    if (neurons.some((n) => distance(n, candidate) < spacing)) continue;
    makeNeuron(candidate.bx, candidate.by, candidate.bz, "ambient");
  }

  // a minimum spanning tree keeps everything reachable from the core…
  const inTree = new Uint8Array(neurons.length);
  const best = new Float64Array(neurons.length).fill(Infinity);
  const link = new Array(neurons.length).fill(null);
  best[0] = 0;

  for (let step = 0; step < neurons.length; step += 1) {
    let u = -1;
    for (let i = 0; i < neurons.length; i += 1) {
      if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    }
    inTree[u] = 1;
    if (link[u] !== null) makeAxon(neurons[link[u]], neurons[u]);

    for (let i = 0; i < neurons.length; i += 1) {
      if (inTree[i]) continue;
      const d = distance(neurons[u], neurons[i]);
      if (d < best[i]) {
        best[i] = d;
        link[i] = u;
      }
    }
  }

  // …and a few nearest-neighbour links make it a mesh rather than a tree
  for (const n of neurons) {
    const nearest = neurons
      .filter((other) => other !== n)
      .map((other) => [other, distance(n, other)])
      .sort((p, q) => p[1] - q[1])
      .slice(0, 3);

    for (const [other, d] of nearest) {
      if (d < 0.5 && !connected(n, other)) makeAxon(n, other);
    }
  }

  const starCount = Math.round(clamp((view.W * view.H) / 4200, 160, 420));
  stars = Array.from({ length: starCount }, () => {
    const [x, y, z] = randomVector(rand(3.2, 9));
    return { x, y, z, r: Math.random() < 0.92 ? rand(0.4, 0.9) : rand(1, 1.6), a: rand(0.15, 0.6), tw: rand(0.1, 0.5), ph: rand(0, TAU) };
  });

  view.portrait = portrait;
  computeRoutes();
}

/* ---------- routes: cheapest path from the core, favouring strong axons ---------- */

function computeRoutes() {
  const n = neurons.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Array(n).fill(null);
  const done = new Uint8Array(n);
  dist[core.i] = 0;

  for (let step = 0; step < n; step += 1) {
    let u = -1;
    for (let i = 0; i < n; i += 1) {
      if (!done[i] && dist[i] < Infinity && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1) break;
    done[u] = 1;

    for (const axon of neurons[u].axons) {
      if (axon.state !== "live") continue;
      const next = axon.a.i === u ? axon.b : axon.a;
      const cost = dist[u] + axon.len / (0.3 + axon.weight);
      if (cost < dist[next.i]) {
        dist[next.i] = cost;
        prev[next.i] = axon;
      }
    }
  }

  children = new Map();
  for (const neuron of neurons) {
    const axon = prev[neuron.i];
    if (!axon) continue;
    const parent = other(axon, neuron);
    if (!children.has(parent.i)) children.set(parent.i, []);
    children.get(parent.i).push({ axon, dir: axon.a === parent ? 1 : -1 });
  }

  routes = new Map();
  for (const [id, hub] of hubs) {
    const chain = [];
    let current = hub;
    while (prev[current.i]) {
      const axon = prev[current.i];
      const parent = other(axon, current);
      chain.unshift({ axon, dir: axon.a === parent ? 1 : -1 });
      current = parent;
    }
    routes.set(id, chain);
  }

  for (const axon of axons) axon.route = false;
  if (focusedId) for (const { axon } of routes.get(focusedId) || []) axon.route = true;

  routesDirty = false;
}

/* ---------- camera & projection ---------- */

function updateCameraBasis() {
  const yaw = cam.yaw + cam.offYaw;
  const pitch = clamp(cam.pitch + cam.offPitch, -0.7, 0.8);
  cam.cyaw = Math.cos(yaw);
  cam.syaw = Math.sin(yaw);
  cam.cp = Math.cos(pitch);
  cam.sp = Math.sin(pitch);
}

function project(x, y, z, out, o) {
  const x1 = x * cam.cyaw + z * cam.syaw;
  const z1 = -x * cam.syaw + z * cam.cyaw;
  const y2 = y * cam.cp - z1 * cam.sp;
  const z2 = y * cam.sp + z1 * cam.cp;
  const zc = z2 + cam.dist;

  if (zc < 0.3) {
    out[o + 2] = 0;
    out[o + 3] = 0;
    return;
  }

  const s = view.f / zc;
  out[o] = view.cx + x1 * s;
  out[o + 1] = view.cy - y2 * s;
  out[o + 2] = cam.dist / zc;

  // depth fog: near things bright, the far side of the cloud fades into space
  const dn = clamp((zc - (cam.dist - 1.3)) / 2.6, 0, 1);
  out[o + 3] = 0.1 + 0.9 * Math.pow(1 - dn, 1.5);
}

/* ---------- living tissue ---------- */

function displace(n, t) {
  const breath = 1 + 0.035 * Math.sin((t * TAU) / 10);
  const bx = n.bx * breath * (1 + 0.03 * Math.sin((t * TAU) / 13));
  const by = n.by * breath * (1 + 0.03 * Math.sin((t * TAU) / 15 + 1));
  const bz = n.bz * breath;

  // a slow flow field washes through the volume, so neighbours move together
  const amp = n.kind === "core" ? 0 : n.kind === "hub" ? 0.035 : 0.065;
  const fx = Math.sin(by * 2.1 + t * 0.21 + 1.3) + 0.5 * Math.sin(bz * 3.3 - t * 0.17);
  const fy = Math.sin(bz * 1.9 + t * 0.18 + 4.1) + 0.5 * Math.sin(bx * 3.1 + t * 0.23);
  const fz = Math.sin(bx * 2.3 + t * 0.16 + 2.2) + 0.5 * Math.sin(by * 2.9 - t * 0.2);
  const j = n.kind === "core" ? 0 : 0.012;

  n.x = bx + fx * amp + Math.sin(t * 0.9 + n.ph) * j + n.kx;
  n.y = by + fy * amp + Math.sin(t * 0.8 + n.ph * 1.7) * j + n.ky;
  n.z = bz + fz * amp + Math.cos(t * 0.85 + n.ph) * j + n.kz;
}

function stepNeurons(dt) {
  const damping = Math.exp(-dt * 4.5);
  for (const n of neurons) {
    n.kvx = (n.kvx - n.kx * 38 * dt) * damping;
    n.kvy = (n.kvy - n.ky * 38 * dt) * damping;
    n.kvz = (n.kvz - n.kz * 38 * dt) * damping;
    n.kx += n.kvx * dt;
    n.ky += n.kvy * dt;
    n.kz += n.kvz * dt;

    n.flash *= Math.exp(-dt * 3);
    n.v *= Math.exp(-dt * 0.8);
    n.refractory -= dt;
    if (n.ring < 1) n.ring = Math.min(1, n.ring + dt * 1.2);
  }
}

function shapeAxon(axon, t) {
  const { a, b, m1, m2, s1, s2, pts } = axon;
  const w1 = Math.sin(t * axon.freq * TAU + axon.ph);
  const w2 = Math.sin(t * axon.freq * 1.3 * TAU + axon.ph + 1);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;

  const c1x = a.x + dx / 3 + m1[0] + s1[0] * w1;
  const c1y = a.y + dy / 3 + m1[1] + s1[1] * w1;
  const c1z = a.z + dz / 3 + m1[2] + s1[2] * w1;
  const c2x = a.x + (dx * 2) / 3 + m2[0] + s2[0] * w2;
  const c2y = a.y + (dy * 2) / 3 + m2[1] + s2[1] * w2;
  const c2z = a.z + (dz * 2) / 3 + m2[2] + s2[2] * w2;

  for (let i = 0; i <= SEG; i += 1) {
    const s = i / SEG;
    const u = 1 - s;
    const k0 = u * u * u;
    const k1 = 3 * u * u * s;
    const k2 = 3 * u * s * s;
    const k3 = s * s * s;
    project(
      k0 * a.x + k1 * c1x + k2 * c2x + k3 * b.x,
      k0 * a.y + k1 * c1y + k2 * c2y + k3 * b.y,
      k0 * a.z + k1 * c1z + k2 * c2z + k3 * b.z,
      pts,
      i * 4
    );
  }
}

function samplePoints(pts, s, out) {
  const f = clamp(s, 0, 1) * SEG;
  const i = Math.min(SEG - 1, Math.floor(f));
  const u = f - i;
  for (let k = 0; k < 4; k += 1) out[k] = pts[i * 4 + k] + (pts[i * 4 + 4 + k] - pts[i * 4 + k]) * u;
  return out;
}

/* ---------- plasticity: axons strengthen, wither, and regrow ---------- */

function reachesAll(without) {
  const seen = new Uint8Array(neurons.length);
  const stack = [core];
  seen[core.i] = 1;
  let count = 1;
  while (stack.length) {
    const n = stack.pop();
    for (const axon of n.axons) {
      if (axon === without || axon.state !== "live") continue;
      const next = other(axon, n);
      if (!seen[next.i]) {
        seen[next.i] = 1;
        count += 1;
        stack.push(next);
      }
    }
  }
  return count === neurons.length;
}

function rewire() {
  const weak = axons.filter((axon) => axon.state === "live" && axon.weight < 0.5 && !axon.route);
  for (let attempt = 0; attempt < 8 && weak.length; attempt += 1) {
    const axon = pick(weak);
    if (reachesAll(axon)) {
      axon.state = "dying";
      routesDirty = true;
      break;
    }
  }

  const seeds = neurons.filter((n) => n.kind !== "core" && n.axons.length < 4);
  for (let attempt = 0; attempt < 6 && seeds.length; attempt += 1) {
    const from = pick(seeds);
    const options = neurons
      .filter((n) => n !== from && n.kind !== "core" && !connected(from, n))
      .map((n) => [n, distance(from, n)])
      .filter(([, d]) => d < 0.48)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 3);
    if (!options.length) continue;
    makeAxon(from, pick(options)[0], "growing");
    break;
  }
}

function stepAxons(dt) {
  for (let i = axons.length - 1; i >= 0; i -= 1) {
    const axon = axons[i];
    axon.glow *= Math.exp(-dt * 2.2);
    axon.weight += (0.42 - axon.weight) * dt * 0.012;

    if (axon.state === "growing") {
      axon.grow += dt / 3.5;
      if (axon.grow >= 1) {
        axon.grow = 1;
        axon.state = "live";
        routesDirty = true;
      }
    } else if (axon.state === "dying") {
      axon.grow -= dt / 2.6;
      if (axon.grow <= 0) {
        axons.splice(i, 1);
        axon.a.axons.splice(axon.a.axons.indexOf(axon), 1);
        axon.b.axons.splice(axon.b.axons.indexOf(axon), 1);
        pulses = pulses.filter((p) => p.axon !== axon);
      }
    }
  }
}

/* ---------- firing ---------- */

function other(axon, n) {
  return axon.a === n ? axon.b : axon.a;
}

function spawnPulse(axon, dir, kind, options = {}) {
  if (kind === "spike" && pulses.length >= MAX_SPIKES) return;
  pulses.push({
    axon,
    dir,
    kind,
    s: 0,
    dur: options.dur ?? clamp(axon.len * rand(1.4, 2.4), 0.25, 1.4),
    strength: options.strength ?? rand(0.75, 1),
    chain: options.chain ?? []
  });
}

function kickNeighbours(n, force) {
  for (const axon of n.axons) {
    const o = other(axon, n);
    o.kvx += (n.x - o.x) * force;
    o.kvy += (n.y - o.y) * force;
    o.kvz += (n.z - o.z) * force;
  }
}

function fire(n, from = null, branch = 0.46) {
  if (n.refractory > 0) return;
  n.flash = 1;
  n.v = 0;
  n.refractory = rand(1.2, 2.2);
  n.ring = 0;
  kickNeighbours(n, 0.5);

  if (n.kind === "hub") flashLabel(n.endpoint.id);

  for (const axon of n.axons) {
    if (axon === from || axon.state !== "live") continue;
    if (Math.random() < branch) spawnPulse(axon, axon.a === n ? 1 : -1, "spike");
  }
}

function stimulate(n, amount, from) {
  n.v += amount * rand(0.5, 0.95);
  n.flash = Math.max(n.flash, 0.3);
  if (n.v >= 1) fire(n, from);
}

function waveDuration(axon) {
  return clamp(axon.len * 0.55, 0.12, 0.45);
}

function stepPulses(dt) {
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    const p = pulses[i];
    p.s += dt / p.dur;
    p.axon.glow = Math.max(p.axon.glow, p.kind === "spike" ? 0.55 * p.strength : 0.9);
    if (p.s < 1) continue;

    pulses.splice(i, 1);
    const n = p.dir > 0 ? p.axon.b : p.axon.a;
    p.axon.weight = Math.min(1.8, p.axon.weight + (p.kind === "route" ? 0.1 : 0.05));

    if (p.kind === "route") {
      n.flash = Math.max(n.flash, 0.9);
      n.ring = 0;
      kickNeighbours(n, 0.3);
      const [next, ...rest] = p.chain;
      if (next) {
        spawnPulse(next.axon, next.dir, "route", { dur: p.dur, strength: p.strength, chain: rest });
      } else if (n.kind === "hub") {
        flashLabel(n.endpoint.id);
        kickNeighbours(n, 0.8);
      }
    } else if (p.kind === "wave") {
      n.flash = Math.max(n.flash, 0.85);
      if (n.kind === "hub" || Math.random() < 0.2) n.ring = 0;
      if (n.kind === "hub") flashLabel(n.endpoint.id);
      for (const child of children.get(n.i) || []) {
        spawnPulse(child.axon, child.dir, "wave", { dur: waveDuration(child.axon), strength: 0.9 });
      }
    } else {
      stimulate(n, p.strength, p.axon);
    }
  }
}

function launchWave() {
  core.flash = 1;
  core.ring = 0;
  kickNeighbours(core, 0.6);
  for (const child of children.get(core.i) || []) {
    spawnPulse(child.axon, child.dir, "wave", { dur: waveDuration(child.axon), strength: 0.9 });
  }
  intro.classList.add("wave");
  setTimeout(() => intro.classList.remove("wave"), 1400);
}

function fireRoute(id, hop) {
  const [first, ...rest] = routes.get(id) || [];
  if (!first) return 0;
  core.flash = 1;
  core.ring = 0;
  spawnPulse(first.axon, first.dir, "route", { dur: hop, strength: 1.2, chain: rest });
  return (rest.length + 1) * hop;
}

function spark(x, y) {
  sparks.push({ x, y, t: 0 });
  let best = null;
  let bestD = 90;
  for (const n of neurons) {
    if (n.pf < 0.2) continue;
    const d = Math.hypot(n.px - x, n.py - y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  if (!best) return;
  best.refractory = 0;
  fire(best, null, 0.9);
  kickNeighbours(best, 1.2);
  for (const axon of best.axons) {
    const o = other(axon, best);
    setTimeout(() => stimulate(o, 1.3, axon), 180);
  }
}

/* ---------- drawing ---------- */

function drawStars() {
  ctx.fillStyle = "rgb(214, 228, 240)";
  for (const star of stars) {
    project(star.x, star.y, star.z, tmp, 0);
    if (!tmp[2]) continue;
    ctx.globalAlpha = star.a * (0.55 + 0.45 * Math.sin(time * star.tw * TAU + star.ph));
    const r = star.r * clamp(tmp[2] * 2.2, 0.5, 1.4);
    ctx.fillRect(tmp[0] - r / 2, tmp[1] - r / 2, r, r);
  }
  ctx.globalAlpha = 1;
}

function tracePolyline(path, pts, upTo) {
  path.moveTo(pts[0], pts[1]);
  const whole = Math.floor(upTo * SEG);
  for (let i = 1; i <= whole; i += 1) path.lineTo(pts[i * 4], pts[i * 4 + 1]);
  if (upTo < 1) {
    samplePoints(pts, upTo, tmp);
    path.lineTo(tmp[0], tmp[1]);
  }
}

function axonDepth(axon) {
  const p = axon.pts;
  const end = SEG * 4;
  return [(p[2] + p[end + 2]) / 2, (p[3] + p[end + 3]) / 2];
}

function drawAxons() {
  const buckets = new Map();

  for (const axon of axons) {
    if (axon.grow <= 0) continue;
    const [scale, fog] = axonDepth(axon);
    if (!fog) continue;
    const alpha = (0.06 + 0.08 * axon.weight) * fog;
    const width = clamp((0.4 + 0.55 * axon.weight) * scale, 0.3, 2.6);
    const key = Math.round(alpha * 80) * 100 + Math.round(width * 4);
    if (!buckets.has(key)) buckets.set(key, new Path2D());
    tracePolyline(buckets.get(key), axon.pts, axon.grow);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [key, path] of buckets) {
    ctx.strokeStyle = `rgba(186, 212, 234, ${(Math.floor(key / 100) / 80).toFixed(3)})`;
    ctx.lineWidth = (key % 100) / 4;
    ctx.stroke(path);
  }

  // signals light up the fibres they travel through
  ctx.globalCompositeOperation = "lighter";
  for (const axon of axons) {
    const glow = Math.max(axon.glow, axon.route ? 0.4 : 0);
    if (glow < 0.04 || axon.grow <= 0) continue;
    const [scale, fog] = axonDepth(axon);
    const path = new Path2D();
    tracePolyline(path, axon.pts, axon.grow);
    ctx.strokeStyle = axon.route
      ? `rgba(255, 214, 176, ${(glow * 0.45 * fog).toFixed(3)})`
      : `rgba(170, 214, 248, ${(glow * 0.5 * fog).toFixed(3)})`;
    ctx.lineWidth = (0.8 + glow * 1.6) * scale;
    ctx.stroke(path);
  }

  // growth cones feel their way forward
  for (const axon of axons) {
    if (axon.state === "live") continue;
    samplePoints(axon.pts, axon.grow, tmp);
    if (!tmp[3]) continue;
    drawSprite(sprites.wave, tmp[0], tmp[1], 16 * tmp[2], 0.55 * tmp[3]);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function drawPulses() {
  ctx.globalCompositeOperation = "lighter";
  for (const p of pulses) {
    const sprite = p.kind === "route" ? sprites.warm : p.kind === "wave" ? sprites.wave : sprites.soma;
    const fade = Math.min(1, p.s * 6, (1 - p.s) * 6 + 0.4);
    const tail = clamp(0.09 / p.axon.len, 0.05, 0.45);

    for (let i = 6; i >= 1; i -= 1) {
      const back = p.s - (tail * i) / 6;
      if (back < 0) continue;
      samplePoints(p.axon.pts, p.dir > 0 ? back : 1 - back, tmp);
      if (!tmp[3]) continue;
      const k = 1 - i / 7;
      drawSprite(sprite, tmp[0], tmp[1], (5 + 8 * k) * tmp[2] * p.strength, 0.3 * k * fade * tmp[3]);
    }

    samplePoints(p.axon.pts, p.dir > 0 ? p.s : 1 - p.s, tmp);
    if (!tmp[3]) continue;
    drawSprite(sprites.glow, tmp[0], tmp[1], 30 * tmp[2] * p.strength, 0.5 * fade * tmp[3]);
    drawSprite(sprite, tmp[0], tmp[1], 10 * tmp[2] * p.strength, fade * tmp[3]);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function drawNeurons() {
  ctx.globalCompositeOperation = "lighter";
  for (const n of neurons) {
    if (!n.pf) continue;
    const s = n.ps;
    // neurons drifting close to the lens go soft, like a shallow depth of field
    const blur = clamp((s - 1.25) * 2.2, 0, 1);

    if (n.kind === "core") {
      const breathe = 0.5 + 0.5 * Math.sin(time * 0.6);
      drawSprite(sprites.core, n.px, n.py, (80 + breathe * 18 + n.flash * 80) * s, 0.24 + breathe * 0.06 + n.flash * 0.6);
    } else {
      const halo = (n.kind === "hub" ? 34 : 12) + n.flash * 44;
      drawSprite(sprites.glow, n.px, n.py, halo * s, n.pf * (0.08 + n.v * 0.12 + n.flash * 0.75 + (n.kind === "hub" ? 0.14 : 0)));
    }

    const soma = (4.2 * n.size + n.flash * 4) * s * (1 + blur * 1.6);
    drawSprite(sprites.soma, n.px, n.py, soma, n.pf * (0.5 + n.flash * 0.5 + n.v * 0.2) * (1 - blur * 0.55));

    if (n.ring < 1) {
      const e = 1 - Math.pow(1 - n.ring, 3);
      ctx.globalAlpha = n.pf * (1 - n.ring) * 0.3;
      ctx.strokeStyle = "rgb(190, 226, 250)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(n.px, n.py, (3 + e * 34) * s, 0, TAU);
      ctx.stroke();
    }
  }

  for (const spark of sparks) {
    const e = 1 - Math.pow(1 - spark.t, 3);
    ctx.globalAlpha = (1 - spark.t) * 0.4;
    ctx.strokeStyle = "rgb(200, 230, 250)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 6 + e * 70, 0, TAU);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function placeLabels() {
  for (const [id, hub] of hubs) {
    const el = labelEls.get(id);
    const x = clamp(hub.px, 14, view.W - 14);
    const y = clamp(hub.py, 20, view.H - 20);
    el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;

    const t = view.title;
    const behindTitle = x > t.left && x < t.right && y > t.top && y < t.bottom;
    const opacity = hub.pf ? clamp(0.2 + hub.pf * 0.9, 0.2, 1) * (behindTitle ? 0.12 : 1) : 0;
    if (el._hidden !== behindTitle) {
      el._hidden = behindTitle;
      el.classList.toggle("tucked", behindTitle);
    }
    if (Math.abs((el._opacity ?? -1) - opacity) > 0.02) {
      el._opacity = opacity;
      el.style.opacity = opacity.toFixed(2);
    }

    const flip = x > view.cx;
    if (el._flip !== flip) {
      el._flip = flip;
      el.classList.toggle("flip", flip);
    }
  }
}

function render() {
  updateCameraBasis();

  for (const n of neurons) {
    displace(n, time);
    project(n.x, n.y, n.z, tmp, 0);
    n.px = tmp[0];
    n.py = tmp[1];
    n.ps = tmp[2];
    n.pf = tmp[3];
  }
  for (const axon of axons) shapeAxon(axon, time);

  ctx.clearRect(0, 0, view.W, view.H);
  drawStars();
  drawAxons();
  drawPulses();
  drawNeurons();
  placeLabels();
}

/* ---------- loop ---------- */

// turn the camera so a hub sits front-left or front-right, clear of the title
function focusYawFor(hub) {
  const phi = Math.atan2(hub.bx, hub.bz);
  const side = Math.sin(phi + cam.yaw) >= 0 ? -1 : 1;
  return cam.yaw + wrapAngle(Math.PI + side * 0.95 - phi - cam.yaw);
}

function stepCamera(dt) {
  const busy = focusedId !== null || pointer.dragging;
  cam.spinScale += ((busy ? 0 : 1) - cam.spinScale) * (1 - Math.exp(-dt * 1.5));

  if (!pointer.dragging) {
    cam.yaw += cam.yawVel * dt;
    cam.pitch += cam.pitchVel * dt;
    cam.yawVel *= Math.exp(-dt * 1.8);
    cam.pitchVel *= Math.exp(-dt * 2.4);
    cam.pitch += (HOME_PITCH - cam.pitch) * (1 - Math.exp(-dt * 0.35));
  }
  cam.yaw += cam.spin * cam.spinScale * dt;

  if (focusedId) {
    const target = focusYawFor(hubs.get(focusedId));
    cam.yaw += (target - cam.yaw) * (1 - Math.exp(-dt * 2));
  }

  const parallax = !coarsePointer.matches && pointer.inside && !pointer.dragging;
  const ease = 1 - Math.exp(-dt * 1.6);
  cam.offYaw += ((parallax ? pointer.nx * 0.16 : 0) - cam.offYaw) * ease;
  cam.offPitch += ((parallax ? pointer.ny * 0.1 : 0) - cam.offPitch) * ease;
  cam.dist += (cam.targetDist - cam.dist) * (1 - Math.exp(-dt * 3));
}

function update(dt) {
  stepCamera(dt);
  stepNeurons(dt);
  stepAxons(dt);
  stepPulses(dt);

  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    sparks[i].t += dt * 1.3;
    if (sparks[i].t >= 1) sparks.splice(i, 1);
  }

  spontaneousTimer -= dt;
  if (spontaneousTimer <= 0) {
    fire(pick(neurons));
    spontaneousTimer = rand(0.12, 0.55);
  }

  plasticityTimer -= dt;
  if (plasticityTimer <= 0) {
    rewire();
    plasticityTimer = rand(2.5, 5);
  }

  waveTimer -= dt;
  if (waveTimer <= 0) {
    launchWave();
    waveTimer = rand(17, 28);
  }

  routeTimer -= dt;
  if (routesDirty || routeTimer <= 0) {
    computeRoutes();
    routeTimer = 1.5;
  }

  // brushing through the cloud excites whatever passes under the cursor
  if (pointer.inside && !pointer.dragging && pointer.speed > 80) {
    for (const n of neurons) {
      if (n.pf > 0.35 && Math.hypot(n.px - pointer.x, n.py - pointer.y) < 26 * n.ps) fire(n);
    }
  }
  pointer.speed *= Math.exp(-dt * 6);
}

function frame(now) {
  const dt = clamp((now - lastFrame) / 1000, 0, 1 / 30);
  lastFrame = now;
  time += dt;
  update(dt);
  render();
  frameId = requestAnimationFrame(frame);
}

function start() {
  cancelAnimationFrame(frameId);
  pulses = [];
  if (reducedMotion.matches) {
    render();
    return;
  }
  lastFrame = performance.now();
  frameId = requestAnimationFrame(frame);
}

function resize() {
  const box = network.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.W = box.width;
  view.H = box.height;
  view.cx = view.W / 2;
  view.cy = view.H / 2;

  canvas.width = Math.round(view.W * dpr);
  canvas.height = Math.round(view.H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if ((view.H > view.W * 1.1) !== view.portrait) generate();

  const title = intro.getBoundingClientRect();
  view.title = {
    left: title.left - box.left - 40,
    right: title.right - box.left + 40,
    top: title.top - box.top - 16,
    bottom: title.bottom - box.top + 16
  };

  // fit the cloud's widest extent into the viewport at the orbit distance
  view.f = Math.min((view.W / (2 * shape.sx)) * 2.7, (view.H / (2 * shape.sy)) * 2.7 * 0.92);

  render();
}

/* ---------- links ---------- */

function buildLinks() {
  for (const endpoint of endpoints) {
    const tag = endpoint.url ? "a" : "button";

    // floating labels ride along with their hub; the index below is the accessible list
    const label = document.createElement(tag);
    label.className = `link-node${endpoint.url ? "" : " unconfigured"}`;
    label.tabIndex = -1;
    label.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    const name = document.createElement("span");
    const host = document.createElement("span");
    name.className = "label";
    host.className = "host";
    name.textContent = endpoint.label;
    host.textContent = endpoint.host;
    text.append(name, host);
    label.append(text);

    const item = document.createElement(tag);
    item.className = `index-item${endpoint.url ? "" : " unconfigured"}`;
    item.textContent = endpoint.label.toLowerCase();
    if (!endpoint.url) item.setAttribute("aria-label", `${endpoint.label} (not connected yet)`);

    for (const el of [label, item]) {
      if (endpoint.url) el.href = endpoint.url;
      else el.type = "button";
      el.addEventListener("mouseenter", () => focusHub(endpoint.id));
      el.addEventListener("mouseleave", () => blurHub(endpoint.id));
      el.addEventListener("focus", () => focusHub(endpoint.id));
      el.addEventListener("blur", () => blurHub(endpoint.id));
      el.addEventListener("click", (event) => openEndpoint(endpoint, event));
    }

    labelEls.set(endpoint.id, label);
    indexEls.set(endpoint.id, item);
    linkLayer.append(label);
    indexNav.append(item);
  }
}

function flashLabel(id) {
  const el = labelEls.get(id);
  if (!el) return;
  el.classList.add("firing");
  clearTimeout(el._firing);
  el._firing = setTimeout(() => el.classList.remove("firing"), 450);
}

function focusHub(id) {
  if (focusedId === id) return;
  if (focusedId) blurHub(focusedId);
  focusedId = id;
  for (const { axon } of routes.get(id) || []) axon.route = true;
  labelEls.get(id)?.classList.add("active");
  indexEls.get(id)?.classList.add("active");

  if (reducedMotion.matches) render();
  else fireRoute(id, 0.15);

  const endpoint = endpoints.find((item) => item.id === id);
  setHint(endpoint.url ? endpoint.host : `${endpoint.label} · not connected yet`);
}

function blurHub(id) {
  if (focusedId !== id) return;
  focusedId = null;
  for (const axon of axons) axon.route = false;
  labelEls.get(id)?.classList.remove("active");
  indexEls.get(id)?.classList.remove("active");
  setHint(idleHint(), false);
  if (reducedMotion.matches) render();
}

function openEndpoint(endpoint, event) {
  if (!endpoint.url) {
    event.preventDefault();
    focusHub(endpoint.id);
    return;
  }

  // modified clicks open a new tab the normal way
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (reducedMotion.matches) return;

  event.preventDefault();
  focusHub(endpoint.id);
  setHint(`routing to ${endpoint.host}`);
  const travel = fireRoute(endpoint.id, 0.07);
  setTimeout(() => {
    window.location.href = endpoint.url;
  }, Math.min(900, travel * 1000 + 120));
}

function idleHint() {
  return coarsePointer.matches ? "drag to turn · tap to spark" : "drag to turn · click to spark";
}

function setHint(text, flash = true) {
  clearTimeout(hintTimer);
  hint.textContent = text;
  hint.classList.toggle("flash", flash);
  if (flash) hintTimer = setTimeout(() => hint.classList.remove("flash"), 900);
}

/* ---------- pointer ---------- */

function localPoint(event) {
  const box = network.getBoundingClientRect();
  return [event.clientX - box.left, event.clientY - box.top];
}

function onPointerDown(event) {
  if (event.target.closest(".link-node, .index") || event.button > 0) return;
  const [x, y] = localPoint(event);
  Object.assign(pointer, { down: true, dragging: false, startX: x, startY: y, lastX: x, lastY: y, lastT: performance.now() });
}

function onPointerMove(event) {
  const [x, y] = localPoint(event);
  const now = performance.now();
  const elapsed = Math.max(8, now - pointer.lastT);
  const dx = x - pointer.lastX;
  const dy = y - pointer.lastY;

  if (pointer.down) {
    if (!pointer.dragging && Math.hypot(x - pointer.startX, y - pointer.startY) > 6) pointer.dragging = true;
    if (pointer.dragging) {
      cam.yaw += dx * 0.0055;
      cam.pitch = clamp(cam.pitch + dy * 0.004, -0.6, 0.75);
      cam.yawVel = cam.yawVel * 0.5 + ((dx * 0.0055) / elapsed) * 500;
      cam.pitchVel = cam.pitchVel * 0.5 + ((dy * 0.004) / elapsed) * 500;
      if (reducedMotion.matches) render();
    }
  } else if (event.pointerType === "mouse") {
    pointer.speed = Math.max(pointer.speed * 0.6, (Math.hypot(dx, dy) / elapsed) * 1000);
  }

  pointer.x = x;
  pointer.y = y;
  pointer.nx = x / view.W - 0.5;
  pointer.ny = y / view.H - 0.5;
  pointer.lastX = x;
  pointer.lastY = y;
  pointer.lastT = now;
  pointer.inside = event.pointerType === "mouse" || pointer.down;
}

function onPointerUp(event) {
  if (pointer.down && !pointer.dragging && !reducedMotion.matches) {
    const [x, y] = localPoint(event);
    spark(x, y);
  }
  pointer.down = false;
  pointer.dragging = false;
  if (event.pointerType !== "mouse") pointer.inside = false;
}

function onWheel(event) {
  event.preventDefault();
  cam.targetDist = clamp(cam.targetDist + event.deltaY * 0.0016, 1.8, 3.8);
  if (reducedMotion.matches) {
    cam.dist = cam.targetDist;
    render();
  }
}

/* ---------- boot ---------- */

buildLinks();
setHint(idleHint(), false);
resize();
new ResizeObserver(resize).observe(network);
start();

network.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
document.documentElement.addEventListener("pointerleave", () => {
  pointer.inside = false;
});
network.addEventListener("wheel", onWheel, { passive: false });

reducedMotion.addEventListener?.("change", start);
window.addEventListener("pagehide", () => cancelAnimationFrame(frameId));
window.addEventListener("pageshow", (event) => {
  if (event.persisted) start();
});
