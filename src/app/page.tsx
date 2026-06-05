import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Auth Architecture</p>
        <h1>ZimPulse</h1>
        <p className="lead">
          Users sign in with one-time email links. Admins sign in with email and password.
        </p>
        <div className="hero-actions">
          <Link className="auth-button" href="/sign-up">
            User sign-up
          </Link>
          <Link className="auth-button" href="/sign-in">
            User sign-in
          </Link>
        </div>
      </section>
    </main>
  );
}
