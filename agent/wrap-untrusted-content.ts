/** Tag for external provider data passed back to the model (GOAL Phase 2). */
export const UNTRUSTED_EXTERNAL_CONTENT_TAG = "untrusted_external_content";

const MAX_TOOL_OUTPUT_CHARS = 12_000;

/**
 * Wraps tool output from external sources (GitHub, Gmail, Slack) so the model
 * treats it as data, not instructions.
 */
export function wrapUntrustedExternalContent(data: unknown): string {
  let serialized =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  if (serialized.length > MAX_TOOL_OUTPUT_CHARS) {
    serialized = `${serialized.slice(0, MAX_TOOL_OUTPUT_CHARS)}\n… [truncated]`;
  }
  return `<${UNTRUSTED_EXTERNAL_CONTENT_TAG}>\n${serialized}\n</${UNTRUSTED_EXTERNAL_CONTENT_TAG}>`;
}
