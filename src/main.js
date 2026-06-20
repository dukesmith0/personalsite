// ---------------------------------------------------------------------------
// Boot + wiring
// ---------------------------------------------------------------------------
import * as satellite from 'satellite.js';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';

import './styles.css';
import { TLE, GROUND, SATELLITE_NAME } from './config.js';
import { Globe } from './globe.js';
import { initProjects } from './projects.js';

const $ = (id) => document.getElementById(id);

initProjects();
$('passText').textContent = `TRACKING · ${SATELLITE_NAME}`;

const satrec = satellite.twoline2satrec(TLE[0], TLE[1]);
const periodMin = Math.round((2 * Math.PI) / satrec.no); // satrec.no is rad/min

const land = feature(landTopo, landTopo.objects.land);

function updateTelemetry(sp) {
  $('tLat').textContent = (sp.lat >= 0 ? '+' : '') + sp.lat.toFixed(2);
  $('tLon').textContent = (sp.lon >= 0 ? '+' : '') + sp.lon.toFixed(2);
  $('tAlt').textContent = sp.altKm.toFixed(1);
  $('tVel').textContent = sp.speed.toFixed(2);
  $('tPer').textContent = periodMin;
  $('gAz').textContent = sp.az.toFixed(0) + '°';
  $('gEl').textContent = sp.el.toFixed(0) + '°';
  $('gRng').textContent = (sp.rngKm | 0).toLocaleString();
  const sig = $('gsSig');
  if (sp.el > 0) {
    sig.textContent = '● AOS · IN VIEW';
    sig.className = 'sig aos';
  } else {
    sig.textContent = '○ BELOW HORIZON';
    sig.className = 'sig los';
  }
}

const globe = new Globe(document.getElementById('globe'), {
  satrec,
  land,
  ground: GROUND,
  onTelemetry: updateTelemetry
});
globe.start();

$('boot').classList.add('gone');
