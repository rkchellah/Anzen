import fs from "node:fs";

const path = "app/dashboard/DashboardClient.tsx";
let s = fs.readFileSync(path, "utf8");
const start = s.indexOf('        {activePage === "dashboard" && (');
const end = s.indexOf("        {/* CONNECTIONS */}");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `        {activePage === "dashboard" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)", overflow: "hidden" }}>
            <AnzenChatPanel
              messages={messages}
              input={inputValue}
              onInputChange={(value) => {
                setInputValue(value);
                if (approvalGateError) setApprovalGateError(null);
              }}
              onSubmit={handleSend}
              onSuggestion={handleSuggestion}
              isGenerating={isLoading}
              suggestions={SUGGESTIONS}
              inputDisabled={pendingApprovals.length > 0}
              placeholder={pendingApprovals.length > 0 ? "Confirm or cancel the action above first…" : "Ask Anzen anything…"}
              emptyState={
                <div className="anzen-site-x" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 32, paddingBottom: 16, gap: 28 }}>
                  <div style={{ textAlign: "center", maxWidth: 520, width: "100%" }}>
                    <h1 className="anzen-dash-hero-title" style={{ fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 12px", color: tx }}>
                      What can I<br />help with?
                    </h1>
                    <p style={{ fontSize: 15, color: muted, margin: 0, lineHeight: 1.65 }}>
                      Your AI Chief of Staff — secured by Auth0 Token Vault.
                    </p>
                  </div>
                  <div className="anzen-grid-3" style={{ width: "100%", maxWidth: 500 }}>
                    {activeProviders.map((p) => {
                      const connected = connStatus[p.key as keyof ConnectionStatus];
                      return (
                        <a
                          key={p.key}
                          href={connected || !tokenVaultScopesEnabled ? "#" : p.connectHref}
                          onClick={(e) => {
                            if (connected || !tokenVaultScopesEnabled) e.preventDefault();
                          }}
                          style={{ ...card, padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textDecoration: "none", cursor: connected || !tokenVaultScopesEnabled ? "default" : "pointer", transition: "all 0.18s", ...(connected ? { borderColor: \`\${accent}30\` } : { opacity: tokenVaultScopesEnabled ? 0.52 : 0.35 }) }}
                        >
                          <div style={{ width: 52, height: 52, background: surface2, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", border: \`1px solid \${border}\` }}>{p.icon}</div>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: tx, margin: "0 0 2px" }}>{p.label}</p>
                            <p style={{ fontSize: 11, color: muted, margin: 0 }}>{p.desc}</p>
                          </div>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? accent : subtle, display: "block", boxShadow: connected ? \`0 0 6px \${accent}\` : "none" }} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              }
              toolApprovals={
                <AnzenToolApprovals
                  messages={messages}
                  accessModes={accessModes}
                  onOpenConnections={() => setActivePage("connections")}
                  onApprove={(id, approved, reason) =>
                    addToolApprovalResponse(
                      approved
                        ? { id, approved: true }
                        : { id, approved: false, reason: reason ?? "User cancelled" }
                    )
                  }
                />
              }
              composerNotice={
                <>
                  {pendingApprovals.length > 0 && (
                    <div style={{ ...card, padding: "12px 14px", marginBottom: 10, borderColor: \`\${accent}40\`, background: accentBg }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: accentTx, margin: "0 0 4px" }}>
                        {pendingApprovals.length === 1
                          ? "1 action waiting for your confirmation"
                          : \`\${pendingApprovals.length} actions waiting for your confirmation\`}
                      </p>
                      <p style={{ fontSize: 12, color: muted, margin: 0, lineHeight: 1.45 }}>
                        Review the Confirm / Cancel cards above. New messages are paused until you respond.
                      </p>
                    </div>
                  )}
                  {approvalGateError && (
                    <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 8px", lineHeight: 1.45 }}>{approvalGateError}</p>
                  )}
                </>
              }
              footer={
                <p className="mt-2 text-center text-[11px] leading-[1.45] text-muted-foreground">
                  Chat and content from your connected accounts are processed by {AI_PROVIDER_SHORT_LABEL} to generate responses.{" "}
                  <a href="/privacy" className="underline underline-offset-2">Privacy</a>
                </p>
              }
            />
          </div>
        )}

`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(path, s);
console.log("ok", replacement.length);
