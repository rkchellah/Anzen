import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth0.getSession();
  if (session) redirect("/dashboard");

  return (
    <div
      style={{
        backgroundColor: "#0B0F14",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, -apple-system, sans-serif",
        padding: "40px 24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#111827",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          padding: "44px 40px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
              }}
            >
              Anzen
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: "#A3FF12",
                background: "rgba(163,255,18,0.12)",
                padding: "2px 6px",
                borderRadius: 4,
                lineHeight: 1.8,
              }}
            >
              AI
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.42)",
              margin: 0,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Your AI Chief of Staff
            <br />
            secured by Auth0 Token Vault
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.07)",
          }}
        />

        {/* Sign in content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Sign in to continue
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", margin: 0 }}>
            Connect GitHub, Gmail & Slack securely
          </p>
        </div>

        {/* CTA */}
        <a
          href="/auth/login"
          style={{
            width: "100%",
            padding: "13px 24px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #A3FF12, #7CFF5B)",
            color: "#000000",
            fontSize: 15,
            fontWeight: 700,
            textAlign: "center" as const,
            textDecoration: "none",
            letterSpacing: "-0.01em",
            transition: "opacity 0.15s",
            display: "block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Continue with Auth0
        </a>

        {/* Security note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "rgba(255,255,255,0.28)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={12}
            height={12}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Zero credentials stored in Anzen
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: 32,
          fontSize: 12,
          color: "rgba(255,255,255,0.22)",
          textAlign: "center",
        }}
      >
        Anzen 安全 · Powered by Auth0 Token Vault
      </p>
    </div>
  );
}