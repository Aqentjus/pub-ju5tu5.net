# pub-ju5tu5.net

A minimalist link hub for Justus.

Instead of a normal link-in-bio list, the page is a living neural network floating in space: `justus.net` sits at the core, public destinations are neurons in the tissue, and signals fire and cascade through soft, stretching axons.

## Interaction

- Neurons wander on layered sine drift while the whole network slowly breathes, stretches and rotates.
- Axons are elastic springs: they ripple when slack, straighten when taut, and bulge as a signal passes.
- Neurons charge up, fire, and propagate pulses to neighbours, with refractory periods so cascades die out naturally.
- A starfield and a dim, distant second network give depth, with parallax following the pointer.
- Moving the pointer through the network pushes neurons aside and makes them fire.
- Hovering or focusing a destination fires a signal from the core along its route.
- Clicking a configured destination sends a final pulse through its route before opening it.
- Unconfigured destinations stay visible but subdued until their public URL is added.
- Motion respects `prefers-reduced-motion`.

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

- `index.html` — minimal page shell
- `style.css` — typography, link positioning, and backdrop
- `script.js` — graph topology, canvas physics and rendering, firing, and navigation
- `.nojekyll` — keeps static hosting simple
