"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { AI_PROVIDER_SHORT_LABEL } from "@/lib/ai-display";
import { CtaArrow, PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { GitHubIcon, GmailIcon, SlackIcon } from "@/components/provider-icons";

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

const PROVIDER_KEYS = Object.keys(CONNECTIONS) as Array<keyof typeof CONNECTIONS>;

export function ConnectPageClient() {
  return (
    <div suppressHydrationWarning className="anzen-page flex min-h-screen flex-col">
      <SiteHeader />

      <main className="anzen-site-x anzen-page-y anzen-shell flex flex-1 flex-col">
        <PageHero
          status="setup / accounts"
          title="Connect your accounts"
          lede={
            <>
              Anzen uses Auth0 Token Vault — it never stores your tokens. Content you ask about is
              processed by {AI_PROVIDER_SHORT_LABEL}.
            </>
          }
        />

        <div className="mt-10 flex max-w-[620px] flex-col gap-2.5">
          {PROVIDER_KEYS.map((key) => (
            <div
              key={key}
              className="anzen-tile anzen-tile-hover flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--anzen-border)] bg-[var(--anzen-surface-2)]">
                  {PROVIDER_META[key].icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold tracking-tight text-[var(--anzen-text)]">
                    {CONNECTIONS[key].label}
                  </p>
                  <p className="anzen-tile-body mt-0.5">{PROVIDER_META[key].description}</p>
                </div>
              </div>

              <p className="anzen-tile-label m-0 shrink-0 sm:w-14">{PROVIDER_META[key].type}</p>

              <a href={buildConnectUrl(key, "/connect")} className="anzen-cta anzen-cta-sm shrink-0">
                Connect
                <CtaArrow />
              </a>
            </div>
          ))}
        </div>

        <p className="anzen-tile-body mt-6 max-w-[620px]">
          By connecting you agree to our{" "}
          <Link href="/terms" className="text-[var(--anzen-text)] no-underline hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--anzen-text)] no-underline hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-10">
          <Link href="/dashboard" className="anzen-cta anzen-cta-sm anzen-cta-quiet">
            Back to dashboard
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
