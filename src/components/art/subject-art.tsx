"use client";

// Hand-made SVG artwork for the subject "planets": covers, page backdrops, progress ring and the
// lesson star node. Everything is deterministic (no Math.random at render) so server and client
// markup always match. Decorative pieces are aria-hidden.
import { useId, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SubjectId = "math" | "english" | "literature";

/** SVG ids must be unique per page and safe inside url(#...). */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Point on a circle; 0deg is 12 o'clock, angles grow clockwise. Rounded so markup is stable. */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: +(cx + r * Math.cos(a)).toFixed(2), y: +(cy + r * Math.sin(a)).toFixed(2) };
}

/** Small deterministic PRNG (mulberry32) for scattering decorations. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Star polygon with n tips, the brand motif (inspired by the star at the center of a Dong Son drum). */
function starPoints(cx: number, cy: number, n: number, outer: number, inner: number) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const p = polar(cx, cy, i % 2 === 0 ? outer : inner, (180 / n) * i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

const SERIF: CSSProperties = { fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" };

// ---------------------------------------------------------------- hero

/** Hero illustration: the three subject planets orbiting a central star. */
export function OrbitSystem({
  className,
  planets,
}: {
  className?: string;
  planets: { id: string; glyph: string; color: string }[];
}) {
  const orbits = [
    { r: 62, deg: 30, duration: "26s" },
    { r: 98, deg: 210, duration: "38s" },
    { r: 134, deg: 120, duration: "52s" },
  ];
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <circle cx="200" cy="150" r="46" fill="#fde68a" fillOpacity=".45" className="d-twinkle" />
      {orbits.map((o) => (
        <circle
          key={o.r}
          cx="200"
          cy="150"
          r={o.r}
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />
      ))}
      <polygon points={starPoints(200, 150, 12, 30, 13)} fill="#f59e0b" />
      <circle cx="200" cy="150" r="7" fill="#fffbeb" />
      {planets.slice(0, 3).map((p, i) => {
        const o = orbits[i];
        const pos = polar(200, 150, o.r, o.deg);
        return (
          <g key={p.id} className="d-origin-view d-spin" style={{ animationDuration: o.duration }}>
            <g
              className="d-svg-anim d-spin"
              style={{ animationDuration: o.duration, animationDirection: "reverse" }}
            >
              <circle cx={pos.x} cy={pos.y} r="21" fill={p.color} />
              <circle cx={pos.x - 6} cy={pos.y - 7} r="7" fill="white" fillOpacity=".25" />
              <text
                x={pos.x}
                y={pos.y + 6}
                textAnchor="middle"
                className="font-display"
                fontSize="16"
                fontWeight="800"
                fill="white"
              >
                {p.glyph}
              </text>
            </g>
          </g>
        );
      })}
      {[
        [64, 52],
        [338, 70],
        [52, 236],
        [350, 250],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="3"
          fill="#f59e0b"
          className="d-twinkle"
          style={{ animationDelay: `${-i * 0.7}s` }}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------- subject covers

const GRID_X = Array.from({ length: 21 }, (_, i) => i * 20);
const GRID_Y = Array.from({ length: 11 }, (_, i) => i * 20);
const PARABOLA = Array.from({ length: 25 }, (_, i) => {
  const x = 80 + i * 10;
  const y = 165 - 0.008 * (x - 200) ** 2;
  return `${i === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
}).join(" ");
const TRIANGLE = [200, 320, 80]
  .map((d) => polar(335, 72, 38, d))
  .map((p) => `${p.x},${p.y}`)
  .join(" ");
const FORMULAS = [
  { text: "Δ = b² − 4ac", x: 26, y: 40, size: 16, color: "#1e3a8a", delay: "0s" },
  { text: "√2", x: 118, y: 90, size: 18, color: "#4f46e5", delay: "-1.5s" },
  { text: "π", x: 286, y: 182, size: 24, color: "#2563eb", delay: "-3s" },
  { text: "sin α", x: 40, y: 104, size: 13, color: "#1e40af", delay: "-4.5s" },
  { text: "x₁ + x₂ = −b/a", x: 250, y: 126, size: 12, color: "#1e3a8a", delay: "-2.2s" },
];

/** Math cover: graph paper, the parabola y = ax², a circle with an inscribed triangle, floating formulas. */
export function MathScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="400" height="200" fill="#eff6ff" />
      {GRID_X.map((x) => (
        <line
          key={`x${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={200}
          stroke="#bfdbfe"
          strokeWidth={x % 100 === 0 ? 1.2 : 0.6}
        />
      ))}
      {GRID_Y.map((y) => (
        <line
          key={`y${y}`}
          x1={0}
          y1={y}
          x2={400}
          y2={y}
          stroke="#bfdbfe"
          strokeWidth={y % 100 === 0 ? 1.2 : 0.6}
        />
      ))}
      <path
        d="M30 150 H380 M372 145 L380 150 L372 155 M200 194 V18 M195 26 L200 18 L205 26"
        fill="none"
        stroke="#1e40af"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={PARABOLA} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <circle cx="157" cy="150" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
      <circle cx="243" cy="150" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
      <text x="214" y="34" className="font-display" fontSize="15" fontWeight="700" fill="#1e3a8a">
        y = ax²
      </text>
      <g className="d-svg-anim d-drift" style={{ animationDelay: "-2s" }}>
        <circle cx="335" cy="72" r="38" fill="#e0e7ff" fillOpacity=".7" stroke="#4f46e5" strokeWidth="2" />
        <polygon points={TRIANGLE} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="335" cy="72" r="2.5" fill="#4f46e5" />
      </g>
      <g className="d-svg-anim d-drift">
        <polygon
          points="18,194 18,122 90,194"
          fill="#fde68a"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon points="30,182 30,152 60,182" fill="#eff6ff" stroke="#f59e0b" strokeWidth="1.5" />
      </g>
      {FORMULAS.map((f) => (
        <g key={f.text} className="d-svg-anim d-float" style={{ animationDelay: f.delay }}>
          <text x={f.x} y={f.y} fontSize={f.size} fill={f.color} style={SERIF}>
            {f.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Speech bubble with a small tail; the tail seam is covered so it reads as one shape. */
export function Bubble({
  x,
  y,
  w,
  h,
  stroke,
  fill = "white",
  tail = "left",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  fill?: string;
  tail?: "left" | "right";
  children?: ReactNode;
}) {
  const tx = tail === "left" ? x + 14 : x + w - 30;
  const tip = tail === "left" ? x + 8 : x + w - 8;
  return (
    <>
      <polygon
        points={`${tx},${y + h - 2} ${tip},${y + h + 10} ${tx + 16},${y + h - 2}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x={tx + 2} y={y + h - 3} width="12" height="4" fill={fill} />
      {children}
    </>
  );
}

const CONTINENT_A =
  "M66 78 c10 -10 30 -8 34 2 c4 9 -6 14 -2 22 c4 8 -8 14 -16 10 c-10 -5 -24 -2 -24 -14 c0 -10 2 -14 8 -20 z";
const CONTINENT_B = "M104 124 c8 -4 22 0 26 8 c4 9 -2 22 -12 26 c-9 3 -14 -4 -16 -12 c-2 -8 -6 -18 2 -22 z";

/** English cover: a globe, a dashed flight path, a postcard with a stamp and speech bubbles. */
export function EnglishScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="400" height="200" fill="#ecfdf5" />
      <g className="d-svg-anim d-float" style={{ animationDuration: "8s" }}>
        <circle cx="95" cy="112" r="58" fill="#d1fae5" stroke="#059669" strokeWidth="2.5" />
        <path d={CONTINENT_A} fill="#34d399" fillOpacity=".85" />
        <path d={CONTINENT_B} fill="#34d399" fillOpacity=".85" />
        <ellipse cx="95" cy="112" rx="24" ry="58" fill="none" stroke="#059669" strokeOpacity=".55" />
        <ellipse cx="95" cy="112" rx="46" ry="58" fill="none" stroke="#059669" strokeOpacity=".35" />
        <ellipse cx="95" cy="112" rx="58" ry="20" fill="none" stroke="#059669" strokeOpacity=".45" />
        <line x1="37" y1="112" x2="153" y2="112" stroke="#059669" strokeOpacity=".55" />
      </g>
      <path
        d="M148 78 C 190 18, 262 22, 300 52"
        fill="none"
        stroke="#0f766e"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <g transform="translate(300 52) rotate(28)">
        <polygon points="0,-7 17,0 0,7 4,0" fill="#0f766e" />
      </g>
      <g transform="rotate(-6 305 132)">
        <rect x="228" y="84" width="154" height="96" rx="8" fill="white" stroke="#a7f3d0" strokeWidth="2" />
        <line x1="305" y1="96" x2="305" y2="170" stroke="#d1fae5" strokeWidth="2" />
        <text x="238" y="114" className="font-script" fontSize="16" fill="#065f46">
          Hello from
        </text>
        <text x="238" y="136" className="font-script" fontSize="16" fill="#065f46">
          Hà Nội!
        </text>
        <rect
          x="342"
          y="92"
          width="30"
          height="36"
          rx="2"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <path
          d="M357 104 c-3 -5 -10 -2 -8 3 c1 3 8 8 8 8 c0 0 7 -5 8 -8 c2 -5 -5 -8 -8 -3 z"
          fill="#fb7185"
        />
        <circle cx="330" cy="104" r="11" fill="none" stroke="#94a3b8" strokeDasharray="3 2" />
        {[150, 162, 174].map((y) => (
          <line key={y} x1="314" y1={y} x2="372" y2={y} stroke="#cbd5e1" strokeWidth="1.5" />
        ))}
      </g>
      <g className="d-svg-anim d-float" style={{ animationDelay: "-1s" }}>
        <Bubble x={12} y={16} w={92} h={30} stroke="#10b981">
          <text
            x="58"
            y="36"
            textAnchor="middle"
            className="font-display"
            fontSize="15"
            fontWeight="800"
            fill="#047857"
          >
            Hello!
          </text>
        </Bubble>
      </g>
      <g className="d-svg-anim d-float" style={{ animationDelay: "-3s" }}>
        <Bubble x={118} y={150} w={104} h={28} stroke="#f59e0b" tail="right">
          <text
            x="170"
            y="169"
            textAnchor="middle"
            className="font-display"
            fontSize="13"
            fontWeight="700"
            fill="#b45309"
          >
            How are you?
          </text>
        </Bubble>
      </g>
      {[
        { t: "A", x: 360, y: 60, s: 24, d: "0s" },
        { t: "b", x: 176, y: 118, s: 20, d: "-2s" },
        { t: "?", x: 214, y: 80, s: 18, d: "-4s" },
        { t: "C", x: 14, y: 192, s: 20, d: "-1s" },
      ].map((l) => (
        <g key={l.t} className="d-svg-anim d-drift" style={{ animationDelay: l.d }}>
          <text
            x={l.x}
            y={l.y}
            className="font-display"
            fontSize={l.s}
            fontWeight="800"
            fill="#059669"
            fillOpacity=".55"
          >
            {l.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

const rngPaper = seeded(21);
const PAPER_SPARKS = Array.from({ length: 30 }, () => ({
  x: +(rngPaper() * 400).toFixed(1),
  y: +(rngPaper() * 200).toFixed(1),
  r: +(0.8 + rngPaper() * 1.4).toFixed(2),
  gold: rngPaper() > 0.6,
  delay: `${(-rngPaper() * 3).toFixed(2)}s`,
}));
const PETAL = "M0 0 C -11 -18, -8 -38, 0 -50 C 8 -38, 11 -18, 0 0 Z";

/**
 * Literature cover in a Dong Ho print palette: shimmering "giấy điệp" paper, an ink brush stroke,
 * a lotus, a red seal and two opening lines of Truyện Kiều (Nguyễn Du, public domain).
 */
export function LiteratureScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="400" height="200" fill="#fbf6ea" />
      {PAPER_SPARKS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={s.gold ? "#e9b949" : "#d9c7a3"}
          className="d-twinkle"
          style={{ animationDelay: s.delay }}
        />
      ))}
      <path
        d="M8 176 C 70 150, 140 190, 236 164 S 330 150, 392 168"
        fill="none"
        stroke="#1f1a17"
        strokeWidth="9"
        strokeLinecap="round"
        opacity=".85"
      />
      <path
        d="M20 188 C 90 170, 160 196, 250 180"
        fill="none"
        stroke="#1f1a17"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".4"
      />
      <text x="22" y="52" className="font-script" fontSize="19" fill="#3b2a20">
        Trăm năm trong cõi người ta,
      </text>
      <text x="22" y="80" className="font-script" fontSize="19" fill="#3b2a20">
        Chữ tài chữ mệnh khéo là ghét nhau.
      </text>
      <text x="24" y="104" fontSize="9.5" letterSpacing="1.5" fill="#8a6d4b">
        — NGUYỄN DU · TRUYỆN KIỀU
      </text>
      <g className="d-svg-anim d-float" style={{ animationDuration: "7s" }}>
        <ellipse cx="330" cy="154" rx="44" ry="11" fill="#2f7d5b" opacity=".9" />
        <path d="M290 154 H370 M330 144 V164" stroke="#bfe3cf" strokeOpacity=".5" />
        <path d="M346 150 C 346 136, 344 128, 345 120" stroke="#2f7d5b" strokeWidth="3" fill="none" />
        <g transform="translate(345 120)">
          {[-62, 62, -30, 30, 0].map((a) => (
            <path
              key={a}
              d={PETAL}
              transform={`rotate(${a}) scale(${Math.abs(a) > 50 ? 0.8 : 1})`}
              fill={Math.abs(a) > 50 ? "#f4c4c4" : "#f8d7da"}
              stroke="#c0392b"
              strokeWidth="1.6"
            />
          ))}
          <ellipse cx="0" cy="-8" rx="9" ry="4" fill="#e9b949" />
        </g>
      </g>
      <g transform="rotate(-8 372 40)">
        <rect x="350" y="18" width="44" height="44" rx="5" fill="#c0392b" />
        <rect x="354" y="22" width="36" height="36" rx="3" fill="none" stroke="#fbf6ea" strokeOpacity=".7" />
        <text
          x="372"
          y="46"
          textAnchor="middle"
          className="font-display"
          fontSize="14"
          fontWeight="800"
          fill="#fbf6ea"
        >
          VĂN
        </text>
      </g>
    </svg>
  );
}

export function SubjectScene({ id, className }: { id: SubjectId; className?: string }) {
  if (id === "english") return <EnglishScene className={className} />;
  if (id === "literature") return <LiteratureScene className={className} />;
  return <MathScene className={className} />;
}

const SUBJECT_COLOR: Record<SubjectId, string> = {
  math: "#2563eb",
  english: "#059669",
  literature: "#c0392b",
};

const BACKDROP_GLYPHS: Record<
  SubjectId,
  { t: string; left: string; top: string; size: string; delay: string }[]
> = {
  math: [
    { t: "∑", left: "3%", top: "6%", size: "5rem", delay: "0s" },
    { t: "√", left: "86%", top: "14%", size: "4rem", delay: "-3s" },
    { t: "π", left: "90%", top: "62%", size: "5rem", delay: "-5s" },
    { t: "△", left: "4%", top: "70%", size: "4rem", delay: "-2s" },
    { t: "∞", left: "48%", top: "88%", size: "3.5rem", delay: "-6s" },
  ],
  english: [
    { t: "A", left: "3%", top: "8%", size: "5rem", delay: "0s" },
    { t: "?", left: "88%", top: "12%", size: "4.5rem", delay: "-3s" },
    { t: "b", left: "90%", top: "64%", size: "4.5rem", delay: "-5s" },
    { t: "!", left: "5%", top: "72%", size: "4rem", delay: "-2s" },
    { t: "&", left: "50%", top: "88%", size: "3.5rem", delay: "-6s" },
  ],
  literature: [
    { t: "✿", left: "3%", top: "8%", size: "4.5rem", delay: "0s" },
    { t: "❦", left: "88%", top: "14%", size: "4rem", delay: "-3s" },
    { t: "Ư", left: "90%", top: "64%", size: "4rem", delay: "-5s" },
    { t: "❀", left: "5%", top: "72%", size: "4rem", delay: "-2s" },
    { t: "“", left: "50%", top: "86%", size: "5rem", delay: "-6s" },
  ],
};

/** Tiled background pattern for a subject page: graph paper, letters, or ruled "giấy điệp" lines. */
export function SubjectPattern({ id, className }: { id: SubjectId; className?: string }) {
  const pid = useSvgId("pattern");
  const c = SUBJECT_COLOR[id];
  return (
    <svg className={className} aria-hidden>
      <defs>
        {id === "math" && (
          <pattern id={pid} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0 H0 V48" fill="none" stroke={c} strokeOpacity=".12" />
            <path d="M24 0 V48 M0 24 H48" stroke={c} strokeOpacity=".05" />
            <text x="5" y="18" fontSize="10" fill={c} fillOpacity=".22" style={SERIF}>
              +
            </text>
          </pattern>
        )}
        {id === "english" && (
          <pattern id={pid} width="72" height="72" patternUnits="userSpaceOnUse">
            <text
              x="8"
              y="26"
              className="font-display"
              fontSize="16"
              fontWeight="700"
              fill={c}
              fillOpacity=".12"
            >
              A
            </text>
            <text
              x="46"
              y="62"
              className="font-display"
              fontSize="14"
              fontWeight="700"
              fill={c}
              fillOpacity=".12"
            >
              b
            </text>
            <rect x="40" y="10" width="22" height="14" rx="7" fill="none" stroke={c} strokeOpacity=".15" />
            <circle cx="16" cy="56" r="3" fill={c} fillOpacity=".1" />
          </pattern>
        )}
        {id === "literature" && (
          <pattern id={pid} width="56" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 31.5 H56" stroke={c} strokeOpacity=".12" />
            <circle cx="40" cy="12" r="1.6" fill="#e9b949" fillOpacity=".6" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

/** Subject page background: the tiled pattern plus a few large, slowly drifting subject glyphs. */
export function SubjectBackdrop({ id, className }: { id: SubjectId; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none overflow-hidden rounded-[2rem]", className)}>
      <SubjectPattern id={id} className="absolute inset-0 h-full w-full" />
      {BACKDROP_GLYPHS[id].map((g) => (
        <span
          key={g.t}
          className="d-drift absolute font-display font-bold select-none"
          style={{
            left: g.left,
            top: g.top,
            fontSize: g.size,
            color: SUBJECT_COLOR[id],
            opacity: 0.09,
            animationDelay: g.delay,
          }}
        >
          {g.t}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- progress & mascot

/** Circular progress that draws itself once on mount. */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  color,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = +(2 * Math.PI * r).toFixed(2);
  const off = +(c * (1 - Math.min(1, Math.max(0, value)))).toFixed(2);
  const ring = { "--ring-c": c, "--ring-off": off, strokeDashoffset: off } as CSSProperties;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth={stroke}
        />
        <circle
          className="d-ring"
          style={ring}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
        />
      </svg>
      {label !== undefined && <span className="absolute text-xs font-bold">{label}</span>}
    </span>
  );
}

/** Lesson node on the learning path: four arc segments = four stars (Lý thuyết, Bài tập, Dạy AI, Ôn tập). */
export function StarNode({
  stars,
  no,
  label,
  color,
  done,
}: {
  stars: number;
  no: ReactNode;
  label: string;
  color: string;
  done: boolean;
}) {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const seg = c / 4;
  return (
    <span
      className="relative grid size-[52px] place-items-center rounded-full bg-white ring-4 ring-white"
      role="img"
      aria-label={`${label}: ${stars}/4 sao`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={i < stars ? "#f59e0b" : "#e2e8f0"}
            strokeDasharray={`${(seg - 7).toFixed(2)} ${(c - seg + 7).toFixed(2)}`}
            strokeDashoffset={(-i * seg).toFixed(2)}
          />
        ))}
      </svg>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full font-display text-base font-bold text-white",
        )}
        style={{ background: done ? "#f59e0b" : color }}
      >
        {done ? "★" : no}
      </span>
    </span>
  );
}
