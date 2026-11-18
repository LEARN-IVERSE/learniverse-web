"use client";

// Concept 3, "Sao chổi L1", cartoon style: a comet swoops through a porthole. Its tapering tail
// draws the letter L, then it pulls up and away with the number 1 as its head (L1 reads as "LI",
// short for LEARNIVERSE). Pure shapes, no font glyphs, so it renders the same everywhere.
import { cn } from "@/lib/utils";

import { useSvgId } from "./d/art";

type Pt = [number, number];

const NAVY = "#0b1f5c";
const AMBER = "#f59e0b";

const round = (v: number) => Math.round(v * 100) / 100;
const fmt = ([x, y]: Pt) => `${round(x)} ${round(y)}`;
/** Unit vector for a screen heading in degrees (0 = right, 90 = down). */
const heading = (deg: number): Pt => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];

function line([ax, ay]: Pt, [bx, by]: Pt, n: number): Pt[] {
  return Array.from({ length: n }, (_, i): Pt => [
    ax + ((bx - ax) * (i + 1)) / n,
    ay + ((by - ay) * (i + 1)) / n,
  ]);
}

function arc([cx, cy]: Pt, r: number, fromDeg: number, toDeg: number, n: number): Pt[] {
  return Array.from({ length: n }, (_, i): Pt => {
    const [ux, uy] = heading(fromDeg + ((toDeg - fromDeg) * (i + 1)) / n);
    return [cx + r * ux, cy + r * uy];
  });
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  return Array.from({ length: n }, (_, i): Pt => {
    const t = (i + 1) / n;
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [
      w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0],
      w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1],
    ];
  });
}

// Porthole, nudged down-left so the comet has room to burst out past the rim at the top right.
const CX = 30;
const CY = 35;
const RIM_R = 23.75; // rim stroke centre; the 2.5 stroke spans r = 22.5..25
const WINDOW_R = 22.5;

// Flight path in the 64x64 viewBox: dive (stem of the L), tight turn, flat run, then a steep climb
// that carries the tail and the head out through the rim.
const TAIL: Pt = [13.5, 5]; // outside the rim: the comet streaks in over the top-left edge
const STEM_END: Pt = [18, 39.5];
const TURN_R = 4.2;
const EXIT_HEADING = -3; // leaves the turn almost flat, so the foot of the L still reads
const HEAD: Pt = [45.5, 33.2];
const HEAD_HEADING = -45; // ...then climbs towards the head

function flightPath(): Pt[] {
  const stemHeading = (Math.atan2(STEM_END[1] - TAIL[1], STEM_END[0] - TAIL[0]) * 180) / Math.PI;
  const [ox, oy] = heading(stemHeading - 90);
  const centre: Pt = [STEM_END[0] + ox * TURN_R, STEM_END[1] + oy * TURN_R];
  const turn = arc(centre, TURN_R, stemHeading + 90, EXIT_HEADING + 90, 14);
  const exit = turn[turn.length - 1];
  const [ex, ey] = heading(EXIT_HEADING);
  const [hx, hy] = heading(HEAD_HEADING);
  const swoop = cubic(
    exit,
    [exit[0] + ex * 11, exit[1] + ey * 11],
    [HEAD[0] - hx * 7, HEAD[1] - hy * 7],
    HEAD,
    22,
  );
  return [TAIL, ...line(TAIL, STEM_END, 22), ...turn, ...swoop];
}

/**
 * SVG strokes have a single width, so a tapering tail is drawn as a filled outline: offset each
 * sample of the centre line along its normal by half the local width, then close with a round cap.
 */
function taperedOutline(pts: Pt[], widthAt: (t: number) => number): string {
  const dist = [0];
  for (let i = 1; i < pts.length; i++) {
    dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = dist[dist.length - 1];
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const half = widthAt(dist[i] / total) / 2;
    left.push([x + nx * half, y + ny * half]);
    right.push([x - nx * half, y - ny * half]);
  });
  const cap = round(widthAt(1) / 2);
  return [
    `M${fmt(left[0])}`,
    ...left.slice(1).map((p) => `L${fmt(p)}`),
    `A${cap} ${cap} 0 0 0 ${fmt(right[right.length - 1])}`,
    ...right
      .slice(0, -1)
      .reverse()
      .map((p) => `L${fmt(p)}`),
    "Z",
  ].join(" ");
}

