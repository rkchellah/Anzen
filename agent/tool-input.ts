import { ToolUserError } from "@/lib/tool-errors";
import { connectionKeyForToolName } from "@/lib/tool-errors";

/**
 * Validation for tool arguments the model produced.
 *
 * Models routinely emit empty strings, stringified numbers, or absurd limits.
 * Catching that here turns what would be a confusing provider 404/422 into a
 * clear message, and stops a bad `maxResults` from fanning out into hundreds of
 * upstream API calls.
 */
function invalid(toolName: string, message: string): never {
  throw new ToolUserError({
    category: "unknown",
    connectionKey: connectionKeyForToolName(toolName),
    userMessage: message,
  });
}

/** Require a non-empty string, trimmed. */
export function requireString(
  toolName: string,
  field: string,
  value: unknown,
  maxLength = 4_000
): string {
  if (typeof value !== "string" || !value.trim()) {
    invalid(toolName, `Missing "${field}" — tell Anzen which value to use.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    invalid(
      toolName,
      `"${field}" is too long (${trimmed.length} characters, max ${maxLength}).`
    );
  }
  return trimmed;
}

/** Require a positive integer, accepting the numeric strings models emit. */
export function requirePositiveInt(
  toolName: string,
  field: string,
  value: unknown
): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed <= 0) {
    invalid(toolName, `"${field}" must be a positive whole number.`);
  }
  return parsed;
}

/** Clamp an optional count into a sane range, falling back when unusable. */
export function clampCount(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

/** GitHub owner/repo segments: no slashes, spaces, or path traversal. */
export function requireRepoSegment(
  toolName: string,
  field: string,
  value: unknown
): string {
  const text = requireString(toolName, field, value, 100);
  if (!/^[A-Za-z0-9._-]+$/.test(text)) {
    invalid(
      toolName,
      `"${field}" isn't a valid GitHub ${field} name. Use just the ${field}, e.g. "octocat".`
    );
  }
  return text;
}

/** Loose deliverability check — the provider still does the real validation. */
export function requireEmailAddress(
  toolName: string,
  field: string,
  value: unknown
): string {
  const text = requireString(toolName, field, value, 320);
  if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(text)) {
    invalid(toolName, `"${text}" doesn't look like a valid email address.`);
  }
  return text;
}
