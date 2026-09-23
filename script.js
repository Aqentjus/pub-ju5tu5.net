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
  github: [18, 18],
  projects: [79, 18],
  linkedin: [86, 48],
  email: [72, 75],
  steam: [28, 77],
  discord: [13, 49],

  a1: [33, 10],
  a2: [48, 15],
  a3: [66, 10],
  a4: [69, 29],
  a5: [92, 31],
  a6: [86, 66],
  a7: [55, 88],
  a8: [43, 68],
  a9: [8, 31],
  a10: [32, 31],
  a11: [61, 54],
  a12: [76, 48],
  a13: [39, 53],
  a14: [22, 59],
  a15: [56, 28],
  a16: [50, 4],
  a17: [95, 78],
  a18: [6, 72]
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

const graph = document.querySelector("#graph");
const network = document.querySelector("#network");
const linkLayer = document.querySelector("#link-layer");
const hint = document.querySelector("#hint");

const edgeEls = new Map();
const ambientNodeEls = new Map();
const endpointEls = new Map();

let positions = desktopPositions;
let resizeTimer;
let ambientTimer;
let hintTimer;
let fireBusy = false;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function renderLinks() {
  linkLayer.innerHTML = "";
  endpointEls.clear();

  for (const endpoint of endpoints) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `link-node ${endpoint.url ? "" : "unconfigured"}`;
    button.dataset.id = endpoint.id;
    button.innerHTML = `
      <span>
        <span class="label">${endpoint.label}</span>
        <span class="host">${endpoint.host}</span>
      </span>
    `;

    button.addEventListener("mouseenter", () => activateRoute(endpoint.id));
    button.addEventListener("mouseleave", () => deactivateRoute(endpoint.id));
    button.addEventListener("focus", () => activateRoute(endpoint.id));
    button.addEventListener("blur", () => deactivateRoute(endpoint.id));
    button.addEventListener("click", (event) => openEndpoint(endpoint, event));

    endpointEls.set(endpoint.id, button);
    linkLayer.appendChild(button);
  }
}

function currentPositions() {
  return window.innerWidth <= 760 ? mobilePositions : desktopPositions;
}

function point(id, width, height) {
  const [x, y] = positions[id];
  return {
    x: (x / 100) * width,
    y: (y / 100) * height
  };
}

