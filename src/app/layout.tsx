import type { Metadata, Viewport } from "next";
import { Archivo, Barlow_Condensed } from "next/font/google";

import { RegisterSw } from "@/components/pwa/register-sw";
import { cn } from "@/lib/utils";

import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BaroStat 24",
    template: "%s · BaroStat 24",
  },
  description:
    "Registra dal vivo in quale fascia dei 24 secondi cade ogni canestro.",
  applicationName: "BaroStat 24",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BaroStat 24",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0F14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={cn("dark", barlowCondensed.variable, archivo.variable)}
    >
      <body>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
