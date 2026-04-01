export default function SignedOutPage() {
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
          gap: 28,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 24,
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

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(163,255,18,0.08)",
            border: "1px solid rgba(163,255,18,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="#A3FF12"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            You&apos;ve been signed out
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.42)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Your session has ended. All tokens
            <br />
            remain secured in Auth0 Token Vault.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.07)",
          }}
        />

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
            display: "block",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Sign back in
        </a>
      </div>

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