function curvePath(from, to, width, height, index) {
  const p1 = point(from, width, height);
  const p2 = point(to, width, height);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.hypot(dx, dy) || 1;

  const nx = -dy / length;
  const ny = dx / length;
  const sign = index % 2 === 0 ? 1 : -1;
  const bend = Math.min(18, length * 0.045) * sign;

  const mx = (p1.x + p2.x) / 2 + nx * bend;
  const my = (p1.y + p2.y) / 2 + ny * bend;

  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

function drawGraph() {
  positions = currentPositions();

  const box = network.getBoundingClientRect();
  const width = box.width;
  const height = box.height;

  graph.innerHTML = "";
  graph.setAttribute("viewBox", `0 0 ${width} ${height}`);
  edgeEls.clear();
  ambientNodeEls.clear();

  const linesGroup = svgEl("g");
  const nodesGroup = svgEl("g");
  const pulsesGroup = svgEl("g", { id: "pulses" });

  edges.forEach(([id, from, to], index) => {
    const path = svgEl("path", {
      id,
      class: "edge",
      d: curvePath(from, to, width, height, index)
    });
    edgeEls.set(id, path);
    linesGroup.appendChild(path);
  });

  Object.keys(positions)
    .filter((id) => id.startsWith("a"))
    .forEach((id) => {
      const p = point(id, width, height);
      const circle = svgEl("circle", {
        class: "ambient-node",
        cx: p.x,
        cy: p.y,
        r: "2.15"
      });
      ambientNodeEls.set(id, circle);
      nodesGroup.appendChild(circle);
    });

  graph.append(linesGroup, nodesGroup, pulsesGroup);

  for (const endpoint of endpoints) {
    const p = point(endpoint.id, width, height);
    const el = endpointEls.get(endpoint.id);
    if (!el) continue;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
  }
}

function activateRoute(id) {
  const route = routes[id] || [];
  const endpoint = endpointEls.get(id);

  endpoint?.classList.add("active");
  route.forEach((edgeId) => edgeEls.get(edgeId)?.classList.add("route-active"));

  if (!reducedMotion.matches) {
    fireRoute(route, 72, 330);
  }

  const endpointData = endpoints.find((item) => item.id === id);
  setHint(endpointData?.url ? endpointData.host : `${endpointData?.label ?? id} · not connected yet`);
}

function deactivateRoute(id) {
  endpointEls.get(id)?.classList.remove("active");
  (routes[id] || []).forEach((edgeId) => edgeEls.get(edgeId)?.classList.remove("route-active"));
  setHint("move through the network", false);
}

function setHint(text, flash = true) {
  clearTimeout(hintTimer);
  hint.textContent = text;
  hint.classList.toggle("flash", flash);

  if (flash) {
    hintTimer = setTimeout(() => hint.classList.remove("flash"), 900);
  }
}

function pulseAlong(edgeId, duration = 360, reverse = false) {
  return new Promise((resolve) => {
    const path = edgeEls.get(edgeId);
    const layer = graph.querySelector("#pulses");

    if (!path || !layer || reducedMotion.matches) {
      resolve();
      return;
    }

    const pulse = svgEl("circle", {
      class: "pulse",
      r: "2.7"
    });

    layer.appendChild(pulse);

    const total = path.getTotalLength();
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const progress = reverse ? 1 - eased : eased;
      const p = path.getPointAtLength(total * progress);

      pulse.setAttribute("cx", p.x);
      pulse.setAttribute("cy", p.y);

      const fadeIn = Math.min(1, t * 5);
      const fadeOut = Math.min(1, (1 - t) * 5);
      pulse.style.opacity = String(Math.min(fadeIn, fadeOut));

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        pulse.remove();
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function fireRoute(route, stagger = 80, duration = 320) {
  route.forEach((edgeId, index) => {
    setTimeout(() => pulseAlong(edgeId, duration), index * stagger);
  });
}

function connectedEdges(nodeId) {
  return edges.filter(([, from, to]) => from === nodeId || to === nodeId);
}

function otherEnd(edge, nodeId) {
  return edge[1] === nodeId ? edge[2] : edge[1];
}

async function ambientFire() {
  if (reducedMotion.matches || fireBusy) {
    scheduleAmbient();
    return;
  }

  fireBusy = true;

  const ambientIds = Object.keys(positions).filter((id) => id.startsWith("a"));
  let current = ambientIds[Math.floor(Math.random() * ambientIds.length)];
  const hopCount = 1 + Math.floor(Math.random() * 3);
  const visited = new Set();

  for (let hop = 0; hop < hopCount; hop += 1) {
    const options = connectedEdges(current).filter(([id]) => !visited.has(id));
    if (!options.length) break;

    const edge = options[Math.floor(Math.random() * options.length)];
    visited.add(edge[0]);

    const reverse = edge[2] === current;
    const next = otherEnd(edge, current);

    await pulseAlong(edge[0], 320 + Math.random() * 180, reverse);

    const neuron = ambientNodeEls.get(next);
    if (neuron) {
      neuron.classList.add("firing");
      setTimeout(() => neuron.classList.remove("firing"), 240);
    }

    current = next;
  }

  fireBusy = false;
  scheduleAmbient();
}

function scheduleAmbient() {
  clearTimeout(ambientTimer);

  if (reducedMotion.matches) return;

  const delay = 1100 + Math.random() * 2400;
  ambientTimer = setTimeout(ambientFire, delay);
}

function openEndpoint(endpoint, event) {
  if (!endpoint.url) {
    setHint(`${endpoint.label} · endpoint not connected yet`);
    activateRoute(endpoint.id);
    setTimeout(() => deactivateRoute(endpoint.id), 900);
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey) {
    window.open(endpoint.url, "_blank", "noopener,noreferrer");
    return;
  }

  const route = routes[endpoint.id] || [];

  if (reducedMotion.matches) {
    window.location.href = endpoint.url;
    return;
  }

  activateRoute(endpoint.id);
  setHint(`routing to ${endpoint.host}`);

  route.forEach((edgeId, index) => {
    setTimeout(() => pulseAlong(edgeId, 300), index * 85);
  });

  const delay = 360 + Math.max(0, route.length - 1) * 85;
  setTimeout(() => {
    window.location.href = endpoint.url;
  }, delay);
}

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawGraph, 90);
}

renderLinks();
drawGraph();
scheduleAmbient();

window.addEventListener("resize", handleResize);
reducedMotion.addEventListener?.("change", () => {
  drawGraph();
  scheduleAmbient();
});
