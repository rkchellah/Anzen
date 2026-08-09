"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, type InitialAuthState } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export function LegalPageShell({
  kind,
  title,
  subtitle,
  sections,
  relatedLink,
  initialAuth,
}: {
  kind: "Privacy" | "Terms";
  title: string;
  subtitle: string;
  sections: LegalSection[];
  relatedLink?: { href: string; label: string };
  initialAuth?: InitialAuthState;
}) {
  return (
    <div suppressHydrationWarning className="anzen-page flex flex-col">
      <SiteHeader initialAuth={initialAuth} />

      <main className="w-full flex-1">
        <div className="bg-card w-full border-b">
          <div className="anzen-site-x mx-auto flex w-full max-w-3xl flex-col items-center pt-24 pb-10 text-center md:pt-28">
            <div className="mb-6 flex items-center gap-2">
              <Badge>Legal</Badge>
              <span className="text-muted-foreground text-sm">{kind}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
            <p className="text-muted-foreground mt-3 max-w-prose">{subtitle}</p>
          </div>
        </div>

        <div className="anzen-site-x mx-auto w-full max-w-3xl pt-8 pb-16">
          <Card size="sm" className="mb-8">
            <CardContent>
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                On this page
              </p>
              <Separator className="mb-3" />
              <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-foreground text-sm no-underline transition-colors"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {sections.map((section, index) => (
              <Card key={section.id} id={section.id} className="scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Badge variant="outline" className="tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </Badge>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed">
                  {section.body}
                </CardContent>
              </Card>
            ))}
          </div>

          {relatedLink && (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              See also{" "}
              <Link
                href={relatedLink.href}
                className="text-primary font-medium no-underline hover:underline"
              >
                {relatedLink.label}
              </Link>
            </p>
          )}
        </div>
      </main>

      <SiteFooter activePage={kind === "Privacy" ? "privacy" : "terms"} />
    </div>
  );
}
