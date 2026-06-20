// ---------------------------------------------------------------------------
// Site content & tracking configuration
// ---------------------------------------------------------------------------

/** Featured work. The hero copy cycles through these. */
export const PROJECTS = [
  {
    title: ['Bi-Propellant', 'Engine Test Stand'],
    body: 'Designed and instrumented a 500 lbf liquid engine test stand — feed system, load cells, and a real-time data pipeline capturing chamber pressure at 2 kHz.',
    tags: ['LOX / Kerosene', 'Instrumentation', 'CAD']
  },
  {
    title: ['CubeSat', 'Attitude Control'],
    body: 'Wrote flight software for a 3U CubeSat ADCS — reaction-wheel control, sun-pointing mode, and a Kalman filter fusing magnetometer and gyro data.',
    tags: ['Embedded C', 'Kalman Filter', 'Flight SW']
  }
];

// A real, recognizable object so the ground track is genuine, not decorative.
// TLEs go stale; the propagated track shape stays correct. Swap freely —
// grab a fresh TLE from https://celestrak.org or https://www.n2yo.com.
export const TLE = [
  '1 25544U 98067A   24286.54791435  .00016717  00000-0  30074-3 0  9993',
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.49815350 12345'
];

export const SATELLITE_NAME = 'ISS (ZARYA)';

/** Ground station the look-angles (az / el / range) are computed from. */
export const GROUND = { name: 'UCLA · LOS ANGELES', lat: 34.0689, lon: -118.4452, hgt: 0.1 };
