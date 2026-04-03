import { tool, jsonSchema } from "ai";
import { Octokit } from "@octokit/rest";
import { exchangeTokenForProvider } from "@/lib/auth0";

export function getGithubTools(auth0Token: string) {
  return {
    listAssignedIssues: tool({
      description: "List GitHub issues assigned to the current user.",
      inputSchema: jsonSchema<{ state: "open" | "closed" | "all" }>({
        type: "object",
        properties: {
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
        },
      }),
      execute: async ({ state }) => {
        const token = await exchangeTokenForProvider(auth0Token, "github");
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.issues.list({
          filter: "assigned",
          state,
        });
        return data.map((issue) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          repo: issue.repository?.full_name ?? "unknown",
          url: issue.html_url,
          createdAt: issue.created_at,
        }));
      },
    }),

    closeIssue: tool({
      description: "Close a specific GitHub issue by number and repo.",
      inputSchema: jsonSchema<{ owner: string; repo: string; issueNumber: number }>({
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issueNumber: { type: "number" },
        },
        required: ["owner", "repo", "issueNumber"],
      }),
      execute: async ({ owner, repo, issueNumber }) => {
        const token = await exchangeTokenForProvider(auth0Token, "github");
        const octokit = new Octokit({ auth: token });
        await octokit.rest.issues.update({
          owner,
          repo,
          issue_number: issueNumber,
          state: "closed",
        });
        return { success: true, message: `Issue #${issueNumber} closed` };
      },
    }),

    commentOnIssue: tool({
      description: "Add a comment to a GitHub issue.",
      inputSchema: jsonSchema<{ owner: string; repo: string; issueNumber: number; comment: string }>({
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issueNumber: { type: "number" },
          comment: { type: "string" },
        },
        required: ["owner", "repo", "issueNumber", "comment"],
      }),
      execute: async ({ owner, repo, issueNumber, comment }) => {
        const token = await exchangeTokenForProvider(auth0Token, "github");
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: comment,
        });
        return { success: true, commentUrl: data.html_url };
      },
    }),
  };
}
