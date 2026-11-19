import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/app/SiteHeader";
import { classroom } from "@/lib/classroom-client";
import { useClassroomAccount, useStudentHistory } from "@/lib/classroom-progress";
import { skillById } from "@/lib/curriculum";
import { addDays, nextMastery } from "@/lib/progress";

export const Route = createFileRoute("/guardian")({ component: Guardian });

function Guardian() {
  const { member, loading, error } = useClassroomAccount();
  const linked = useQuery({
    queryKey: ["linked-students", member?.id],
    enabled: member?.role === "guardian",
    queryFn: async () => {
      const { data, error } = await classroom!
        .from("classroom_members")
        .select("id,nickname")
        .eq("role", "student")
        .order("nickname");
      if (error) throw error;
      return data;
    },
  });
  return (
    <PageShell>
      <h1 className="mb-5 font-display text-4xl font-bold text-primary">Guardian dashboard</h1>
      {error || linked.isError ? (
        <p role="alert">We couldn’t load the classroom.</p>
      ) : loading || (linked.isPending && member?.role === "guardian") ? (
        <p role="status">Loading classroom…</p>
      ) : member?.role !== "guardian" ? (
        <p>
          Use a guardian account.{" "}
          <Link to="/auth" className="font-bold text-primary underline">
            Sign in
          </Link>
        </p>
      ) : linked.data?.length ? (
        <div className="grid gap-4">
          {linked.data.map((student) => (
            <StudentSummary key={student.id} student={student} viewerId={member.id} />
          ))}
        </div>
      ) : (
        <p>Your classroom administrator can link a student to your account.</p>
      )}
    </PageShell>
  );
}

function StudentSummary({
  student,
  viewerId,
}: {
  student: { id: string; nickname: string };
  viewerId: string;
}) {
  const history = useStudentHistory(student.id, viewerId);
  const progress = history.data;
  const mastery = new Map<string, number>();
  for (const attempt of progress?.attempts ?? [])
    mastery.set(
      attempt.skillId,
      nextMastery(mastery.get(attempt.skillId) ?? 0, attempt.correct, attempt.usedHint),
    );
  const topics = [...mastery].sort((left, right) => right[1] - left[1]);
  const recent = progress?.assessments.slice(-8).reverse() ?? [];
  const week = addDays(new Date(), -6);
  return (
    <section className="classroom-card space-y-3">
      <h2 className="text-2xl font-bold">{student.nickname}</h2>
      {history.isError ? (
        <p role="alert">Progress couldn’t be loaded.</p>
      ) : progress ? (
        <>
          <p>
            {new Set(progress.assessments.map((result) => result.skillId)).size} lessons completed ·{" "}
            {progress.attempts.filter((attempt) => attempt.date >= week).length} questions in the
            past 7 days
          </p>
          {topics.length ? (
            <>
              <p>
                <strong>Highest mastery</strong> · {skillById(topics[0]![0])?.title} (
                {topics[0]![1]}%)
              </p>
              <p>
                <strong>Suggested practice</strong> · {skillById(topics.at(-1)![0])?.title} (
                {topics.at(-1)![1]}%)
              </p>
            </>
          ) : (
            <p>Practice a lesson to see topic recommendations.</p>
          )}
          <h3 className="font-bold">Recent results</h3>
          {recent.length ? (
            <ul>
              {recent.map((result, index) => (
                <li key={index}>
                  {result.date} · {skillById(result.skillId)?.title} · {result.score}/{result.total}
                </li>
              ))}
            </ul>
          ) : (
            <p>No assessments yet.</p>
          )}
        </>
      ) : (
        <p role="status">Loading progress…</p>
      )}
    </section>
  );
}
