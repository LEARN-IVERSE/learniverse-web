"use client";

// Hand-made SVG artwork for the community page (ported from UI sample D). Deterministic, aria-hidden.
import { Bubble } from "./subject-art";

// ---------------------------------------------------------------- social

const NETWORK = [
  { x: 470, y: 64, n: "B", c: "#2563eb" },
  { x: 560, y: 36, n: "H", c: "#059669" },
  { x: 640, y: 96, n: "L", c: "#f59e0b" },
  { x: 548, y: 142, n: "M", c: "#fb7185" },
  { x: 726, y: 52, n: "K", c: "#c0392b" },
  { x: 712, y: 150, n: "A", c: "#0ea5e9" },
];
const NETWORK_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 2],
  [2, 4],
  [2, 5],
  [1, 4],
];
const RISING = [
  { x: 380, glyph: "❤", c: "#fb7185", d: "0s", dur: "7s" },
  { x: 430, glyph: "?", c: "#2563eb", d: "-1.4s", dur: "8s" },
  { x: 600, glyph: "@", c: "#059669", d: "-2.8s", dur: "7.5s" },
  { x: 680, glyph: "#", c: "#f59e0b", d: "-4.2s", dur: "8.5s" },
  { x: 760, glyph: "!", c: "#c0392b", d: "-5.6s", dur: "7s" },
  { x: 505, glyph: "👍", c: "#0ea5e9", d: "-3.5s", dur: "9s" },
];

/** Social banner art: a friendship network of avatars with chat, heart and mention bubbles rising. */
export function SocialScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 200" preserveAspectRatio="xMaxYMid slice" className={className} aria-hidden>
      {NETWORK_EDGES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={NETWORK[a].x}
          y1={NETWORK[a].y}
          x2={NETWORK[b].x}
          y2={NETWORK[b].y}
          stroke="#93c5fd"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      ))}
      {NETWORK.map((p, i) => (
        <g key={p.n}>
          {i % 2 === 0 && (
            <circle
              cx={p.x}
              cy={p.y}
              r="27"
              fill="none"
              stroke={p.c}
              strokeOpacity=".35"
              strokeWidth="2"
              className="d-twinkle"
            />
          )}
          <circle cx={p.x} cy={p.y} r="19" fill={p.c} stroke="white" strokeWidth="3" />
          <text
            x={p.x}
            y={p.y + 6}
            textAnchor="middle"
            className="font-display"
            fontSize="16"
            fontWeight="800"
            fill="white"
          >
            {p.n}
          </text>
        </g>
      ))}
      {RISING.map((b) => (
        <g
          key={b.glyph}
          className="d-svg-anim d-rise"
          style={{ animationDelay: b.d, animationDuration: b.dur }}
        >
          <Bubble x={b.x - 18} y={168} w={36} h={28} stroke={b.c}>
            <text
              x={b.x}
              y={188}
              textAnchor="middle"
              className="font-display"
              fontSize="15"
              fontWeight="800"
              fill={b.c}
            >
              {b.glyph}
            </text>
          </Bubble>
        </g>
      ))}
    </svg>
  );
}

/** "Photo" of a student's homework, used as the image attached to a post. */
export function NotebookPhoto({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 220" className={className} role="img" aria-label="Ảnh chụp bài tập (minh họa)">
      <rect width="600" height="220" fill="#e7eef8" />
      <g transform="rotate(-2 300 110)">
        <rect x="40" y="14" width="520" height="196" rx="6" fill="#fffdf7" stroke="#e2e8f0" />
        {[46, 70, 94, 118, 142, 166, 190].map((y) => (
          <line key={y} x1="40" y1={y} x2="560" y2={y} stroke="#bfdbfe" />
        ))}
        <line x1="92" y1="14" x2="92" y2="210" stroke="#fca5a5" strokeWidth="1.5" />
        {[34, 74, 114, 154, 194].map((y) => (
          <circle key={y} cx="62" cy={y} r="6" fill="#e7eef8" />
        ))}
        <text x="104" y="40" className="font-hand" fontSize="22" fill="#1e3a8a">
          Bài 2: Giải phương trình
        </text>
        <text x="104" y="88" className="font-hand" fontSize="27" fill="#0f172a">
          x² − 5x + 6 = 0
        </text>
        <text x="104" y="136" className="font-hand" fontSize="22" fill="#0f172a">
          Δ = 25 − 24 = 1
        </text>
        <text x="104" y="184" className="font-hand" fontSize="22" fill="#dc2626">
          ⇒ x = ???
        </text>
        <circle cx="462" cy="146" r="34" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
        <text x="452" y="156" className="font-hand" fontSize="30" fill="#dc2626">
          ?
        </text>
      </g>
      <g transform="rotate(-25 470 60)">
        <rect x="380" y="50" width="160" height="14" rx="3" fill="#fbbf24" />
        <polygon points="540,50 560,57 540,64" fill="#fde68a" />
        <polygon points="552,54.5 560,57 552,59.5" fill="#1f2937" />
        <rect x="370" y="50" width="12" height="14" rx="2" fill="#f472b6" />
      </g>
    </svg>
  );
}
