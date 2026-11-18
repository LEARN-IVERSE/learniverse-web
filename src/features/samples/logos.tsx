// Logo concepts for LEARNIVERSE: "a universe that holds letters and numbers".
// Deliberately avoids the common "single letter wrapped by an elliptical orbit" pattern
// (Internet Explorer, VNPT, Ionic...). Glyphs use the Baloo 2 display font for the prototype;
// the chosen mark should be converted to outlined paths before production.
import { cn } from "@/lib/utils";

import { LogoCometL1 } from "./logo-comet";

const BLUE = "#2563eb";
const NAVY = "#0b1f5c";
const AMBER = "#f59e0b";

type LogoProps = { className?: string; animated?: boolean };

/**
 * Two-tone wordmark: LEARN + IVERSE (learn + universe). Needs --font-display on an ancestor.
 * The dark tone is one weight lighter: light text on a dark ground looks heavier (irradiation).
 */
export function Wordmark({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "font-display leading-none tracking-tight",
        tone === "dark" ? "font-bold" : "font-extrabold",
        className,
      )}
    >
      <span className={tone === "dark" ? "text-white" : "text-slate-900"}>LEARN</span>
      <span className={tone === "dark" ? "text-sky-300" : "text-blue-600"}>IVERSE</span>
    </span>
  );
}

/** 1 · "Hành tinh a²": the letter lives on a planet, its exponent 2 has become a moon. */
export function LogoPlanetSquared({ className, animated }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo hành tinh a mũ 2">
      <circle cx="27" cy="37" r="23" fill={BLUE} />
      <circle cx="19" cy="28" r="6" fill="white" fillOpacity=".14" />
      <text
        x="27"
        y="48"
        textAnchor="middle"
        className="font-display"
        fontSize="32"
        fontWeight="800"
        fill="white"
      >
        a
      </text>
      <g className={cn(animated && "lg-moon")}>
        <circle cx="51" cy="13" r="10" fill={AMBER} />
        <text
          x="51"
          y="18"
          textAnchor="middle"
          className="font-display"
          fontSize="14"
          fontWeight="800"
          fill="white"
        >
          2
        </text>
      </g>
    </svg>
  );
}

const INFINITY_D =
  "M32 32 C 26 21, 7 21, 7 32 C 7 43, 26 43, 32 32 C 38 21, 57 21, 57 32 C 57 43, 38 43, 32 32 Z";

/** 2 · "Vô cực": an endless loop of learning; letters live in one loop, numbers in the other. */
export function LogoInfinity({ className, animated }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo vô cực chữ và số">
      {/* Pale fill keeps the glyphs readable on both light and navy backgrounds. */}
      <path d={INFINITY_D} fill="#eff6ff" stroke={BLUE} strokeWidth="6.5" strokeLinejoin="round" />
      {animated && (
        // A light comet runs along the loop; pathLength normalises the dash to 0..100.
        <path
          d={INFINITY_D}
          pathLength={100}
          fill="none"
          stroke="#bfdbfe"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="12 88"
          className="lg-flow"
        />
      )}
      <text
        x="18.5"
        y="37"
        textAnchor="middle"
        className="font-display"
        fontSize="14"
        fontWeight="800"
        fill={NAVY}
      >
        a
      </text>
      <text
        x="45.5"
        y="37.5"
        textAnchor="middle"
        className="font-display"
        fontSize="14"
        fontWeight="800"
        fill={AMBER}
      >
        1
      </text>
    </svg>
  );
}

/** 3 · "Ô cửa vũ trụ": a porthole into a night sky where a letter and a number drift past a comet. */
export function LogoPorthole({ className, animated }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo ô cửa vũ trụ">
      <circle cx="32" cy="32" r="30" fill={NAVY} />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#3b82f6" strokeOpacity=".55" strokeWidth="1.5" />
      <path
        d="M9 47 C 22 40, 38 30, 52 15"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity=".8"
      />
      <circle cx="52" cy="15" r="3.2" fill={AMBER} />
      <text
        x="21"
        y="33"
        textAnchor="middle"
        className="font-display"
        fontSize="22"
        fontWeight="800"
        fill="white"
      >
        A
      </text>
      <text
        x="43"
        y="53"
        textAnchor="middle"
        className="font-display"
        fontSize="19"
        fontWeight="800"
        fill={AMBER}
      >
        1
      </text>
      {[
        [44, 30],
        [16, 46],
        [33, 12],
        [50, 42],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1.3"
          fill="white"
          className={cn(animated && "lg-twinkle")}
          style={animated ? { animationDelay: `${-i * 0.6}s` } : undefined}
        />
      ))}
    </svg>
  );
}

