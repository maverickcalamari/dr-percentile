import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/app/SiteHeader";
import { Professor } from "@/components/app/Professor";
import { SKILLS, skillById, skillsInUnit } from "@/lib/curriculum";
import { day } from "@/lib/demo-progress";
import { addDays, BADGES, earnedBadges, MASTERED_AT, nextMastery } from "@/lib/progress";

import { useLearningProgress } from "@/lib/classroom-progress";
export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { progress, ready, account, blocked, storageError } = useLearningProgress();
  const dates = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index - 6));
  const daily = dates.map(
    (date) => progress.attempts.filter((attempt) => attempt.date === date).length,
  );
  const activeDates = new Set(progress.attempts.map((attempt) => attempt.date));
  let streak = 0;
  for (
    let offset = activeDates.has(day()) ? 0 : -1;
    activeDates.has(addDays(new Date(), offset));
    offset--
  )
    streak++;
  const mastery = new Map<string, number>();
  for (const attempt of progress.attempts)
    mastery.set(
      attempt.skillId,
      nextMastery(mastery.get(attempt.skillId) ?? 0, attempt.correct, attempt.usedHint),
    );
  const masteredSkills = [...mastery].filter(([, value]) => value >= MASTERED_AT).map(([id]) => id);
  const badges = earnedBadges({
    totalAttempts: progress.attempts.length,
    totalCorrect: progress.attempts.filter((attempt) => attempt.correct).length,
    masteredSkills,
    correctWithHint: progress.attempts.some((attempt) => attempt.correct && attempt.usedHint),
  });
  const completedIds = new Set(progress.assessments.map((row) => row.skillId));
  const passedIds = new Set(
    progress.assessments.filter((row) => row.score === row.total).map((row) => row.skillId),
  );
  const last = progress.lastLesson ? skillById(progress.lastLesson) : undefined;
  const suggestedSkills = progress.startUnit ? skillsInUnit(progress.startUnit) : SKILLS;
  const recommended =
    suggestedSkills.find((skill) => !passedIds.has(skill.id)) ??
    SKILLS.find((skill) => !passedIds.has(skill.id)) ??
    [...SKILLS].sort((a, b) => (mastery.get(a.id) ?? 0) - (mastery.get(b.id) ?? 0))[0];
  return (
    <PageShell>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div>
          <p className="text-sm font-semibold text-amber-200">
            {account.member ? "Your classroom" : "Guest classroom"}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            Welcome, {account.member?.nickname || "math explorer"}!
          </h1>
          <p className="mt-2">
            {account.member
              ? "Pick up where you left off."
              : "Guest progress is saved in this browser."}
          </p>
        </div>
        <Professor size={110} eager className="rounded-full bg-amber-200/20" />
      </section>
      {storageError ? (
        <p role="alert">We couldn’t load your progress.</p>
      ) : blocked ? (
        <p className="mt-4">
          {account.member?.role === "guardian" ? (
            <Link to="/guardian" className="font-bold text-primary underline">
              Open the guardian dashboard
            </Link>
          ) : (
            "Ask your classroom administrator to activate this account."
          )}
        </p>
      ) : !ready ? (
        <p role="status" className="mt-4">
          Loading your progress…
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="classroom-card space-y-3">
            <h2 className="text-xl font-bold">Today’s goal</h2>
            <p>
              {daily[6]} of 10 questions · {streak} day{streak === 1 ? "" : "s"} in a row
            </p>
            <progress
              className="w-full accent-primary"
              aria-label="Daily question goal"
              max={10}
              value={Math.min(daily[6] ?? 0, 10)}
            />
            {last && (
              <Link
                to="/lesson/$skillId"
                className="block font-bold text-primary underline"
                params={{ skillId: last.id }}
              >
                Resume {last.title}
              </Link>
            )}
            {recommended && (
              <Link
                to="/lesson/$skillId"
                className="block font-bold text-primary underline"
                params={{ skillId: recommended.id }}
              >
                Recommended: {recommended.title}
              </Link>
            )}
          </section>
          <section className="classroom-card">
            <h2 className="text-xl font-bold">Weekly activity</h2>
            <div className="mt-3 grid grid-cols-7 items-end gap-1 text-center text-xs">
              {dates.map((date, index) => (
                <div key={date}>
                  <span>{daily[index]}</span>
                  <div
                    aria-hidden="true"
                    className="mx-auto my-1 w-3/4 rounded-t bg-primary"
                    style={{ height: 4 + (54 * (daily[index] ?? 0)) / Math.max(1, ...daily) }}
                  />
                  <time dateTime={date}>{date.slice(5).replace("-", "/")}</time>
                </div>
              ))}
            </div>
          </section>
          <section className="classroom-card">
            <h2 className="text-xl font-bold">Topic mastery</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SKILLS.map((skill) => (
                <li key={skill.id}>
                  <span className="block text-sm">
                    {skill.title} · {mastery.get(skill.id) ?? 0}%
                  </span>
                  <progress
                    className="w-full accent-primary"
                    aria-label={skill.title}
                    max={100}
                    value={mastery.get(skill.id) ?? 0}
                  />
                </li>
              ))}
            </ul>
          </section>
          <section className="classroom-card space-y-3">
            <h2 className="text-xl font-bold">Achievements</h2>
            {badges.length ? (
              <ul>
                {BADGES.filter((badge) => badges.includes(badge.id)).map((badge) => (
                  <li key={badge.id}>
                    {badge.emoji} {badge.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Answer your first question to earn a badge.</p>
            )}
            <h2 className="text-xl font-bold">Completed lessons</h2>
            {completedIds.size ? (
              <ul>
                {[...completedIds].map((id) => {
                  const result = progress.assessments.filter((row) => row.skillId === id).at(-1)!;
                  return (
                    <li key={id}>
                      {skillById(id)?.title} · {result.score}/{result.total}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Your lesson results will appear here.</p>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
