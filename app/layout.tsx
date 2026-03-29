import type { Metadata } from "next";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

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
    <html lang="en">
      <body suppressHydrationWarning>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}