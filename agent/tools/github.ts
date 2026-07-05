import { tool, jsonSchema } from "ai";
import { Octokit } from "@octokit/rest";
import { exchangeTokenForProvider } from "@/lib/auth0";
import { runAuditedWrite } from "@/lib/audit-log";
import { throwToolError } from "@/lib/tool-errors";
import { assertWriteAllowed } from "@/lib/tool-permissions";
import { assertWriteMatchesLatestUserIntent } from "@/lib/write-execute-guard";
import { wrapUntrustedExternalContent } from "@/agent/wrap-untrusted-content";

const GITHUB_PROVIDER = "github" as const;

const GITHUB_AFFILIATION =
  "owner,collaborator,organization_member,organization_owner" as const;

type IssueState = "open" | "closed" | "all";

type MappedIssue = {
  issueNumber: number;
  owner: string;
  repo: string;
  title: string;
  url: string;
  createdAt: string;
  assignees: string[];
  assignedToMe: boolean;
};

function repoOwnerAndName(issue: {
  repository?: { full_name?: string | null } | null;
  repository_url?: string;
}): { owner: string; repo: string } {
  const fullName = issue.repository?.full_name;
  if (fullName) {
    const [owner = "unknown", repo = "unknown"] = fullName.split("/");
    return { owner, repo };
  }
  const match = issue.repository_url?.match(/\/repos\/([^/]+)\/([^/]+)(?:\/|$)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return { owner: "unknown", repo: "unknown" };
}

function mapIssue(
  issue: {
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    assignees?: Array<{ login?: string | null } | null> | null;
    repository?: { full_name?: string | null } | null;
    repository_url?: string;
  },
  githubLogin: string
): MappedIssue {
  const { owner, repo } = repoOwnerAndName(issue);
  const assignees =
    issue.assignees
      ?.map((a) => a?.login)
      .filter((login): login is string => typeof login === "string" && login.length > 0) ??
    [];
  return {
    issueNumber: issue.number,
    owner,
    repo,
    title: issue.title,
    url: issue.html_url,
    createdAt: issue.created_at,
    assignees,
    assignedToMe: assignees.includes(githubLogin),
  };
}

async function fetchUserIssues(
  octokit: Octokit,
  githubLogin: string,
  filter: "assigned" | "created",
  state: IssueState
): Promise<MappedIssue[]> {
  const { data } = await octokit.rest.issues.listForAuthenticatedUser({
    filter,
    state,
    per_page: 50,
    affiliation: GITHUB_AFFILIATION,
  });
  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => mapIssue(issue, githubLogin));
}

