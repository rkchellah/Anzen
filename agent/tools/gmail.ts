import { tool, jsonSchema } from "ai";
import { google } from "googleapis";
import { exchangeTokenForProvider } from "@/lib/auth0";
import { runAuditedWrite } from "@/lib/audit-log";
import { throwToolError } from "@/lib/tool-errors";
import { assertWriteAllowed } from "@/lib/tool-permissions";
import { assertWriteMatchesLatestUserIntent } from "@/lib/write-execute-guard";
import { wrapUntrustedExternalContent } from "@/agent/wrap-untrusted-content";

const GMAIL_PROVIDER = "google-oauth2" as const;

export function getGmailTools(auth0Token: string, userId: string) {
  return {
    listUnreadEmails: tool({
      description: "List the user's unread emails from Gmail.",
      inputSchema: jsonSchema<{ maxResults: number }>({
        type: "object",
        properties: {
          maxResults: { type: "number", default: 10, description: "Number of emails to return" },
        },
      }),
      execute: async ({ maxResults }) => {
        try {
          const token = await exchangeTokenForProvider(auth0Token, GMAIL_PROVIDER);
          const auth = new google.auth.OAuth2();
          auth.setCredentials({ access_token: token });
          const gmail = google.gmail({ version: "v1", auth });
          const list = await gmail.users.messages.list({ userId: "me", q: "is:unread", maxResults });
          if (!list.data.messages) {
            return wrapUntrustedExternalContent({ emails: [], count: 0 });
          }
          const emails = await Promise.all(
            list.data.messages.slice(0, maxResults).map(async (msg) => {
              const detail = await gmail.users.messages.get({
                userId: "me", id: msg.id!, format: "metadata",
                metadataHeaders: ["From", "Subject", "Date"],
              });
              const headers = detail.data.payload?.headers ?? [];
              const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
              return { id: msg.id, from: get("From"), subject: get("Subject"), date: get("Date"), snippet: detail.data.snippet ?? "" };
            })
          );
          return wrapUntrustedExternalContent({ emails, count: emails.length });
        } catch (error) {
          throwToolError("listUnreadEmails", error, GMAIL_PROVIDER);
        }
      },
    }),

    sendEmail: tool({
      description: "Send an email on behalf of the user",
      needsApproval: true,
      inputSchema: jsonSchema<{ to: string; subject: string; body: string }>({
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body in plain text" },
        },
        required: ["to", "subject", "body"],
      }),
      execute: async ({ to, subject, body }, { messages }) => {
        try {
          assertWriteMatchesLatestUserIntent("sendEmail", { to, subject, body }, messages);
          return await runAuditedWrite(
            userId,
            "sendEmail",
            { to, subject, body },
            async () => {
              await assertWriteAllowed(userId, "gmail");
              const token = await exchangeTokenForProvider(auth0Token, GMAIL_PROVIDER);
              const auth = new google.auth.OAuth2();
              auth.setCredentials({ access_token: token });
              const gmail = google.gmail({ version: "v1", auth });
              const message = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=utf-8", "", body].join("\n");
              const encoded = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
              await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
              return { success: true, message: `Email sent to ${to}` };
            }
          );
        } catch (error) {
          throwToolError("sendEmail", error, GMAIL_PROVIDER);
        }
      },
    }),
  };
}
