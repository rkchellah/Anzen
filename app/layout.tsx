import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { AnzenThemeInitScript } from "@/components/AnzenThemeInitScript";
import { AnzenThemeProvider } from "@/components/AnzenThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

/**
 * Geist = Anzen UI (shadcn font-sans). Geist Mono = code / metadata (font-mono).
 *
 * Chosen over Inter because the interface leans on two things Inter handles
 * poorly: the display line ("Monitor. Decide. Act.") set at 800 with -0.045em
 * tracking, and dense 10–11px uppercase labels. Geist was drawn for exactly
 * that — tighter default sidebearings, a flatter, more mechanical skeleton, and
 * a mono companion that shares its metrics, so `anzen-ordinal` numerals and
 * tool names line up with the sans around them instead of drifting.
 *
 * Both are variable fonts, so the 100–900 range costs one file each.
 */
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anzen | Your AI Chief of Staff",
  description: "Secure AI agent that acts on your behalf",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <AnzenThemeInitScript />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <Auth0Provider>
          <AnzenThemeProvider>
            {/* Required by shadcn Tooltip (sidebar rail labels use it). */}
            <TooltipProvider>{children}</TooltipProvider>
          </AnzenThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
