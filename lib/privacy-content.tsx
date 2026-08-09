import type { ReactNode } from "react";
import { AI_PROVIDER_PRIVACY_LABEL } from "@/lib/ai-display";

export type PrivacySection = {
  id: string;
  title: string;
  body: ReactNode;
};

/** Shared between the /privacy route and the dashboard sidebar's Privacy panel. */
export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "overview",
    title: "What Anzen does",
    body: (
      <p style={{ margin: 0 }}>
        Anzen is an AI assistant that connects to your GitHub, Gmail, and Slack accounts via Auth0 Token Vault.
        It reads and acts on your behalf only when you ask, with explicit confirmation before any write action.
      </p>
    ),
  },
  {
    id: "credentials",
    title: "Credentials & Token Vault",
    body: (
      <p style={{ margin: 0 }}>
        Anzen does not store your GitHub, Google, or Slack passwords or long-lived tokens in this application.
        Provider credentials are held in Auth0 Token Vault and exchanged only when a tool runs on your request.
      </p>
    ),
  },
  {
    id: "ai",
    title: "AI processing (DeepSeek)",
    body: (
      <p style={{ margin: 0 }}>
        Chat messages and content retrieved from your connected accounts — such as email subjects, Slack message
        text, and GitHub issue titles — are sent to{" "}
        <strong style={{ fontWeight: 600 }}>{AI_PROVIDER_PRIVACY_LABEL}</strong> to generate
        responses. Do not use Anzen with highly sensitive content you do not want processed by this AI provider.
      </p>
    ),
  },
  {
    id: "storage",
    title: "Data we store",
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Per-user connection settings (read-only vs read &amp; write)</li>
        <li style={{ marginBottom: 8 }}>Audit logs of confirmed write actions (tool, outcome, timestamp)</li>
        <li>Session and identity data managed by Auth0</li>
      </ul>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <p style={{ margin: 0 }}>
        Disconnect providers anytime from Connections, set providers to read-only, or sign out to end your
        session. You may request deletion of stored settings or audit data by contacting the project owner.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p style={{ margin: 0 }}>
        Questions about this policy: contact the project owner. Final legal language will be published before
        public launch.
      </p>
    ),
  },
];
