import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-3xl mx-auto px-6">

        {/* Nav */}
        <nav className="flex items-center justify-between py-6 border-b border-white/10">
          <span className="font-mono text-lg font-bold tracking-tight">
            Anzen <span className="text-white/30">安全</span>
          </span>
          <a
            href="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            Sign in
          </a>
        </nav>

        {/* Hero */}
        <section className="py-24 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-mono text-white/50">agent / ready</span>
          </div>

          <h1 className="text-6xl font-bold tracking-tight leading-none">
            Monitor.<br />
            Decide.<br />
            Act.
          </h1>

          <p className="text-white/40 text-lg max-w-sm leading-relaxed">
            Your AI Chief of Staff. Connects to GitHub, Gmail, and Slack — and acts on your behalf, securely.
          </p>

          <a
            href="/auth/login"
            className="inline-block bg-[#00ff88] text-black font-mono font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#00e67a] transition-colors w-fit"
          >
            Get started →
          </a>
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-3 gap-4 pb-24">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2">
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Monitor</span>
            <p className="text-sm text-white/60 leading-relaxed">
              Watch your GitHub issues, unread emails, and Slack messages in one place.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2">
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Decide</span>
            <p className="text-sm text-white/60 leading-relaxed">
              Review and approve before the agent takes any sensitive action on your behalf.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2">
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Act</span>
            <p className="text-sm text-white/60 leading-relaxed">
              Close issues, send emails, post messages — with your permission, every time.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
