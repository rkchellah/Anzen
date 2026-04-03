import { tool } from "ai";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { exchangeTokenForProvider } from "@/lib/auth0";

const listAssignedIssuesSchema = z.object({
  state: z.enum(["open", "closed", "all"]).default("open"),
});

const closeIssueSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
});

const commentOnIssueSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  comment: z.string(),
});

export function getGithubTools(auth0Token: string) {
  return {
    listAssignedIssues: tool({
      description:
        "List GitHub issues assigned to the current user.",
      inputSchema: listAssignedIssuesSchema,
      execute: async ({ state }: z.infer<typeof listAssignedIssuesSchema>) => {
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
      inputSchema: closeIssueSchema,
      execute: async ({ owner, repo, issueNumber }: z.infer<typeof closeIssueSchema>) => {
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
      inputSchema: commentOnIssueSchema,
      execute: async ({ owner, repo, issueNumber, comment }: z.infer<typeof commentOnIssueSchema>) => {
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