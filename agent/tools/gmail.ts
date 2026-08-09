import { tool, jsonSchema } from "ai";
import { google } from "googleapis";
import { exchangeTokenForProvider } from "@/lib/auth0";
import { runAuditedWrite } from "@/lib/audit-log";
import { throwToolError } from "@/lib/tool-errors";
import { assertWriteAllowed } from "@/lib/tool-permissions";
import { assertWriteMatchesLatestUserIntent } from "@/lib/write-execute-guard";
import { wrapUntrustedExternalContent } from "@/agent/wrap-untrusted-content";
import {
  clampCount,
  requireEmailAddress,
  requireString,
} from "@/agent/tool-input";

const GMAIL_PROVIDER = "google-oauth2" as const;

/** Each result is a separate metadata fetch, so keep the fan-out bounded. */
const DEFAULT_EMAIL_COUNT = 10;
const MAX_EMAIL_COUNT = 25;

/** RFC 5322 headers are newline-delimited — a newline in either field would inject headers. */
function assertNoHeaderInjection(field: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Email ${field} cannot contain line breaks`);
  }
}

/** Encode a header value that may contain non-ASCII characters (RFC 2047). */
function encodeHeader(value: string): string {
  const isAscii = [...value].every((char) => char.codePointAt(0)! <= 0x7f);
  if (isAscii) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export function getGmailTools(auth0Token: string, userId: string) {
  return {
    listUnreadEmails: tool({
      description: "List the user's unread emails from Gmail.",
      inputSchema: jsonSchema<{ maxResults: number }>({
        type: "object",
        properties: {
          maxResults: {
            type: "number",
            default: DEFAULT_EMAIL_COUNT,
            description: `Number of emails to return (1-${MAX_EMAIL_COUNT})`,
          },
        },
      }),
      execute: async ({ maxResults }) => {
        try {
          const count = clampCount(
            maxResults,
            DEFAULT_EMAIL_COUNT,
            1,
            MAX_EMAIL_COUNT
          );
          const token = await exchangeTokenForProvider(auth0Token, GMAIL_PROVIDER);
          const auth = new google.auth.OAuth2();
          auth.setCredentials({ access_token: token });
          const gmail = google.gmail({ version: "v1", auth });

          const list = await gmail.users.messages.list({
            userId: "me",
            q: "is:unread",
            maxResults: count,
          });
          const ids = (list.data.messages ?? [])
            .map((message) => message.id)
            .filter((id): id is string => typeof id === "string")
            .slice(0, count);

          if (ids.length === 0) {
            return wrapUntrustedExternalContent({ emails: [], count: 0 });
          }

          // One unreadable message (deleted mid-listing, transient 5xx) must not
          // sink the whole listing — report what we could read.
          const settled = await Promise.allSettled(
            ids.map(async (id) => {
              const detail = await gmail.users.messages.get({
                userId: "me",
                id,
                format: "metadata",
                metadataHeaders: ["From", "Subject", "Date"],
              });
              const headers = detail.data.payload?.headers ?? [];
              const get = (name: string) =>
                headers.find((header) => header.name === name)?.value ?? "";
              return {
                id,
                from: get("From"),
                subject: get("Subject"),
                date: get("Date"),
                snippet: detail.data.snippet ?? "",
              };
            })
          );

          const emails = settled
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);
          const failed = settled.length - emails.length;
          if (failed > 0) {
            console.warn(`[listUnreadEmails] ${failed} message(s) could not be read`);
          }

          return wrapUntrustedExternalContent({
            emails,
            count: emails.length,
            ...(failed > 0
              ? { note: `${failed} message(s) could not be read and were skipped.` }
              : {}),
          });
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
          const recipient = requireEmailAddress("sendEmail", "to", to);
          const emailSubject = requireString("sendEmail", "subject", subject, 500);
          const emailBody = requireString("sendEmail", "body", body, 100_000);
          assertNoHeaderInjection("recipient", recipient);
          assertNoHeaderInjection("subject", emailSubject);

          const args = { to: recipient, subject: emailSubject, body: emailBody };
          assertWriteMatchesLatestUserIntent("sendEmail", args, messages);

          return await runAuditedWrite(userId, "sendEmail", args, async () => {
            await assertWriteAllowed(userId, "gmail");
            const token = await exchangeTokenForProvider(auth0Token, GMAIL_PROVIDER);
            const auth = new google.auth.OAuth2();
            auth.setCredentials({ access_token: token });
            const gmail = google.gmail({ version: "v1", auth });

            const message = [
              `To: ${recipient}`,
              `Subject: ${encodeHeader(emailSubject)}`,
              "Content-Type: text/plain; charset=utf-8",
              "",
              emailBody,
            ].join("\r\n");
            const encoded = Buffer.from(message, "utf8")
              .toString("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

            await gmail.users.messages.send({
              userId: "me",
              requestBody: { raw: encoded },
            });
            return { success: true, message: `Email sent to ${recipient}` };
          });
        } catch (error) {
          throwToolError("sendEmail", error, GMAIL_PROVIDER);
        }
      },
    }),
  };
}
