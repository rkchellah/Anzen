import { tool } from "ai";
import { z } from "zod";
import { google } from "googleapis";
import { getTokenForProvider } from "@/lib/auth0";

export function getGmailTools() {
  return {
    listUnreadEmails: tool({
      description: "List the user's unread emails from Gmail. Always call with maxResults=10 unless user specifies otherwise.",
      parameters: z.object({
        maxResults: z.number().default(10).describe("Number of emails to return — use 10 as default"),
      }),
      execute: async ({ maxResults }): Promise<{ emails: Array<{ id?: string; from: string; subject: string; date: string; snippet: string }>; count: number }> => {
        const token = await getTokenForProvider("google-oauth2");
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });

        const gmail = google.gmail({ version: "v1", auth });

        const list = await gmail.users.messages.list({
          userId: "me",
          q: "is:unread",
          maxResults,
        });

        if (!list.data.messages) {
          return { emails: [], count: 0 };
        }

        const emails = await Promise.all(
          list.data.messages.slice(0, maxResults).map(async (msg) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: msg.id!,
              format: "metadata",
              metadataHeaders: ["From", "Subject", "Date"],
            });

            const headers = detail.data.payload?.headers ?? [];
            const get = (name: string) =>
              headers.find((h) => h.name === name)?.value ?? "";

            return {
              id: msg.id,
              from: get("From"),
              subject: get("Subject"),
              date: get("Date"),
              snippet: detail.data.snippet ?? "",
            };
          })
        );

        return { emails, count: emails.length };
      },
    }),

    sendEmail: tool({
      description: "Send an email on behalf of the user",
      parameters: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Email body in plain text"),
      }),
      execute: async ({ to, subject, body }): Promise<{ success: boolean; message: string }> => {
        const token = await getTokenForProvider("google-oauth2");
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });

        const gmail = google.gmail({ version: "v1", auth });

        const message = [
          `To: ${to}`,
          `Subject: ${subject}`,
          "Content-Type: text/plain; charset=utf-8",
          "",
          body,
        ].join("\n");

        const encoded = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encoded },
        });

        return { success: true, message: `Email sent to ${to}` };
      },
    }),
  };
}