import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-[#f9f9f9] text-[#1a1c1c] antialiased">
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
