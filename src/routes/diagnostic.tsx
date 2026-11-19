import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/app/SiteHeader";
import {
  DIAGNOSTIC_SKILLS,
  skillById,
  skillsInUnit,
  startUnitFromDiagnostic,
} from "@/lib/curriculum";
import { answersMatch } from "@/lib/math";
import { useLearningProgress } from "@/lib/classroom-progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diagnostic")({ component: Diagnostic });

function Diagnostic() {
  const { ready, save, blocked, storageError } = useLearningProgress();
  const [questions, setQuestions] = useState<
    ReturnType<NonNullable<ReturnType<typeof skillById>>["generate"]>[]
  >([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [answer, setAnswer] = useState("");
  const question = questions[results.length];
  const complete = questions.length > 0 && !question;
  const recommended = complete ? skillsInUnit(startUnitFromDiagnostic(results))[0] : undefined;

  function submit(nextAnswer: string) {
    if (!question) return;
    const next = [...results, answersMatch(nextAnswer, question.answer)];
    setResults(next);
    setAnswer("");
    if (next.length === questions.length)
      void save({ kind: "diagnostic", payload: { unit: startUnitFromDiagnostic(next) } }).catch(
        () => {},
      );
  }

  return (
    <PageShell>
      <section className="classroom-card mx-auto max-w-xl space-y-4">
        <h1 className="font-display text-4xl font-bold text-primary">Find your starting point</h1>
        {storageError && <p role="alert">We couldn’t save your check-in.</p>}
        {blocked && <p>Use a student account to take the check-in.</p>}
        {!questions.length && (
          <>
            <p>
              Try {DIAGNOSTIC_SKILLS.length} questions across math topics. Skip any question you’re
              unsure about.
            </p>
            <Button
              disabled={!ready || blocked}
              onClick={() => setQuestions(DIAGNOSTIC_SKILLS.map((id) => skillById(id)!.generate()))}
            >
              Start check-in
            </Button>
          </>
        )}
        {question && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit(answer);
            }}
          >
            <p className="text-sm text-muted-foreground">
              Question {results.length + 1} of {questions.length}
            </p>
            <label htmlFor="diagnostic-answer" className="text-xl font-bold">
              {question.prompt}
            </label>
            {question.choices ? (
              <select
                id="diagnostic-answer"
                required
                className="rounded-lg border p-2"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              >
                <option value="">Choose an answer</option>
                {question.choices.map((choice) => (
                  <option key={choice}>{choice}</option>
                ))}
              </select>
            ) : (
              <input
                id="diagnostic-answer"
                required
                className="rounded-lg border p-2"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
            )}
            <div className="flex gap-2">
              <Button type="submit">Continue</Button>
              <Button type="button" variant="outline" onClick={() => submit("")}>
                Skip
              </Button>
            </div>
          </form>
        )}
        {complete && (
          <div aria-live="polite">
            <p>
              You got {results.filter(Boolean).length} of {questions.length} right.
            </p>
            {recommended && (
              <Link
                className="mt-3 inline-block font-bold text-primary underline"
                to="/lesson/$skillId"
                params={{ skillId: recommended.id }}
              >
                Start with {recommended.title}
              </Link>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
