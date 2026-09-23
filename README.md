# pub-ju5tu5.net

A minimalist link hub for Justus.

Instead of a normal link-in-bio list, the page is a quiet neural map: `justus.net` sits in the middle of a small living graph, public destinations are part of the network, and subtle pulses move through the connections.

## Interaction

- Ambient neurons occasionally fire through random multi-hop paths.
- Hovering or focusing a destination reveals the route through the network.
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
- `style.css` — typography, positioning, and neural visual language
- `script.js` — graph topology, routes, ambient firing, and navigation
- `.nojekyll` — keeps static hosting simple
