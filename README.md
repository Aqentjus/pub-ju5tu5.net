# pub-ju5tu5.net

A single public identity gateway for Justus: one URL that routes to every public profile and project endpoint.

## Concept

The page is intentionally not a generic link-in-bio list. It behaves like a tiny network topology:

- `justus.net` is the central identity router.
- Public profiles are endpoints.
- Hovering an endpoint highlights its route.
- Clicking a configured endpoint sends an animated packet before navigating.
- The route console shows the selected destination and state.
- The layout collapses into a mobile topology instead of a plain button stack.

## Configure links

All destinations live at the top of `script.js` in the `endpoints` array.

A configured endpoint:

```js
{
  id: "github",
  label: "GitHub",
  host: "github.com/Aqentjus",
  url: "https://github.com/Aqentjus",
  icon: "github"
}
```

An endpoint with `url: null` remains visible in the topology but reports that it is not configured.

## Run locally

No build step or package manager is required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` — semantic page shell
- `style.css` — responsive network/terminal UI
- `script.js` — endpoints, topology paths, packet animation, terminal behavior

## Hosting

This is a static site and can be hosted directly by GitHub Pages, Cloudflare Pages, Netlify, nginx, or any other static web server.
