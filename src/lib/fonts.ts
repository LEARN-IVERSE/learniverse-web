import { Baloo_2, Lexend } from "next/font/google";

// App Shell typography (sample D, chosen in K2): Lexend is highly legible for body text and
// Baloo 2 gives rounded display headings. Both ship Vietnamese glyphs.
export const lexend = Lexend({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
export const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], variable: "--font-display" });
