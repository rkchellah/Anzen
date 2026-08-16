"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "@/components/PageHero";
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

      {/* A legal document is an article, so it gets one centred reading column
          rather than the 1080px product shell — in which a 720px block of text
          sits hard left with half the page empty beside it. */}
      <main className="anzen-site-x anzen-page-y mx-auto flex w-full max-w-[46rem] flex-1 flex-col">
        <PageHero status={`legal / ${kind.toLowerCase()}`} title={title} lede={subtitle} />

        <div className="mt-10">
          {/* Contents: a quiet index line, not a boxed widget. */}
          <p className="anzen-tile-label m-0">On this page</p>
          <hr className="anzen-rule mt-3 mb-3" />
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {sections.map((section, index) => (
              <li key={section.id} className="flex items-center gap-1.5">
                <span className="anzen-ordinal">{String(index + 1).padStart(2, "0")}</span>
                <a
                  href={`#${section.id}`}
                  className="text-[13px] text-[var(--anzen-muted)] no-underline transition-colors hover:text-[var(--anzen-text)]"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-2.5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="anzen-tile anzen-tile-hover scroll-mt-24"
              >
                <div className="mb-2.5 flex items-baseline gap-2.5">
                  <span className="anzen-ordinal">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="m-0 text-[13.5px] font-semibold tracking-tight text-[var(--anzen-text)]">
                    {section.title}
                  </h2>
                </div>
                <div className="text-[13px] leading-[1.7] text-[var(--anzen-muted)]">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          {relatedLink && (
            <>
              <hr className="anzen-rule mt-10" />
              <p className="anzen-tile-body mt-5">
                See also{" "}
                <Link
                  href={relatedLink.href}
                  className="font-medium text-[var(--anzen-accent-text)] no-underline hover:underline"
                >
                  {relatedLink.label}
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <SiteFooter activePage={kind === "Privacy" ? "privacy" : "terms"} />
    </div>
  );
}
