# Duke Smith — Portfolio

Personal portfolio site. The hero is a real-time orbital tracker: a D3-geo
globe with a live satellite ground track propagated from a published TLE via
SGP4 (`satellite.js`). Telemetry, ground-station look-angles, and the day/night
terminator are all computed, not faked.

## Stack

- [Vite](https://vitejs.dev/) — dev server & build
- [d3-geo](https://github.com/d3/d3-geo) — orthographic projection & paths
- [topojson-client](https://github.com/topojson/topojson-client) + [world-atlas](https://github.com/topojson/world-atlas) — coastlines
- [satellite.js](https://github.com/shashwatak/satellite-js) — SGP4 orbit propagation
- Type: [Overpass](https://fonts.google.com/specimen/Overpass) (UI) · [B612 Mono](https://fonts.google.com/specimen/B612+Mono) (data)

## Develop

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Structure

```
index.html          Entry markup
src/
  main.js           Boot + wiring
  config.js         Projects, TLE, ground station — edit content here
  globe.js          Globe render class (D3-geo + SGP4)
  astro.js          Solar/terminator math + formatting helpers
  projects.js       Project switcher UI
  styles.css        Styles
vite.config.js      Build config (relative base for static hosting)
```

## Customizing

- **Content** (projects, name, ground station): `src/config.js`
- **Tracked object**: replace the `TLE` in `src/config.js` with a fresh
  two-line element set from [CelesTrak](https://celestrak.org). TLEs go stale;
  the ground-track shape stays correct regardless.