export function getGithubTools(auth0Token: string, userId: string) {
  return {
    listAssignedIssues: tool({
      description:
        "List GitHub issues assigned to the connected GitHub account. Also returns issues the user created but did not assign to themselves when the assigned list is empty — explain that distinction to the user.",
      inputSchema: jsonSchema<{ state: IssueState }>({
        type: "object",
        properties: {
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
        },
      }),
      execute: async ({ state = "open" }) => {
        try {
          const token = await exchangeTokenForProvider(auth0Token, GITHUB_PROVIDER);
          const octokit = new Octokit({ auth: token });
          const { data: user } = await octokit.rest.users.getAuthenticated();
          const githubLogin = user.login;

          const assignedIssues = await fetchUserIssues(octokit, githubLogin, "assigned", state);

          let createdButNotAssigned: MappedIssue[] = [];
          if (assignedIssues.length === 0) {
            const created = await fetchUserIssues(octokit, githubLogin, "created", state);
            createdButNotAssigned = created.filter((issue) => !issue.assignedToMe);
          }

          return wrapUntrustedExternalContent({
            connectedGitHubLogin: githubLogin,
            assignedIssues,
            createdButNotAssigned,
            hint:
              assignedIssues.length === 0 && createdButNotAssigned.length > 0
                ? "These issues exist but are not assigned to you on GitHub. Assign yourself on the issue page to include them in assigned-only queries, or use listRepoIssues / closeIssue with owner, repo, and issueNumber."
                : assignedIssues.length === 0
                  ? "No issues are assigned to this GitHub account for the requested state."
                  : undefined,
          });
        } catch (error) {
          throwToolError("listAssignedIssues", error, GITHUB_PROVIDER);
        }
      },
    }),

    listRepoIssues: tool({
      description:
        "List issues in a specific GitHub repository (owner/repo). Use when assigned issues are empty but the user wants to close or discuss an issue in a repo they name (e.g. rkchellah/Anzen). Also use when the user gives owner, repo, and optionally issue number.",
      inputSchema: jsonSchema<{ owner: string; repo: string; state: "open" | "closed" | "all" }>({
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner login" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
        },
        required: ["owner", "repo"],
      }),
      execute: async ({ owner, repo, state = "open" }) => {
        try {
          const token = await exchangeTokenForProvider(auth0Token, GITHUB_PROVIDER);
          const octokit = new Octokit({ auth: token });
          const { data: user } = await octokit.rest.users.getAuthenticated();
          const { data } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state,
            per_page: 30,
          });
          return wrapUntrustedExternalContent({
            connectedGitHubLogin: user.login,
            owner,
            repo,
            issues: data
              .filter((issue) => !issue.pull_request)
              .map((issue) => mapIssue(issue, user.login)),
          });
        } catch (error) {
          throwToolError("listRepoIssues", error, GITHUB_PROVIDER);
        }
      },
    }),

    closeIssue: tool({
      description:
        "Close a GitHub issue. Requires owner, repo, and issueNumber. If the user names a repo (owner/repo) or issue number, use listRepoIssues or parse their message — do not require assignment. If assigned list is empty, call listRepoIssues for the repo they mention.",
      needsApproval: true,
      inputSchema: jsonSchema<{ owner: string; repo: string; issueNumber: number }>({
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issueNumber: { type: "number" },
        },
        required: ["owner", "repo", "issueNumber"],
      }),
      execute: async ({ owner, repo, issueNumber }, { messages }) => {
        try {
          assertWriteMatchesLatestUserIntent(
            "closeIssue",
            { owner, repo, issueNumber },
            messages
          );
          return await runAuditedWrite(
            userId,
            "closeIssue",
            { owner, repo, issueNumber },
            async () => {
              await assertWriteAllowed(userId, "github");
              const token = await exchangeTokenForProvider(auth0Token, GITHUB_PROVIDER);
              const octokit = new Octokit({ auth: token });
              await octokit.rest.issues.update({
                owner,
                repo,
                issue_number: issueNumber,
                state: "closed",
              });
              return { success: true, message: `Issue #${issueNumber} in ${owner}/${repo} closed` };
            }
          );
        } catch (error) {
          throwToolError("closeIssue", error, GITHUB_PROVIDER);
        }
      },
    }),

    commentOnIssue: tool({
      description: "Add a comment to a GitHub issue. Use owner, repo, issueNumber from listAssignedIssues or listRepoIssues.",
      needsApproval: true,
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
      execute: async ({ owner, repo, issueNumber, comment }, { messages }) => {
        try {
          assertWriteMatchesLatestUserIntent(
            "commentOnIssue",
            { owner, repo, issueNumber, comment },
            messages
          );
          return await runAuditedWrite(
            userId,
            "commentOnIssue",
            { owner, repo, issueNumber, comment },
            async () => {
              await assertWriteAllowed(userId, "github");
              const token = await exchangeTokenForProvider(auth0Token, GITHUB_PROVIDER);
              const octokit = new Octokit({ auth: token });
              const { data } = await octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body: comment,
              });
              return { success: true, message: `Comment added`, commentUrl: data.html_url };
            }
          );
        } catch (error) {
          throwToolError("commentOnIssue", error, GITHUB_PROVIDER);
        }
      },
    }),
  };
}
