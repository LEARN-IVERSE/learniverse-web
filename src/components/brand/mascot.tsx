// "Sao Nhí", the AI assistant mascot: a smiling star wrapped in an orbit ring.
import { starPoints } from "@/lib/svg-geometry";

const MASCOT_OUTLINE = starPoints(50, 54, 5, 40, 22);

/** "Sao Nhí", the AI assistant mascot: a little star with an orbit ring (original character). */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse
        cx="50"
        cy="58"
        rx="47"
        ry="13"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="3"
        transform="rotate(-14 50 58)"
      />
      <polygon
        points={MASCOT_OUTLINE}
        fill="#f59e0b"
        stroke="#f59e0b"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <polygon
        points={MASCOT_OUTLINE}
        fill="#fcd34d"
        stroke="#fcd34d"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <g className="d-svg-anim d-blink">
        <ellipse cx="41" cy="54" rx="4" ry="5.5" fill="#1f2937" />
        <ellipse cx="59" cy="54" rx="4" ry="5.5" fill="#1f2937" />
      </g>
      <circle cx="42.3" cy="52" r="1.4" fill="white" />
      <circle cx="60.3" cy="52" r="1.4" fill="white" />
      <circle cx="33" cy="63" r="4" fill="#fb7185" fillOpacity=".55" />
      <circle cx="67" cy="63" r="4" fill="#fb7185" fillOpacity=".55" />
      <path d="M44 64 Q50 70 56 64" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      {/* Front half of the orbit ring, drawn over the star so the ring wraps around it. */}
      <path
        d="M3 58 A 47 13 0 0 0 97 58"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(-14 50 58)"
      />
    </svg>
  );
}
