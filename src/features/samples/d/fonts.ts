import { Baloo_2, Dancing_Script, Lexend, Patrick_Hand } from "next/font/google";

// Sample D typography: rounded display headings, highly legible body, script for verses,
// and a handwriting face for the "photo of homework" illustration. All support Vietnamese.
export const lexend = Lexend({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
export const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], variable: "--font-display" });
export const dancing = Dancing_Script({ subsets: ["latin", "vietnamese"], variable: "--font-script" });
export const hand = Patrick_Hand({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-hand",
});
