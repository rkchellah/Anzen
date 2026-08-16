/**
 * The name Anzen calls you.
 *
 * Auth0 gives us whatever the identity provider had — often an email local part
 * or a legal name nobody uses. This is the user's own answer instead, asked once
 * during onboarding and used in the UI and in the agent's system prompt.
 */
export type UserProfile = {
  /** How they'd write their name in full. May be empty. */
  fullName: string;
  /** What Anzen actually calls them. The one that matters. */
  preferredName: string;
};

/** Long enough for any real name, short enough to bound what we store. */
const MAX_NAME_LENGTH = 60;

export function emptyProfile(): UserProfile {
  return { fullName: "", preferredName: "" };
}

function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

/** Coerce anything out of storage or a request body into a valid profile. */
export function normalizeProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== "object") return emptyProfile();
  const record = raw as Record<string, unknown>;
  return {
    fullName: cleanName(record.fullName),
    preferredName: cleanName(record.preferredName),
  };
}

/**
 * Onboarding is done once we know what to call them. The full name is optional —
 * demanding a legal name to start a chat would be a toll booth, not onboarding.
 */
export function isProfileComplete(profile: UserProfile): boolean {
  return profile.preferredName.length > 0;
}

/** First word of a full name, as the default suggestion for the preferred one. */
export function suggestPreferredName(fullName: string): string {
  return cleanName(fullName).split(" ")[0] ?? "";
}
