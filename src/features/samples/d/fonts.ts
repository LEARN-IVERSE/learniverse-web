import { Dancing_Script, Patrick_Hand } from "next/font/google";

export { baloo, lexend } from "@/lib/fonts";

// Sample D typography: rounded display headings, highly legible body, script for verses,
// and a handwriting face for the "photo of homework" illustration. All support Vietnamese.
export const dancing = Dancing_Script({ subsets: ["latin", "vietnamese"], variable: "--font-script" });
export const hand = Patrick_Hand({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-hand",
});
