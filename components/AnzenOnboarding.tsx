"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CtaArrow } from "@/components/PageHero";
import { errorMessage, requestJson } from "@/lib/client-api";
import {
  emptyProfile,
  suggestPreferredName,
  type UserProfile,
} from "@/lib/profile";

/**
 * Asked once, on first arrival: what should Anzen call you?
 *
 * Deliberately two fields and no more. Anything else we could ask here is
 * something the product should either already know or not need.
 */
export function AnzenOnboarding({
  open,
  profile,
  /** Auth0's guess, offered as a starting point rather than imposed. */
  suggestedFullName,
  onSaved,
  onDismiss,
}: {
  open: boolean;
  profile: UserProfile;
  suggestedFullName?: string;
  onSaved: (profile: UserProfile) => void;
  /** Only passed when editing an existing name — first-run has no way out. */
  onDismiss?: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [touchedPreferred, setTouchedPreferred] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to whatever is stored each time the dialog opens, so cancelling an
  // edit and reopening doesn't resurrect abandoned typing.
  useEffect(() => {
    if (!open) return;
    const initialFull = profile.fullName || suggestedFullName || "";
    setFullName(initialFull);
    setPreferredName(profile.preferredName || suggestPreferredName(initialFull));
    setTouchedPreferred(Boolean(profile.preferredName));
    setError(null);
  }, [open, profile, suggestedFullName]);

  const trimmedPreferred = preferredName.trim();
  const canSave = trimmedPreferred.length > 0 && !saving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);
    try {
      const data = await requestJson<{ profile?: UserProfile }>("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          preferredName: trimmedPreferred,
        }),
      });
      onSaved(data.profile ?? emptyProfile());
    } catch (caught) {
      setError(errorMessage(caught, "Couldn't save your name. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss?.();
      }}
      // First run is not dismissable: there is nothing behind this to use yet,
      // and a half-onboarded user is a worse state than an unstarted one.
      dismissible={Boolean(onDismiss)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="anzen-surface-card fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[26rem] -translate-x-1/2 -translate-y-1/2 p-6 shadow-[var(--anzen-elev-3)] transition-all duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="anzen-status-line">
            <span className="anzen-status-dot" />
            <span className="anzen-status-text">agent / setup</span>
          </div>

          <Dialog.Title className="m-0 text-[1.5rem] leading-[1.05] font-extrabold tracking-[-0.04em] text-[var(--anzen-text)]">
            What should Anzen call you?
          </Dialog.Title>
          <Dialog.Description className="anzen-lede mt-3 text-sm">
            Used in the app and by the agent when it talks to you. You can change
            it any time from the sidebar.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="anzen-tile-label m-0">Full name</span>
              <input
                type="text"
                value={fullName}
                autoComplete="name"
                placeholder="Optional"
                onChange={(event) => {
                  setFullName(event.target.value);
                  // Keep the preferred name tracking the full name until the
                  // user makes it their own.
                  if (!touchedPreferred) {
                    setPreferredName(suggestPreferredName(event.target.value));
                  }
                }}
                className="h-10 rounded-[10px] border border-[var(--anzen-border)] bg-[var(--anzen-surface-2)] px-3 text-sm text-[var(--anzen-text)] outline-none transition-colors placeholder:text-[var(--anzen-caption)] focus:border-[color-mix(in_oklab,var(--anzen-accent)_45%,var(--anzen-border))]"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="anzen-tile-label m-0">Preferred name</span>
              <input
                type="text"
                value={preferredName}
                autoFocus
                required
                autoComplete="given-name"
                placeholder="What we'll call you"
                onChange={(event) => {
                  setTouchedPreferred(true);
                  setPreferredName(event.target.value);
                }}
                className="h-10 rounded-[10px] border border-[var(--anzen-border)] bg-[var(--anzen-surface-2)] px-3 text-sm text-[var(--anzen-text)] outline-none transition-colors placeholder:text-[var(--anzen-caption)] focus:border-[color-mix(in_oklab,var(--anzen-accent)_45%,var(--anzen-border))]"
              />
            </label>

            {error && (
              <p className="m-0 text-[13px] leading-snug text-destructive">
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center gap-3">
              <button type="submit" className="anzen-cta" disabled={!canSave}>
                {saving ? "Saving…" : "Continue"}
                {!saving && <CtaArrow />}
              </button>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="anzen-cta anzen-cta-quiet"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
