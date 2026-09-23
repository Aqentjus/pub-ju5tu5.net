const endpoints = [
  {
    id: "github",
    label: "GitHub",
    host: "github.com/Aqentjus",
    url: "https://github.com/Aqentjus",
    icon: "github"
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    host: "linkedin",
    url: null,
    icon: "linkedin"
  },
  {
    id: "email",
    label: "Email",
    host: "mail",
    url: null,
    icon: "mail"
  },
  {
    id: "projects",
    label: "Projects",
    host: "github.com/Aqentjus?tab=repositories",
    url: "https://github.com/Aqentjus?tab=repositories",
    icon: "box"
  },
  {
    id: "steam",
    label: "Steam",
    host: "steam",
    url: null,
    icon: "game"
  },
  {
    id: "discord",
    label: "Discord",
    host: "discord",
    url: null,
    icon: "chat"
  }
];

const desktopLayout = {
  github: [17, 16],
  linkedin: [79, 15],
  email: [83, 46],
  projects: [74, 78],
  steam: [23, 79],
  discord: [12, 47]
};

const mobileLayout = {
  github: [25, 34],
  linkedin: [75, 34],
  email: [25, 53],
  projects: [75, 53],
  steam: [25, 72],
  discord: [75, 72]
};

const icons = {
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.5 1.4-4.5-2.5-6.3-3m12.6 5v-3.5c0-1 .1-1.4-.5-2 2.9-.3 5.9-1.4 5.9-6.4A5 5 0 0 0 19.4 5a4.6 4.6 0 0 0-.1-3.1S18.2 1.6 15.7 3a13.4 13.4 0 0 0-6.4 0C6.8 1.6 5.7 1.9 5.7 1.9A4.6 4.6 0 0 0 5.6 5a5 5 0 0 0-1.3 4.1c0 5 3 6.1 5.9 6.4-.5.5-.6 1-.5 2V21"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a3 3 0 0 1 6 0v4M11 10v7"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 12.1V21"/></svg>`,
  game: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8a5 5 0 0 1 4.8 6.4l-.9 3a2 2 0 0 1-3.1 1.1L14.5 17h-5l-2.3 1.5a2 2 0 0 1-3.1-1.1l-.9-3A5 5 0 0 1 8 8Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.3-4A8.5 8.5 0 1 1 21 12Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>`
};

const nodesEl = document.querySelector("#nodes");
const routesEl = document.querySelector("#routes");
const topologyEl = document.querySelector(".topology");
const hubEl = document.querySelector("#hub");
const commandEl = document.querySelector("#terminal-command");
const outputEl = document.querySelector("#terminal-output");
const clockEl = document.querySelector("#clock");

function renderNodes() {
  nodesEl.innerHTML = "";

  for (const endpoint of endpoints) {
    const node = document.createElement("button");
    node.className = `node ${endpoint.url ? "" : "unconfigured"}`;
    node.type = "button";
    node.dataset.id = endpoint.id;
    node.setAttribute(
      "aria-label",
      endpoint.url ? `Open ${endpoint.label}` : `${endpoint.label}, link not configured`
    );

    node.innerHTML = `
      <span class="node-head">
        <span class="node-icon">${icons[endpoint.icon]}</span>
        <span class="node-copy">
          <span class="node-title">
            <span>${endpoint.label}</span>
            <span class="node-arrow">→</span>
          </span>
          <span class="node-meta">
            <span class="endpoint-dot"></span>
            <span>${endpoint.url ? endpoint.host : "set endpoint"}</span>
          </span>
        </span>
      </span>
    `;

    node.addEventListener("mouseenter", () => inspect(endpoint));
    node.addEventListener("focus", () => inspect(endpoint));
    node.addEventListener("mouseleave", clearInspect);
    node.addEventListener("blur", clearInspect);
    node.addEventListener("click", (event) => navigate(endpoint, event));

    nodesEl.appendChild(node);
  }

  layoutNodes();
}

function layoutNodes() {
  const layout = window.innerWidth <= 760 ? mobileLayout : desktopLayout;

  for (const [id, point] of Object.entries(layout)) {
    const node = nodesEl.querySelector(`[data-id="${id}"]`);
    if (!node) continue;
    node.style.left = `${point[0]}%`;
    node.style.top = `${point[1]}%`;
  }

  requestAnimationFrame(drawRoutes);
}

function drawRoutes() {
  routesEl.querySelectorAll(".route, .packet").forEach((el) => el.remove());

  const topologyBox = topologyEl.getBoundingClientRect();
  const hubBox = hubEl.getBoundingClientRect();
  const hx = hubBox.left - topologyBox.left + hubBox.width / 2;
  const hy = hubBox.top - topologyBox.top + hubBox.height / 2;

  routesEl.setAttribute("viewBox", `0 0 ${topologyBox.width} ${topologyBox.height}`);

  for (const endpoint of endpoints) {
    const node = nodesEl.querySelector(`[data-id="${endpoint.id}"]`);
    if (!node) continue;

    const box = node.getBoundingClientRect();
    const nx = box.left - topologyBox.left + box.width / 2;
    const ny = box.top - topologyBox.top + box.height / 2;
    const dx = nx - hx;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = `route-${endpoint.id}`;
    path.classList.add("route");
    if (!endpoint.url) path.classList.add("unconfigured");

    const c1x = hx + dx * 0.36;
    const c2x = hx + dx * 0.68;
    path.setAttribute("d", `M ${hx} ${hy} C ${c1x} ${hy}, ${c2x} ${ny}, ${nx} ${ny}`);
    routesEl.appendChild(path);
  }
}

function inspect(endpoint) {
  document.querySelectorAll(".node").forEach((node) => {
    node.classList.toggle("active", node.dataset.id === endpoint.id);
  });

  document.querySelectorAll(".route").forEach((route) => {
    route.classList.toggle("active", route.id === `route-${endpoint.id}`);
  });

  commandEl.textContent = `route ${endpoint.id}`;
  outputEl.textContent = endpoint.url
    ? `justus.net → ${endpoint.host} // destination reachable`
    : `justus.net → ${endpoint.host} // endpoint not configured yet`;
}

