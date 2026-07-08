/**
 * DeepSeek tool-calling + streaming smoke test.
 * Run: node scripts/test-deepseek-tools.mjs
 * Requires DEEPSEEK_API_KEY in .env.local or environment.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, jsonSchema, stepCountIs, streamText, tool } from "ai";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
if (!apiKey) {
  console.error("DEEPSEEK_API_KEY is not set. Add it to .env.local and retry.");
  process.exit(1);
}

const modelId = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";
function createDeepSeekFetch() {
  return async (input, init) => {
    if (init?.body && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body);
        if (body.thinking === undefined) {
          body.thinking = { type: "disabled" };
        }
        init = { ...init, body: JSON.stringify(body) };
      } catch {
        // ignore
      }
    }
    return fetch(input, init);
  };
}

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey,
  fetch: createDeepSeekFetch(),
});

const listAssignedIssues = tool({
  description:
    "List GitHub issues assigned to the connected GitHub account. Call when the user asks about their assigned issues.",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
    },
  }),
  execute: async () => ({
    connectedGitHubLogin: "demo-user",
    assignedIssues: [
      {
        issueNumber: 42,
        owner: "rkchellah",
        repo: "Anzen",
        title: "Add DeepSeek provider switch",
        url: "https://github.com/rkchellah/Anzen/issues/42",
        assignees: ["demo-user"],
        assignedToMe: true,
      },
    ],
    createdButNotAssigned: [],
  }),
});

const userMessage = "What GitHub issues are assigned to me?";

console.log("=== DeepSeek tool call test (generateText) ===");
console.log(`Model: ${modelId}`);
console.log(`User: ${userMessage}\n`);

const syncResult = await generateText({
  model: deepseek.chat(modelId),
  system:
    "You are Anzen. When the user asks about assigned GitHub issues, you MUST call listAssignedIssues, then summarize the results.",
  messages: [{ role: "user", content: userMessage }],
  tools: { listAssignedIssues },
  stopWhen: stepCountIs(3),
});

const toolCalls = syncResult.steps.flatMap((step) => step.toolCalls ?? []);
const toolResults = syncResult.steps.flatMap((step) => step.toolResults ?? []);

console.log("Tool calls:", toolCalls.map((c) => c.toolName).join(", ") || "(none)");
console.log("Tool results:", toolResults.length);

console.log("\n--- Test conversation ---");
console.log(`User: ${userMessage}`);
if (toolCalls.length > 0) {
  for (const call of toolCalls) {
    console.log(`Assistant: [tool call: ${call.toolName}(${JSON.stringify(call.input)})]`);
  }
}
for (const result of toolResults) {
  const preview = JSON.stringify(result.output).slice(0, 200);
  console.log(`Tool: ${preview}${preview.length >= 200 ? "…" : ""}`);
}
console.log(`Assistant: ${syncResult.text.trim() || "(empty text)"}`);
console.log("--- end ---\n");

if (!toolCalls.some((c) => c.toolName === "listAssignedIssues")) {
  console.error("\nFAIL: listAssignedIssues was not called.");
  process.exit(1);
}

if (!syncResult.text.trim()) {
  console.error("\nFAIL: No assistant text after tool call.");
  process.exit(1);
}

console.log("\n=== DeepSeek streaming test (streamText) ===");

const streamResult = streamText({
  model: deepseek.chat(modelId),
  system: "You are Anzen. Be brief.",
  messages: [
    { role: "user", content: "Say hello in one short sentence." },
  ],
});

process.stdout.write("Stream: ");
for await (const chunk of streamResult.textStream) {
  process.stdout.write(chunk);
}
console.log("\n");

const streamTextOut = await streamResult.text;
if (!streamTextOut.trim()) {
  console.error("FAIL: Empty stream response.");
  process.exit(1);
}

console.log("\nPASS: DeepSeek tool calling and streaming work.");
