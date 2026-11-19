import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { LessonPlayer } from "@/components/app/LessonPlayer";
import { PageShell } from "@/components/app/SiteHeader";
import { skillById } from "@/lib/curriculum";
import { useLearningProgress } from "@/lib/classroom-progress";

export const Route = createFileRoute("/lesson/$skillId")({
  loader: ({ params }) => {
    if (!skillById(params.skillId)) throw notFound();
  },
  component: Lesson,
});

function Lesson() {
  const { skillId } = Route.useParams();
  return <LessonContent key={skillId} skillId={skillId} />;
}

function LessonContent({ skillId }: { skillId: string }) {
  const skill = skillById(skillId)!;
  const { progress, ready, save, storageError, blocked } = useLearningProgress();
  useEffect(() => {
    if (ready && !blocked && progress.lastLesson !== skillId)
      void save({ kind: "resume", payload: { skillId } }).catch(() => {});
    // Save the current lesson when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, skillId, blocked]);
  const recent = progress.assessments.filter((row) => row.skillId === skillId).at(-1);
  const difficulty = !recent ? "standard" : recent.score < recent.total ? "review" : "challenge";
  const count = difficulty === "review" ? 7 : 5;
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap justify-between gap-2">
          <Link to="/path" className="font-semibold text-primary underline">
            All lessons
          </Link>
          <Link to="/dashboard" className="font-semibold text-primary underline">
            Dashboard
          </Link>
        </div>
        <h1 className="mb-4 font-display text-3xl font-bold text-primary">{skill.title}</h1>
        {storageError && <p role="alert">Your browser could not save this activity.</p>}
        {blocked && <p>Use a student account to save lesson activity.</p>}
        {ready && !blocked && (
          <LessonPlayer
            skill={skill}
            count={count}
            difficulty={difficulty}
            onAttempt={(attempt) =>
              save({
                kind: "attempt",
                payload: {
                  ...attempt,
                  given: /^[0-9+*/().%: =−÷×-]{1,72}$/.test(attempt.given) ? attempt.given : "",
                },
              }).catch(() => {})
            }
            onFinish={(score, total) => {
              void save({ kind: "assessment", payload: { skillId, score, total } }).catch(() => {});
            }}
          />
        )}
      </div>
    </PageShell>
  );
}
