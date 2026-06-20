// ---------------------------------------------------------------------------
// Globe — D3-geo orthographic Earth with a live SGP4 ground track.
// Rendering only; telemetry values are pushed out via the onTelemetry callback.
// ---------------------------------------------------------------------------
import { geoOrthographic, geoPath, geoGraticule10, geoCircle, geoDistance } from 'd3-geo';
import * as satellite from 'satellite.js';
import { DEG, RAD, subsolar } from './astro.js';

export class Globe {
  constructor(canvas, { satrec, land, ground, onTelemetry }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.satrec = satrec;
    this.land = land;
    this.ground = ground;
    this.onTelemetry = onTelemetry || (() => {});
    this.rot = 0;
    this.centerLat = 16;
    this.stars = [];
    this._loop = this._frame.bind(this);
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.scale = Math.min(this.W, this.H) * (this.W > 820 ? 0.42 : 0.4);
    this.cx = this.W > 820 ? this.W * 0.62 : this.W * 0.5;
    this.cy = this.H * 0.52;
    this.projection = geoOrthographic().scale(this.scale).translate([this.cx, this.cy]).clipAngle(90);
    this.path = geoPath(this.projection, this.ctx);
    this._makeStars();
  }

  // Sparse, faint starfield — deliberately restrained.
  _makeStars() {
    this.stars = [];
    for (let n = 0; n < 80; n++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 0.9 + 0.2,
        a: Math.random() * 0.35 + 0.08
      });
    }
  }

  _groundTrack(date) {
    const pts = [];
    for (let m = -50; m <= 50; m += 1.2) {
      const t = new Date(date.getTime() + m * 60000);
      const pv = satellite.propagate(this.satrec, t);
      if (!pv.position) continue;
      const g = satellite.gstime(t);
      const geo = satellite.eciToGeodetic(pv.position, g);
      pts.push([satellite.degreesLong(geo.longitude), satellite.degreesLat(geo.latitude)]);
    }
    return pts;
  }

  _subPoint(date) {
    const pv = satellite.propagate(this.satrec, date);
    if (!pv.position) return null;
    const g = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(pv.position, g);
    const v = pv.velocity;
    const obs = { longitude: this.ground.lon * RAD, latitude: this.ground.lat * RAD, height: this.ground.hgt };
    const ecf = satellite.eciToEcf(pv.position, g);
    const look = satellite.ecfToLookAngles(obs, ecf);
    return {
      lon: satellite.degreesLong(geo.longitude),
      lat: satellite.degreesLat(geo.latitude),
      altKm: geo.height,
      speed: Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
      az: look.azimuth * DEG,
      el: look.elevation * DEG,
      rngKm: look.rangeSat
    };
  }

  start() {
    this.resize();
    requestAnimationFrame(this._loop);
  }

  _frame(ts) {
    const { ctx } = this;
    const now = new Date();
    this.rot += 0.018;
    this.projection.rotate([this.rot, -this.centerLat]);
    ctx.clearRect(0, 0, this.W, this.H);

    // faint stars
    for (const s of this.stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#cdd9ec';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // ocean sphere
    const grad = ctx.createRadialGradient(
      this.cx - this.scale * 0.3, this.cy - this.scale * 0.35, this.scale * 0.2,
      this.cx, this.cy, this.scale * 1.05
    );
    grad.addColorStop(0, '#10243a');
    grad.addColorStop(0.7, '#0a1626');
    grad.addColorStop(1, '#070d18');
    ctx.beginPath();
    this.path({ type: 'Sphere' });
    ctx.fillStyle = grad;
    ctx.fill();

    // atmosphere halo
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.scale * 1.045, 0, 7);
    const halo = ctx.createRadialGradient(this.cx, this.cy, this.scale * 0.96, this.cx, this.cy, this.scale * 1.12);
    halo.addColorStop(0, 'rgba(108,199,255,0)');
    halo.addColorStop(0.5, 'rgba(108,199,255,.18)');
    halo.addColorStop(1, 'rgba(108,199,255,0)');
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.restore();

    // graticule
    ctx.beginPath();
    this.path(geoGraticule10());
    ctx.strokeStyle = 'rgba(108,199,255,.08)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // land
    if (this.land) {
      ctx.beginPath();
      this.path(this.land);
      ctx.fillStyle = 'rgba(120,150,180,.16)';
      ctx.strokeStyle = 'rgba(150,185,220,.55)';
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();
    }

    // night side
    const ss = subsolar(now);
    const night = geoCircle().center([ss[0] + 180, -ss[1]]).radius(90)();
    ctx.beginPath();
    this.path(night);
    ctx.fillStyle = 'rgba(3,6,12,.55)';
    ctx.fill();

    if (this.satrec) this._drawSatellite(ts, now);

    requestAnimationFrame(this._loop);
  }

  _drawSatellite(ts, now) {
    const { ctx } = this;
    const center = [-this.rot, this.centerLat];

    // ground track — solid, glowing line (not dotted)
    const track = this._groundTrack(now);
    if (track.length) {
      ctx.beginPath();
      this.path({ type: 'LineString', coordinates: track });
      ctx.strokeStyle = 'rgba(108,199,255,.7)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(108,199,255,.6)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const sp = this._subPoint(now);
    if (!sp) return;
    const visible = geoDistance([sp.lon, sp.lat], center) < Math.PI / 2;

    // ground station
    const gs = this.projection([this.ground.lon, this.ground.lat]);
    const gsVis = geoDistance([this.ground.lon, this.ground.lat], center) < Math.PI / 2;
    if (gs && gsVis) {
      ctx.beginPath();
      ctx.arc(gs[0], gs[1], 3, 0, 7);
      ctx.fillStyle = '#ff9a5c';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gs[0], gs[1], 7, 0, 7);
      ctx.strokeStyle = 'rgba(255,154,92,.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (visible) {
      const p = this.projection([sp.lon, sp.lat]);
      const fpRadius = Math.acos(6371 / (6371 + sp.altKm)) * DEG;
      const foot = geoCircle().center([sp.lon, sp.lat]).radius(fpRadius)();
      ctx.beginPath();
      this.path(foot);
      ctx.strokeStyle = 'rgba(108,199,255,.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(108,199,255,.04)';
      ctx.fill();

      if (gs && gsVis && sp.el > 0) {
        ctx.beginPath();
        ctx.moveTo(gs[0], gs[1]);
        ctx.lineTo(p[0], p[1]);
        ctx.strokeStyle = 'rgba(255,154,92,.5)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.2, 0, 7);
      ctx.fillStyle = '#dff1ff';
      ctx.fill();
      ctx.strokeStyle = '#6cc7ff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    this.onTelemetry(sp);
  }
}
