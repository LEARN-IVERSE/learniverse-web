"use client";

// Leaderboard artwork (ported from UI sample D): concentric rings, the big gold medal, sunburst rays
// and falling confetti. Deterministic and aria-hidden.
import { polar, seeded, starPoints, useSvgId } from "./subject-art";

/** Concentric rings in currentColor, used as subtle decoration on solid surfaces. */
export function RingsDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[30, 52, 74, 96].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={i === 1 ? 6 : 2}
          strokeDasharray={i === 2 ? "2 7" : undefined}
        />
      ))}
      <polygon points={starPoints(100, 100, 12, 22, 9)} fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------- leaderboard

const MEDAL_STAR = starPoints(120, 190, 14, 40, 18);
const MEDAL_DOTS = Array.from({ length: 36 }, (_, i) => polar(120, 190, 59, i * 10));
const LAUREL = [
  ...Array.from({ length: 8 }, (_, i) => ({ deg: 200 + i * 15, side: -1 })),
  ...Array.from({ length: 8 }, (_, i) => ({ deg: 160 - i * 15, side: 1 })),
].map((l) => ({ ...l, ...polar(120, 190, 98, l.deg) }));

/** The big gold medal for the leaderboard hero: drum-star engraving, ribbon, laurel and a moving shine. */
export function BigMedal({ className }: { className?: string }) {
  const gold = useSvgId("gold");
  const clip = useSvgId("clip");
  const arc = useSvgId("arc");
  return (
    <svg viewBox="0 0 240 300" className={className} aria-hidden>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset=".45" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="120" cy="190" r="78" />
        </clipPath>
        <path id={arc} d="M 64 190 A 56 56 0 0 1 176 190" />
      </defs>
      <polygon points="140,0 180,0 136,118 104,118" fill="#c0392b" />
      <polygon points="156,0 164,0 124,118 116,118" fill="white" fillOpacity=".5" />
      <polygon points="60,0 100,0 136,118 104,118" fill="#2563eb" />
      <polygon points="76,0 84,0 124,118 116,118" fill="white" fillOpacity=".5" />
      {LAUREL.map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx="10"
          ry="4.5"
          fill={i % 2 ? "#16a34a" : "#22c55e"}
          transform={`rotate(${l.deg + 90 * l.side} ${l.x} ${l.y})`}
        />
      ))}
      <circle cx="120" cy="190" r="85" fill="#b45309" />
      <circle cx="120" cy="190" r="78" fill={`url(#${gold})`} />
      <circle
        cx="120"
        cy="190"
        r="68"
        fill="none"
        stroke="#92400e"
        strokeOpacity=".45"
        strokeDasharray="2 5"
      />
      {MEDAL_DOTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#92400e" fillOpacity=".35" />
      ))}
      <circle cx="120" cy="190" r="48" fill="none" stroke="#92400e" strokeOpacity=".35" />
      <polygon points={MEDAL_STAR} fill="#fde68a" stroke="#92400e" strokeOpacity=".55" strokeWidth="1.5" />
      <circle cx="120" cy="190" r="7" fill="#f59e0b" stroke="#92400e" strokeOpacity=".5" />
      <text fontSize="11" letterSpacing="3" fill="#78350f" className="font-display" fontWeight="800">
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
          LEARNIVERSE
        </textPath>
      </text>
      <g clipPath={`url(#${clip})`}>
        <rect
          className="d-svg-anim d-shine"
          x="60"
          y="96"
          width="34"
          height="200"
          fill="white"
          fillOpacity=".35"
        />
      </g>
    </svg>
  );
}

const RAYS = Array.from({ length: 18 }, (_, i) => {
  const a = polar(200, 200, 320, i * 20);
  const b = polar(200, 200, 320, i * 20 + 9);
  return `200,200 ${a.x},${a.y} ${b.x},${b.y}`;
});

/** Slowly turning light rays behind the medal. */
export function Sunburst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <g className="d-origin-view d-spin-rays">
        {RAYS.map((p, i) => (
          <polygon key={i} points={p} fill="white" fillOpacity=".08" />
        ))}
      </g>
    </svg>
  );
}

const rngConfetti = seeded(42);
const CONFETTI_COLORS = ["#fbbf24", "#f8fafc", "#fb7185", "#34d399", "#93c5fd", "#c0392b"];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(rngConfetti() * 100).toFixed(1)}%`,
  w: 6 + Math.round(rngConfetti() * 6),
  h: 10 + Math.round(rngConfetti() * 8),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: `${(-rngConfetti() * 6).toFixed(2)}s`,
  duration: `${(5 + rngConfetti() * 4).toFixed(2)}s`,
  round: rngConfetti() > 0.7,
}));

/** Gently falling confetti for the leaderboard hero. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="d-fall absolute -top-6 block"
          style={{
            left: c.left,
            width: c.w,
            height: c.round ? c.w : c.h,
            background: c.color,
            borderRadius: c.round ? 999 : 2,
            animationDelay: c.delay,
            animationDuration: c.duration,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
