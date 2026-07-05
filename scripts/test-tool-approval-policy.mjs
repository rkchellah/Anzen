/**
 * Smoke tests for write-approval policy (run: node scripts/test-tool-approval-policy.mjs)
 */
import assert from "node:assert/strict";

// Inline minimal copies for script — keep in sync with lib/tool-approval-policy.ts
const WRITE_TOOLS = new Set(["closeIssue", "commentOnIssue", "sendEmail", "postMessage"]);

function getLastUserMessageText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "user") continue;
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content.trim();
    }
  }
  return "";
}

function isProhibitionOnlyMessage(text) {
  const lower = text.toLowerCase();
  const hasRestriction =
    /\b(don'?t|do not|never|not until|wait until|stop|hold off)\b/.test(lower);
  if (!hasRestriction) return false;
  const requestsNewWrite =
    /\b(yes|please|go ahead|do it|can you|could you|i want you to|comment on|close issue|send email|post to)\b/.test(
      lower
    );
  return !requestsNewWrite;
}

function checkWriteContradiction(lastUserText, toolName, input) {
  if (!lastUserText.trim()) return null;
  if (isProhibitionOnlyMessage(lastUserText) && WRITE_TOOLS.has(toolName)) {
    return "The user's latest message only restricts actions — no new write was requested.";
  }
  const lower = lastUserText.toLowerCase();
  if (/\b(don'?t|do not|never)\b[\s\S]{0,40}\breopen\b/.test(lower)) {
    if (toolName === "commentOnIssue") {
      const comment = String(input.comment ?? "").toLowerCase();
      if (/\breopen/.test(comment)) {
        return "The user said not to reopen the issue, but this comment mentions reopening.";
      }
    }
    if (toolName === "closeIssue") {
      return "The user asked not to reopen or change issue state in their latest message.";
    }
  }
  return null;
}

// --- Reproduction scenario from bug report ---
const messages = [
  { role: "user", content: "comment on and assign the issue" },
  { role: "assistant", content: "I'll help with that." },
  {
    role: "user",
    content: "Don't reopen the issue until i work on it.",
  },
];

const lastUser = getLastUserMessageText(messages);
assert.equal(lastUser, "Don't reopen the issue until i work on it.");

const prohibitionBlock = checkWriteContradiction(lastUser, "commentOnIssue", {
  owner: "rkchellah",
  repo: "Anzen",
  issueNumber: 1,
  comment: "Reopening issue to work on it",
});
assert.ok(prohibitionBlock, "Should block reopen comment when user forbade reopen");

const anyWriteBlock = checkWriteContradiction(lastUser, "commentOnIssue", {
  owner: "rkchellah",
  repo: "Anzen",
  issueNumber: 1,
  comment: "Reminder: work on this later",
});
assert.ok(anyWriteBlock, "Should block any write when latest message is prohibition-only");

const earlierIntent = getLastUserMessageText([
  { role: "user", content: "comment on the issue please" },
]);
assert.equal(earlierIntent, "comment on the issue please");
assert.equal(
  checkWriteContradiction(earlierIntent, "commentOnIssue", {
    comment: "Reminder",
  }),
  null,
  "Explicit write request should not be auto-denied"
);

console.log("tool-approval-policy smoke tests passed");
