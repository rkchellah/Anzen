import type { Metadata } from "next";
import { Inter, DM_Sans, Space_Mono, Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { AnzenThemeInitScript } from "@/components/AnzenThemeInitScript";
import { AnzenThemeProvider } from "@/components/AnzenThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
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
      className={`${inter.variable} ${dmSans.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <AnzenThemeInitScript />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <Auth0Provider>
          <AnzenThemeProvider>{children}</AnzenThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
