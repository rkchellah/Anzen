import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <main>
      <h1>Anzen</h1>
      <p>Your AI Chief of Staff</p>
      {session ? (
        <div>
          <p>Welcome, {session.user.name}</p>
          <a href="/auth/logout">Logout</a>
        </div>
      ) : (
        <a href="/auth/login">Login</a>
      )}
    </main>
  );
}