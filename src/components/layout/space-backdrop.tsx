// Decorative page background of the App Shell: faint, slowly turning orbit rings (a universe map
// that echoes the Dong Son drum face) plus a few twinkling stars. Everything is aria-hidden.
import { polar, seeded, starPoints } from "@/lib/svg-geometry";

const ORBIT_RINGS = [110, 170, 235, 305, 380];
const ORBIT_DOTS = Array.from({ length: 48 }, (_, i) => polar(400, 400, 205, i * 7.5));
const ORBIT_TICKS = Array.from({ length: 60 }, (_, i) => [
  polar(400, 400, 262, i * 6),
  polar(400, 400, 273, i * 6),
]);
const ORBIT_ZIGZAG = Array.from({ length: 73 }, (_, i) => polar(400, 400, i % 2 ? 336 : 348, i * 5))
  .map((p) => `${p.x},${p.y}`)
  .join(" ");
const ORBIT_PLANETS = [
  { r: 170, deg: 40, size: 9, color: "#2563eb" },
  { r: 235, deg: 200, size: 7, color: "#059669" },
  { r: 305, deg: 120, size: 8, color: "#c0392b" },
  { r: 380, deg: 300, size: 6, color: "#f59e0b" },
].map((p) => ({ ...p, ...polar(400, 400, p.r, p.deg) }));
const ORBIT_STAR = starPoints(400, 400, 14, 70, 30);

/** Page backdrop: very faint, slowly turning orbit rings (drum-face rhythm meets a universe map). */
export function OrbitBackdrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 800" className={className} aria-hidden>
      <g className="d-origin-view d-spin-slow">
        {ORBIT_RINGS.map((r, i) => (
          <circle
            key={r}
            cx="400"
            cy="400"
            r={r}
            fill="none"
            stroke="#3b82f6"
            strokeOpacity={0.16}
            strokeWidth={i % 2 ? 1 : 1.6}
            strokeDasharray={i === 2 ? "3 9" : undefined}
          />
        ))}
        {ORBIT_DOTS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" fillOpacity=".2" />
        ))}
        {ORBIT_TICKS.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3b82f6" strokeOpacity=".16" />
        ))}
        <polyline points={ORBIT_ZIGZAG} fill="none" stroke="#3b82f6" strokeOpacity=".13" />
        {ORBIT_PLANETS.map((p) => (
          <circle key={p.r} cx={p.x} cy={p.y} r={p.size} fill={p.color} fillOpacity=".35" />
        ))}
      </g>
      <polygon points={ORBIT_STAR} fill="#3b82f6" fillOpacity=".07" />
    </svg>
  );
}

const rngSparkle = seeded(7);
const SPARKLES = Array.from({ length: 18 }, () => ({
  left: `${(rngSparkle() * 100).toFixed(1)}%`,
  top: `${(rngSparkle() * 100).toFixed(1)}%`,
  size: 6 + Math.round(rngSparkle() * 8),
  delay: `${(-rngSparkle() * 3).toFixed(2)}s`,
}));

/** Twinkling four-point stars scattered over the page background. */
export function SparkleField() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="d-twinkle absolute text-amber-300"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          aria-hidden
        >
          <path
            d="M10 0 C11 8 12 9 20 10 C12 11 11 12 10 20 C9 12 8 11 0 10 C8 9 9 8 10 0 Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </>
  );
}

/** Fixed, non-interactive layer behind the whole shell. */
export function SpaceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <OrbitBackdrop className="absolute -top-64 -right-64 size-[52rem]" />
      <OrbitBackdrop className="absolute -bottom-80 -left-80 size-[44rem] opacity-60" />
      <SparkleField />
    </div>
  );
}
