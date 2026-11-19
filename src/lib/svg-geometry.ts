// Deterministic SVG geometry helpers: no Math.random at render, so server and client markup match.

/** Point on a circle; 0deg is 12 o'clock, angles grow clockwise. Rounded so markup is stable. */
export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: +(cx + r * Math.cos(a)).toFixed(2), y: +(cy + r * Math.sin(a)).toFixed(2) };
}

/** Star polygon with n tips, the brand motif (inspired by the star at the center of a Dong Son drum). */
export function starPoints(cx: number, cy: number, n: number, outer: number, inner: number) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const p = polar(cx, cy, i % 2 === 0 ? outer : inner, (180 / n) * i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

/** Small deterministic PRNG (mulberry32) for scattering decorations. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
