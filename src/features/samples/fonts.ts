import { Be_Vietnam_Pro, Lexend, Nunito } from "next/font/google";

// Each sample exposes its font through --font-sans, which the Tailwind `font-sans` utility reads.
export const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const nunito = Nunito({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });

export const lexend = Lexend({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
