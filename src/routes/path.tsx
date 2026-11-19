import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/app/SiteHeader";
import { UNITS, skillsInUnit } from "@/lib/curriculum";

export const Route = createFileRoute("/path")({ component: Path });

function Path() {
  return (
    <PageShell>
      <h1 className="font-display text-4xl font-bold text-primary">Lesson library</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Choose a topic to learn and practice.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UNITS.map((unit) => (
          <section key={unit.id} className="classroom-card">
            <h2 className="text-xl font-bold">
              <span aria-hidden="true">{unit.emoji} </span>
              {unit.title}
            </h2>
            <p className="mt-1 text-muted-foreground">{unit.blurb}</p>
            <ul className="mt-3 grid gap-2">
              {skillsInUnit(unit.id).map((skill) => (
                <li key={skill.id}>
                  <Link
                    to="/lesson/$skillId"
                    params={{ skillId: skill.id }}
                    className="block rounded-lg bg-primary-soft px-3 py-2 font-semibold text-primary hover:underline"
                  >
                    {skill.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
