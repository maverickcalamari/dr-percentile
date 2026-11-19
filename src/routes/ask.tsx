import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/app/SiteHeader";
import { Professor } from "@/components/app/Professor";
import { Button } from "@/components/ui/button";
import { accountsConfigured, classroom } from "@/lib/classroom-client";
import { useLearningProgress } from "@/lib/classroom-progress";
import { skillById } from "@/lib/curriculum";

export const Route = createFileRoute("/ask")({ component: Ask });

function Ask() {
  const { account, progress, blocked } = useLearningProgress();
  const [problem, setProblem] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [turns, setTurns] = useState<{ question: string; reply: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canChat = account.member?.role === "student" && account.member.ai_allowed;
  const mistakes = blocked
    ? []
    : progress.attempts
        .filter((attempt) => !attempt.correct)
        .slice(-5)
        .reverse();

  async function ask() {
    setError("");
    setBusy(true);
    try {
      const { data } = await classroom!.auth.getSession();
      if (!data.session) throw new Error("Sign in again to continue.");
      const result = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + data.session.access_token,
        },
        body: JSON.stringify({ problem, followUp, hint: Math.min(3, turns.length + 1) }),
      });
      const reply = await result.json();
      if (!result.ok) throw new Error(reply.error);
      setTurns((previous) => [
        ...previous,
        {
          question: followUp || (previous.length ? "Another hint, please." : problem),
          reply: reply.message,
        },
      ]);
      setFollowUp("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The tutor could not reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-3xl gap-4">
        <section className="classroom-card space-y-4">
          <div className="flex items-center gap-3">
            <Professor size={72} className="rounded-full bg-primary-soft" />
            <h1 className="font-display text-4xl font-bold text-primary">Ask Dr. Percentile</h1>
          </div>
          {canChat ? (
            <>
              <p>Share the math problem and what you tried. Leave out names and contact details.</p>
              <ol aria-live="polite" className="grid gap-3">
                {turns.map((turn, index) => (
                  <li key={index} className="rounded-xl bg-primary-soft p-3">
                    <p>
                      <strong>You:</strong> {turn.question}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">
                      <strong>Dr. P:</strong> {turn.reply}
                    </p>
                  </li>
                ))}
              </ol>
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void ask();
                }}
              >
                {turns.length ? (
                  <label className="grid gap-1">
                    Follow-up (optional)
                    <input
                      maxLength={250}
                      className="rounded-lg border p-2"
                      value={followUp}
                      onChange={(event) => setFollowUp(event.target.value)}
                    />
                  </label>
                ) : (
                  <label className="grid gap-1">
                    Math problem
                    <textarea
                      required
                      maxLength={500}
                      className="rounded-lg border p-2"
                      value={problem}
                      onChange={(event) => setProblem(event.target.value)}
                    />
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy}>
                    {busy ? "Thinking…" : turns.length ? "Get another hint" : "Get a hint"}
                  </Button>
                  {!!turns.length && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setTurns([]);
                        setProblem("");
                        setFollowUp("");
                        setError("");
                      }}
                    >
                      New question
                    </Button>
                  )}
                </div>
              </form>
              {error && <p role="alert">{error}</p>}
            </>
          ) : (
            <p>
              AI chat is available to enabled student accounts. Every lesson has guided hints.{" "}
              {accountsConfigured && !account.user && (
                <Link className="font-bold text-primary underline" to="/auth">
                  Sign in
                </Link>
              )}
            </p>
          )}
          <Link to="/path" className="inline-block font-bold text-primary underline">
            Browse guided lessons
          </Link>
        </section>
        <section className="classroom-card">
          <h2 className="text-xl font-bold">Review recent mistakes</h2>
          {mistakes.length ? (
            <ul className="mt-3 grid gap-2">
              {mistakes.map((attempt, index) => (
                <li key={index}>
                  <Link
                    className="font-semibold text-primary underline"
                    to="/lesson/$skillId"
                    params={{ skillId: attempt.skillId }}
                  >
                    {skillById(attempt.skillId)?.title ?? "Practice"}
                  </Link>
                  <p>
                    {attempt.prompt} · Expected: {attempt.expected}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Practice a lesson to see problems to review here.</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}
