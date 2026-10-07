Hero banners (animated WebP, four times of day per theme).

- `solar.js` (Space): Earth from orbit with real Blue Marble, night-lights and cloud maps (NASA, public domain, via the `three-globe` npm package: `example/img/earth-blue-marble.jpg`, `earth-night.jpg`, `earth-water.png`, `clouds.png` converted to a single channel `clouds_L.png`), Moon, Mars, Jupiter and Saturn drawn procedurally.
- `leafhero2.js` (Leaf): a ginkgo leaf, dew drops and a ladybug in a depth-of-field garden.
- Serve this folder with the textures in `tex/` and `three` in `node_modules`, then `node frames2.mjs "render_space3.html?phase=dawn" frames 1200 600 15 16` (or render_leaf3.html) and `python enc.py frames out.webp 15 60 4`.
- Copy the four results to `assets/<theme>/phase/<phase>/hero.webp`; `scripts/phase.py` selects the one for the current time.
