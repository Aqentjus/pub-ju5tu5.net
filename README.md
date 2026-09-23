# pub-ju5tu5.net

A minimalist link hub for Justus.

Instead of a normal link-in-bio list, the page is a living 3D neural network floating in space. `justus.net` sits at the core of a cloud of a few hundred neurons, and each destination is a hub neuron somewhere in the tissue.

## How it behaves

- **3D cloud** — neurons fill a lumpy, brain-like volume. The camera slowly orbits it, with depth fog, soft near-lens blur and a parallax starfield.
- **Living tissue** — a slow flow field moves through the volume, so neighbouring neurons drift together and axons stretch and sway. A neuron that fires twitches its neighbours toward it.
- **Firing** — neurons charge up, fire and propagate spikes along curved axons, with refractory periods so cascades die out naturally.
- **Plasticity** — axons that carry signals get stronger, unused ones wither and retract, and new ones grow toward nearby neurons. The network slowly rewires itself.
- **Routes** — the path from the core to each hub is recomputed as the network rewires and prefers strong axons. Hovering a link turns the camera toward its hub and fires a warm signal down the route, which strengthens it.
- **Brainwaves** — every ~20 seconds a wave sweeps out from the core across the whole network.

## Interaction

- Drag to turn the cloud, scroll to zoom.
- Click or tap to spark the nearest neuron.
- Move the cursor through the cloud to excite the neurons it passes.
- The index at the bottom is the accessible, keyboard-friendly list of links. Hovering or focusing an item works the same as hovering its floating label.
- Hub labels fade while their hub passes behind the title.
- Unconfigured destinations stay visible but subdued until their public URL is added.
- With `prefers-reduced-motion`, the page renders a still frame and links open immediately.

## Configure links

Edit the `endpoints` array at the top of `script.js`.

```js
{
  id: "github",
  label: "GitHub",
  host: "github.com/Aqentjus",
  url: "https://github.com/Aqentjus"
}
```

Set `url: null` for an endpoint that should remain visible but inactive.

## Run locally

There are no dependencies or build tools.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` — page shell: canvas, title, hub labels and link index
- `style.css` — typography, link positioning, and backdrop
- `script.js` — graph topology, canvas physics and rendering, firing, and navigation
- `.nojekyll` — keeps static hosting simple
