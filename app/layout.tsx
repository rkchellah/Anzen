import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { AnzenThemeInitScript } from "@/components/AnzenThemeInitScript";
import { AnzenThemeProvider } from "@/components/AnzenThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

/** Inter carries the whole UI; Space Mono is for code and precision metadata. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
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
      className={cn(inter.variable, spaceMono.variable, "font-sans")}
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
