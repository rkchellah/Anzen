import { tool } from "ai";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { getTokenForProvider } from "@/lib/auth0";

// Returns GitHub tools — user identity is resolved from the session inside getTokenForProvider
export function getGithubTools() {
  return {
    listAssignedIssues: tool({
      description: "List all open GitHub issues assigned to the user",
      parameters: z.object({ state: z.enum(["open", "closed", "all"]).optional().default("open").describe("Issue state filter") }),
      execute: async ({ state = "open" }) => {
        const token = await getTokenForProvider("github");
        const octokit = new Octokit({ auth: token });

        const { data } = await octokit.rest.issues.list({
          filter: "assigned",
          state: state as "open" | "closed" | "all",
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
      description: "Close a specific GitHub issue by number and repo",
      parameters: z.object({
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
        issueNumber: z.number().describe("Issue number to close"),
      }),
      execute: async ({ owner, repo, issueNumber }: { owner: string; repo: string; issueNumber: number }) => {
        const token = await getTokenForProvider("github");
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
      description: "Add a comment to a GitHub issue",
      parameters: z.object({
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
        issueNumber: z.number().describe("Issue number"),
        comment: z.string().describe("Comment text to add"),
      }),
      execute: async ({ owner, repo, issueNumber, comment }: { owner: string; repo: string; issueNumber: number; comment: string }) => {
        const token = await getTokenForProvider("github");
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