const PATH = flightPath();
const TAIL_OUTER_D = taperedOutline(PATH, (t) => 9.6 * t ** 0.85); // sharp tip, bold head
const TAIL_INNER_D = taperedOutline(PATH, (t) => (t < 0.3 ? 0 : 4.2 * ((t - 0.3) / 0.7) ** 1.1));

// The head: a chunky "1" leaning into the climb, sitting on top of the end of the tail.
const ONE_BASE: Pt = [46.5, 39.5]; // the top third of the 1 pokes out past the rim
const ONE_TILT = 16;
const ONE_H = 21;
const ONE_W = 7;
const OUTLINE = 2.6; // navy cartoon outline, so parts outside the porthole stay crisp on any background
const ONE_D = `M-5.8 ${-ONE_H + 4.8} L0 ${-ONE_H} L0 0`;
const ONE_TRANSFORM = `translate(${ONE_BASE[0]} ${ONE_BASE[1]}) rotate(${ONE_TILT})`;

const STARS = [
  { x: 38, y: 19, r: 1.2 },
  { x: 12, y: 38, r: 0.9 },
  { x: 44, y: 48, r: 1.1 },
  { x: 28, y: 54, r: 0.8 },
  { x: 24, y: 18, r: 0.7 },
];

/** Four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} ` +
  `Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`;

export function LogoCometL1({ className, animated }: { className?: string; animated?: boolean }) {
  const clip = useSvgId("lg-window");
  const swoop = cn(animated && "lg-swoop");

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo LEARNIVERSE sao chổi L1">
      <defs>
        <clipPath id={clip}>
          <circle cx={CX} cy={CY} r={WINDOW_R} />
        </clipPath>
      </defs>

      {/* Porthole: blue rim, navy glass and a thin inner ring, as in the first sketch. */}
      <circle cx={CX} cy={CY} r={RIM_R} fill={NAVY} stroke="#2563eb" strokeWidth="2.5" />
      <circle
        cx={CX}
        cy={CY}
        r={RIM_R - 3.75}
        fill="none"
        stroke="#3b82f6"
        strokeOpacity=".45"
        strokeWidth="1.2"
      />

      {/* Inside the glass only: stars and the head's glow. */}
      <g clipPath={`url(#${clip})`}>
        {STARS.map((s, i) => (
          <circle
            key={`${s.x}-${s.y}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="white"
            className={cn(animated && "lg-twinkle")}
            style={animated ? { animationDelay: `${-i * 0.55}s` } : undefined}
          />
        ))}
        <path
          d={sparkle(29.5, 27.5, 3.2)}
          fill="#fde68a"
          className={cn(animated && "lg-twinkle")}
          style={animated ? { animationDelay: "-1.2s" } : undefined}
        />
        <g className={swoop}>
          {/* Flat cartoon glow (blue, so it never muddies into brown on navy). */}
          <g transform={ONE_TRANSFORM}>
            <circle cx="-1" cy={-ONE_H / 3} r="12" fill="#1d4ed8" fillOpacity=".35" />
            <circle cx="-1" cy={-ONE_H / 3} r="8" fill="#3b82f6" fillOpacity=".3" />
          </g>
        </g>
      </g>

      {/* The comet is not clipped: its tail and head break out over the rim. */}
      <g className={swoop}>
        <path d={TAIL_OUTER_D} fill={NAVY} stroke={NAVY} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={TAIL_OUTER_D} fill="#60a5fa" />
        <path d={TAIL_INNER_D} fill="#eff6ff" />
        <g transform={ONE_TRANSFORM}>
          <path
            d={ONE_D}
            fill="none"
            stroke={NAVY}
            strokeWidth={ONE_W + OUTLINE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={ONE_D}
            fill="none"
            stroke={AMBER}
            strokeWidth={ONE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M-1.4 -15.5 L-1.4 -10.5"
            stroke="white"
            strokeOpacity=".7"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
