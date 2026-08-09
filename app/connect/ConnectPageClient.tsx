"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { AI_PROVIDER_SHORT_LABEL } from "@/lib/ai-display";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { GitHubIcon, GmailIcon, SlackIcon } from "@/components/provider-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-24 pb-10 text-center md:px-8 md:pt-28 md:pb-14">
        <h1 className="text-3xl font-semibold tracking-tight">Connect your accounts</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-prose">
          Anzen uses Auth0 Token Vault — it never stores your tokens. Content you ask about is
          processed by {AI_PROVIDER_SHORT_LABEL}.
        </p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-prose text-sm">
          By connecting you agree to our{" "}
          <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-10 flex flex-col gap-3 text-left">
          {(Object.keys(CONNECTIONS) as Array<keyof typeof CONNECTIONS>).map((key) => (
            <Card key={key}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    {PROVIDER_META[key].icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{CONNECTIONS[key].label}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {PROVIDER_META[key].description}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="shrink-0">
                  {PROVIDER_META[key].type}
                </Badge>

                <Button render={<a href={buildConnectUrl(key, "/connect")} />} className="shrink-0">
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Button render={<Link href="/dashboard" />} variant="outline">
            Back to dashboard
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
