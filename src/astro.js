// ---------------------------------------------------------------------------
// Small astronomy / formatting helpers
// ---------------------------------------------------------------------------

export const DEG = 180 / Math.PI;
export const RAD = Math.PI / 180;

/**
 * Sub-solar point [lon, lat] in degrees — the spot on Earth where the Sun is
 * directly overhead. Used to draw the day/night terminator. Low-order
 * approximation: good to ~1° of declination, plenty for a visualization.
 */
export function subsolar(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date - start) / 86400000;
  const decl = -23.44 * Math.cos(RAD * (360 / 365) * (day + 10));
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return [-15 * (h - 12), decl];
}

/** Signed fixed-precision number, e.g. +34.07 / -118.45. */
export function fmt(n, d) {
  return (n >= 0 ? '+' : '') + n.toFixed(d);
}