function clearInspect() {
  document.querySelectorAll(".node.active").forEach((node) => node.classList.remove("active"));
  document.querySelectorAll(".route.active").forEach((route) => route.classList.remove("active"));
  commandEl.textContent = "route --list";
  outputEl.textContent = `${endpoints.length} endpoints discovered. Hover a node to inspect route.`;
}

function navigate(endpoint, event) {
  inspect(endpoint);

  if (!endpoint.url) {
    commandEl.textContent = `connect ${endpoint.id}`;
    outputEl.textContent = "ERR 404 // endpoint exists in topology but needs its public URL.";
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey) {
    window.open(endpoint.url, "_blank", "noopener,noreferrer");
    return;
  }

  commandEl.textContent = `connect ${endpoint.host}`;
  outputEl.textContent = "TX packet // opening destination…";
  animatePacket(endpoint.id, () => {
    window.location.href = endpoint.url;
  });
}

function animatePacket(id, done) {
  const path = document.querySelector(`#route-${id}`);
  if (!path || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }

  const packet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  packet.setAttribute("r", "4.5");
  packet.classList.add("packet");
  routesEl.appendChild(packet);

  const total = path.getTotalLength();
  const start = performance.now();
  const duration = 430;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const point = path.getPointAtLength(total * eased);

    packet.setAttribute("cx", point.x);
    packet.setAttribute("cy", point.y);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      packet.remove();
      done();
    }
  }

  requestAnimationFrame(frame);
}

function updateClock() {
  clockEl.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutNodes, 80);
});

renderNodes();
updateClock();
setInterval(updateClock, 1000);
