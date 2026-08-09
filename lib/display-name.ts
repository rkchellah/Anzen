/** Derive a human display name when Auth0 only has an email. */
export function resolveDisplayName(
  name: string | null | undefined,
  email: string | null | undefined
): {
  full: string;
  first: string | null;
  initials: string;
} {
  const trimmedName = name?.trim() ?? "";
  const trimmedEmail = email?.trim() ?? "";
  const looksLikeEmail =
    trimmedName.includes("@") ||
    (trimmedEmail.length > 0 && trimmedName.toLowerCase() === trimmedEmail.toLowerCase());

  if (trimmedName && !looksLikeEmail) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    const first = parts[0] ?? trimmedName;
    return {
      full: trimmedName,
      first,
      initials: parts
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
  }

  const local = trimmedEmail.split("@")[0] ?? "";
  return {
    full: trimmedEmail || "Account",
    first: null,
    initials: (local[0] ?? "A").toUpperCase(),
  };
}