/** 4 · "Chòm sao chữ số": inside the universe circle, letters and numbers form a constellation. */
export function LogoConstellation({ className, animated }: LogoProps) {
  const nodes = [
    { x: 19, y: 24, t: "a", c: NAVY },
    { x: 45, y: 20, t: "2", c: BLUE },
    { x: 22, y: 47, t: "x", c: BLUE },
    { x: 45, y: 45, t: "9", c: AMBER },
  ];
  const lines: [number, number][] = [
    [0, 1],
    [1, 3],
    [0, 2],
    [2, 3],
  ];
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo chòm sao chữ và số">
      <circle cx="32" cy="32" r="29.5" fill="#eff6ff" stroke={BLUE} strokeWidth="3" />
      {lines.map(([a, b]) => (
        <line
          key={`${a}${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y - 4}
          x2={nodes[b].x}
          y2={nodes[b].y - 4}
          stroke="#93c5fd"
          strokeWidth="1.6"
          strokeDasharray="2 2.5"
          className={cn(animated && "lg-flow-slow")}
        />
      ))}
      {nodes.map((n) => (
        <g key={n.t}>
          <circle cx={n.x} cy={n.y - 4} r="8" fill="white" />
          <text
            x={n.x}
            y={n.y + 1}
            textAnchor="middle"
            className="font-display"
            fontSize="14"
            fontWeight="800"
            fill={n.c}
          >
            {n.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 5 · "Bậc thang vũ trụ": number blocks 1-2-3 build an L that climbs toward a letter planet. */
export function LogoSteps({ className, animated }: LogoProps) {
  const bars = [
    { x: 6, y: 44, h: 14, fill: "#93c5fd", n: "1" },
    { x: 22, y: 33, h: 25, fill: "#3b82f6", n: "2" },
    { x: 38, y: 22, h: 36, fill: "#1d4ed8", n: "3" },
  ];
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Logo bậc thang số lên hành tinh chữ"
    >
      {bars.map((b, i) => (
        <g key={b.n}>
          {/* Only the bar breathes; the digit stays put so it never gets squashed. */}
          <rect
            x={b.x}
            y={b.y}
            width="14"
            height={b.h}
            rx="3.5"
            fill={b.fill}
            className={cn(animated && "lg-rise")}
            style={animated ? { animationDelay: `${i * 0.12}s` } : undefined}
          />
          <text
            x={b.x + 7}
            y="55"
            textAnchor="middle"
            className="font-display"
            fontSize="10"
            fontWeight="800"
            fill="white"
          >
            {b.n}
          </text>
        </g>
      ))}
      <g className={cn(animated && "lg-bob")}>
        <circle cx="52" cy="11" r="8.5" fill={AMBER} />
        <text
          x="52"
          y="15"
          textAnchor="middle"
          className="font-display"
          fontSize="12"
          fontWeight="800"
          fill="white"
        >
          a
        </text>
      </g>
    </svg>
  );
}

export const LOGO_IDS = ["comet", "planet", "infinity", "porthole", "constellation", "steps"] as const;
export type LogoId = (typeof LOGO_IDS)[number];

/** Static lookup so callers can pick a concept by id without creating components during render. */
export function LogoById({ id, className }: { id: LogoId; className?: string }) {
  switch (id) {
    case "comet":
      return <LogoCometL1 className={className} />;
    case "planet":
      return <LogoPlanetSquared className={className} />;
    case "infinity":
      return <LogoInfinity className={className} />;
    case "porthole":
      return <LogoPorthole className={className} />;
    case "constellation":
      return <LogoConstellation className={className} />;
    case "steps":
      return <LogoSteps className={className} />;
  }
}

/** The first five proposals; the refined comet mark is shown separately on the logo lab page. */
export const LOGO_CONCEPTS: {
  id: Exclude<LogoId, "comet">;
  name: string;
  Logo: (p: LogoProps) => React.JSX.Element;
  meaning: string;
}[] = [
  {
    id: "planet",
    name: "Hành tinh a²",
    Logo: LogoPlanetSquared,
    meaning:
      "Chữ “a” là hành tinh, số mũ “2” bay ra thành mặt trăng. Một ký hiệu vừa là chữ vừa là số: Văn, Anh và Toán trong cùng một vũ trụ.",
  },
  {
    id: "infinity",
    name: "Vô cực",
    Logo: LogoInfinity,
    meaning: "Vòng vô cực của việc học không ngừng. Một vòng chứa chữ, một vòng chứa số, nối liền thành một.",
  },
  {
    id: "porthole",
    name: "Ô cửa vũ trụ",
    Logo: LogoPorthole,
    meaning:
      "Nhìn qua ô cửa tàu vũ trụ: chữ “A” và số “1” trôi giữa trời sao, một sao chổi lướt qua. Đậm chất “quao” trên nền tối.",
  },
  {
    id: "constellation",
    name: "Chòm sao chữ số",
    Logo: LogoConstellation,
    meaning:
      "Chữ và số là những vì sao, nối nhau thành một chòm sao trong vòng tròn vũ trụ. Số 9 kín đáo nhắc tới lớp 9.",
  },
  {
    id: "steps",
    name: "Bậc thang vũ trụ",
    Logo: LogoSteps,
    meaning:
      "Các khối số 1-2-3 xếp thành chữ L và bậc thang đi lên một hành tinh chữ cái: tiến bộ từng bước.",
  },
];
