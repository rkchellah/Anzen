/**
 * Tests for the write guards, run against the real TypeScript modules
 * (run: node scripts/test-guards.mjs).
 *
 * Needs Node >= 22.18 (built-in type stripping + module.registerHooks). No deps:
 * a resolve hook maps the `@/` alias to the repo and stubs the permissions
 * store so no Redis or `.data` file is touched.
 */
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (typeof registerHooks !== "function") {
  console.error("module.registerHooks is unavailable — use Node 22.18 or newer.");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// getUserPermissions returns whatever the current test puts here.
const PERMISSIONS_STUB = `data:text/javascript,${encodeURIComponent(
  "export async function getUserPermissions() { return globalThis.__testPermissions; }"
)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/permissions-store") {
      return { url: PERMISSIONS_STUB, shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      const base = path.join(ROOT, specifier.slice(2));
      for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const { assertWriteAllowed } = await import("@/lib/tool-permissions");
const { ToolUserError } = await import("@/lib/tool-errors");
const { describeWriteArguments } = await import("@/agent/action-descriptions");

let failures = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}\n     ${error.message}`);
  }
}

async function expectDenied(permissions) {
  globalThis.__testPermissions = permissions;
  await assert.rejects(assertWriteAllowed("user-1", "gmail"), (error) => {
    assert.ok(error instanceof ToolUserError, "expected a ToolUserError");
    assert.equal(error.category, "permission_denied");
    assert.equal(error.connectionKey, "gmail");
    return true;
  });
}

// assertWriteAllowed is an allow-list: only "read_write" passes.
await test('assertWriteAllowed blocks "read"', () =>
  expectDenied({ github: "read_write", gmail: "read", slack: "read_write" }));
await test("assertWriteAllowed blocks a missing provider entry", () =>
  expectDenied({ github: "read_write", slack: "read_write" }));
await test("assertWriteAllowed blocks an explicit undefined mode", () =>
  expectDenied({ github: "read_write", gmail: undefined, slack: "read_write" }));
await test("assertWriteAllowed blocks undefined permissions", () => expectDenied(undefined));
for (const garbage of ["admin", "READ_WRITE", "read_write ", "", 1, true, null, {}]) {
  await test(`assertWriteAllowed blocks garbage ${JSON.stringify(garbage)}`, () =>
    expectDenied({ github: "read", gmail: garbage, slack: "read" }));
}
await test('assertWriteAllowed allows "read_write"', async () => {
  globalThis.__testPermissions = { github: "read", gmail: "read_write", slack: "read" };
  await assertWriteAllowed("user-1", "gmail");
});

// The confirmation card must show the whole email, not a truncated summary.
await test("describeWriteArguments shows the full sendEmail body", () => {
  const body = `Hi Bob,\n\n${"x".repeat(5_000)}\n\nSECRET-TAIL-MARKER`;
  const args = describeWriteArguments("sendEmail", {
    to: "bob@example.com",
    subject: "S".repeat(300),
    body,
  });
  assert.deepEqual(
    args.map((arg) => arg.label),
    ["To", "Subject", "Body"]
  );
  assert.equal(args[0].value, "bob@example.com");
  assert.equal(args[1].value, "S".repeat(300));
  assert.equal(args[2].value, body);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll guard tests passed");
