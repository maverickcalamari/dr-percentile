import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/app/SiteHeader";
import { accountsConfigured, classroom } from "@/lib/classroom-client";

export const Route = createFileRoute("/auth")({ component: SignIn });

function SignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <PageShell>
      <section className="classroom-card mx-auto max-w-md space-y-4">
        <h1 className="font-display text-4xl font-bold text-primary">Sign in</h1>
        {accountsConfigured ? (
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setBusy(true);
              const fields = new FormData(event.currentTarget);
              try {
                const result = await classroom!.auth.signInWithPassword({
                  email: String(fields.get("email")),
                  password: String(fields.get("password")),
                });
                if (result.error)
                  setError(
                    "Sign-in failed. Check the email and password provided by your classroom administrator.",
                  );
                else await navigate({ to: "/dashboard" });
              } catch {
                setError("We couldn’t reach the account service. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>Use the account provided by your classroom administrator.</p>
            <label className="grid gap-1">
              Email
              <input
                className="rounded-lg border p-2"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label className="grid gap-1">
              Password
              <input
                className="rounded-lg border p-2"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <Button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        ) : (
          <p>Accounts are unavailable on this deployment. You can still use the guest classroom.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <Link to="/dashboard" className="font-semibold text-primary underline">
          Classroom dashboard
        </Link>
      </section>
    </PageShell>
  );
}
