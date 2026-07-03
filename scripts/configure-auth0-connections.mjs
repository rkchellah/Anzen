/**
 * Inspect and enable Token Vault (Connected Accounts) for Google + Slack connections.
 *
 * One-time Auth0 setup:
 * 1. Applications → APIs → Auth0 Management API → Machine to Machine Applications
 * 2. Authorize a machine app (or create "Anzen Management") with scopes:
 *    read:connections, update:connections, read:connections_options, update:connections_options
 * 3. Add to .env.local (do not commit):
 *    AUTH0_MGMT_CLIENT_ID=...
 *    AUTH0_MGMT_CLIENT_SECRET=...
 *
 * Run: node scripts/configure-auth0-connections.mjs
 * Dry run (read only): node scripts/configure-auth0-connections.mjs --check
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CONNECTION_NAMES = ["google-oauth2", "sign-in-with-slack"];
const checkOnly = process.argv.includes("--check");

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

const domain = process.env.AUTH0_DOMAIN;
const appClientId = process.env.AUTH0_CLIENT_ID;
const mgmtClientId = process.env.AUTH0_MGMT_CLIENT_ID;
const mgmtClientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}. Add it to .env.local`);
    process.exit(1);
  }
  return value;
}

requireEnv("AUTH0_DOMAIN");
requireEnv("AUTH0_CLIENT_ID");
requireEnv("AUTH0_MGMT_CLIENT_ID");
requireEnv("AUTH0_MGMT_CLIENT_SECRET");

async function getMgmtToken() {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: mgmtClientId,
      client_secret: mgmtClientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Management token failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function mgmt(token, path, init = {}) {
  const res = await fetch(`https://${domain}/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return body;
}

function summarize(conn) {
  const enabled = (conn.enabled_clients ?? []).includes(appClientId);
  return {
    id: conn.id,
    name: conn.name,
    strategy: conn.strategy,
    authentication: conn.authentication?.active ?? null,
    connected_accounts: conn.connected_accounts?.active ?? null,
    app_enabled: enabled,
    enabled_clients: conn.enabled_clients ?? [],
  };
}

async function main() {
  const token = await getMgmtToken();
  const all = await mgmt(token, "/connections?per_page=100");
  const targets = CONNECTION_NAMES.map((name) => {
    const conn = all.find((c) => c.name === name);
    if (!conn) return { name, missing: true };
    return { name, missing: false, conn };
  });

  console.log(`\nApp client ID: ${appClientId}`);
  console.log(checkOnly ? "Mode: check only\n" : "Mode: check + update\n");

  for (const item of targets) {
    if (item.missing) {
      console.log(`❌ ${item.name}: connection not found in tenant`);
      console.log(
        `   Create it: Authentication → Social → ${item.name === "google-oauth2" ? "Google" : "Slack"}`
      );
      continue;
    }

    const full = await mgmt(token, `/connections/${item.conn.id}`);
    const summary = summarize(full);
    console.log(`--- ${summary.name} (${summary.strategy}) ---`);
    console.log(`  connected_accounts.active: ${summary.connected_accounts}`);
    console.log(`  authentication.active:     ${summary.authentication}`);
    console.log(`  enabled for your app:      ${summary.app_enabled}`);

    if (checkOnly) continue;

    const enabledClients = new Set(summary.enabled_clients);
    enabledClients.add(appClientId);

    const patch = {
      connected_accounts: { active: true },
      enabled_clients: [...enabledClients],
    };

    const updated = await mgmt(token, `/connections/${item.conn.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const after = summarize(updated);
    console.log(`  → updated connected_accounts: ${after.connected_accounts}`);
    console.log(`  → updated app_enabled:        ${after.app_enabled}`);
  }

  console.log("\nDone. Restart npm run dev, sign out, sign in, then try Connect again.\n");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
