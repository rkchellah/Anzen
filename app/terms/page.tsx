import { LegalPageShell, type LegalSection } from "@/components/LegalPageShell";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <p style={{ margin: 0 }}>
        By accessing or using Anzen, you agree to these Terms of Service. If you do not agree, do not use the
        service.
      </p>
    ),
  },
  {
    id: "responsibilities",
    title: "Your responsibilities",
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Review and confirm write actions before they execute</li>
        <li style={{ marginBottom: 8 }}>Comply with GitHub, Google, and Slack terms when connecting accounts</li>
        <li>Do not use Anzen to violate others&apos; privacy or applicable law</li>
      </ul>
    ),
  },
  {
    id: "availability",
    title: "Service availability",
    body: (
      <p style={{ margin: 0 }}>
        Anzen is provided as-is during development and early access. Features, rate limits, and integrations may
        change without notice. See our Privacy Policy for how your data is handled.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "Third-party services",
    body: (
      <p style={{ margin: 0 }}>
        Anzen relies on Auth0, Groq, GitHub, Google, Slack, and hosting providers. Your use of those services is
        subject to their respective terms and privacy policies.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      kind="Terms"
      title="Terms of Service"
      subtitle="Last updated July 2026. Placeholder structure — final legal text will be provided by the project owner."
      sections={sections}
      relatedLink={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
