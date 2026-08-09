"use client";

import Link from "next/link";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { AI_PROVIDER_SHORT_LABEL } from "@/lib/ai-display";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { GitHubIcon, GmailIcon, SlackIcon } from "@/components/provider-icons";
import type { ReactNode } from "react";

const PROVIDER_META: Record<
  keyof typeof CONNECTIONS,
  { description: string; type: string; icon: ReactNode }
> = {
  github: {
    description: "Issues, PRs & repos",
    type: "Code",
    icon: <GitHubIcon size={20} />,
  },
  gmail: {
    description: "Emails & drafts",
    type: "Email",
    icon: <GmailIcon size={20} />,
  },
  slack: {
    description: "Channels & messages",
    type: "Chat",
    icon: <SlackIcon size={20} />,
  },
};

export function ConnectPageClient() {
  return (
    <div suppressHydrationWarning className="anzen-page flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-24 pb-10 text-center md:px-8 md:pt-28 md:pb-14">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-foreground">
          Connect your accounts
        </h1>
        <p className="mx-auto mt-3 max-w-[560px] text-[16px] leading-[1.6] text-muted-foreground">
          Anzen uses Auth0 Token Vault — it never stores your tokens. Content you ask about is
          processed by {AI_PROVIDER_SHORT_LABEL}.
        </p>
        <p className="mx-auto mt-2 max-w-[560px] text-[14px] text-caption">
          By connecting you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-10 border-t border-border text-left">
          {(Object.keys(CONNECTIONS) as Array<keyof typeof CONNECTIONS>).map((key) => (
            <div
              key={key}
              className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="anzen-icon-tile size-11 rounded-xl">
                  {PROVIDER_META[key].icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold tracking-[-0.015em] text-foreground">
                    {CONNECTIONS[key].label}
                  </p>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {PROVIDER_META[key].description}
                  </p>
                </div>
              </div>
              <p className="anzen-meta w-20 shrink-0">{PROVIDER_META[key].type}</p>
              <a
                href={buildConnectUrl(key, "/connect")}
                className="anzen-btn anzen-btn-secondary anzen-btn-sm shrink-0"
              >
                Connect
              </a>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[15px]">
          <Link href="/dashboard" className="underline underline-offset-2 hover:text-foreground">
            Back to dashboard
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
