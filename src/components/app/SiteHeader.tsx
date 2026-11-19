import { Link, useNavigate } from "@tanstack/react-router";
import { Professor } from "./Professor";

import { useQueryClient } from "@tanstack/react-query";
import { accountsConfigured, classroom } from "@/lib/classroom-client";
import { useClassroomAccount } from "@/lib/classroom-progress";
import { useState } from "react";

export function PageShell({ children }: { children: React.ReactNode }) {
  const account = useClassroomAccount();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState(false);
  async function signOut() {
    const { error } = await classroom!.auth.signOut({ scope: "local" });
    if (error) {
      setSignOutError(true);
      return;
    }
    cache.clear();
    await navigate({ to: "/" });
  }
  return (
    <div className="min-h-screen bg-hero">
      <header className="border-b border-border bg-card">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:bg-card focus:p-3"
        >
          Skip to content
        </a>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <Professor size={42} eager className="rounded-full bg-primary-soft" />
            Dr. Percentile
          </Link>
          <nav aria-label="Main" className="flex flex-wrap gap-1 text-sm font-semibold">
            {(
              [
                ["/dashboard", "Dashboard"],
                ["/path", "Lessons"],
                ["/diagnostic", "Check-in"],
              ] as const
            ).map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-3 py-2 hover:bg-primary-soft"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                {label}
              </Link>
            ))}
            {account.member?.role === "guardian" && (
              <Link to="/guardian" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
                Guardian
              </Link>
            )}
            <Link to="/ask" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
              Ask Dr. P
            </Link>
            {account.user ? (
              <button
                type="button"
                className="rounded-lg px-3 py-2 hover:bg-primary-soft"
                onClick={signOut}
              >
                Sign out
              </button>
            ) : (
              accountsConfigured && (
                <Link to="/auth" className="rounded-lg px-3 py-2 hover:bg-primary-soft">
                  Sign in
                </Link>
              )
            )}
            {signOutError && <span role="alert">Sign-out failed.</span>}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
