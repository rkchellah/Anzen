import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
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
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-[#0a0f1e] text-white antialiased">
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
