"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, type InitialAuthState } from "@/components/SiteHeader";

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

      <main className="flex-1 w-full">
        <div className="w-full border-b border-border bg-card">
          <div className="anzen-site-x mx-auto flex w-full max-w-[800px] flex-col items-center pb-10 pt-24 md:pt-28 text-center">
            <div className="mb-6 flex items-center gap-2">
              <span className="anzen-tag anzen-tag-accent">Legal</span>
              <span className="text-[13px] text-muted-foreground">{kind}</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold leading-tight tracking-[-0.025em] text-foreground md:text-4xl">
              {title}
            </h1>
            <p className="max-w-[600px] text-[16px] leading-[1.65] text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="anzen-site-x mx-auto w-full max-w-[800px] pt-8 pb-16">
          <nav
            aria-label="On this page"
            className="mb-8 p-4 md:p-5 rounded-lg border border-border bg-card"
          >
            <p className="anzen-eyebrow mb-3">On this page</p>
            <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[14.5px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-4">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="anzen-legal-section anzen-card p-6 md:p-8 scroll-mt-20"
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-[13px] font-bold text-accent-foreground"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-3 text-[19px] font-semibold tracking-[-0.02em] text-foreground">
                      {section.title}
                    </h2>
                    <div className="text-[15px] leading-[1.7] text-muted-foreground">
                      {section.body}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {relatedLink && (
            <p className="mt-8 text-center text-[15px] text-muted-foreground">
              See also{" "}
              <Link
                href={relatedLink.href}
                className="text-accent-foreground no-underline font-medium hover:underline"
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
