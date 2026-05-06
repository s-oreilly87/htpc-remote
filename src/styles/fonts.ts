import { Archivo_Narrow, Roboto, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

export const archivo_narrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

export const roboto_mono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const dot_matrix = localFont({
  variable: "--font-dot-matrix",
  src: "./LED Dot-Matrix.ttf",
  display: "swap",
});
