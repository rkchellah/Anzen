import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-mono text-4xl font-bold text-white mb-2">
          Anzen <span className="text-slate-500">安全</span>
        </h1>
        <p className="text-slate-500 font-mono text-sm mb-8">Your AI Chief of Staff</p>
        <a
          href="/auth/login"
          className="inline-block bg-[#00ff88] text-black font-mono font-bold px-6 py-3 rounded-lg hover:bg-[#00e67a] transition-colors"
        >
          Sign In
        </a>
      </div>
    </main>
  );
}