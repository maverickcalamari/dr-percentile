import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Calculator, ChartNoAxesCombined } from "lucide-react";
import { Professor } from "@/components/app/Professor";
import { PageShell } from "@/components/app/SiteHeader";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PageShell>
      <section className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
        <div className="grid items-center gap-6 p-7 sm:p-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-semibold text-amber-200">Math adventures for ages 11–13</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
              Big ideas.
              <br />
              One step at a time.
            </h1>
            <p className="mt-4 max-w-lg text-lg">
              Meet Dr. Percentile. From multiplication to your first algebra equation, learn how
              math works and practice at your own pace.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground"
            >
              Start learning <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mx-auto rounded-full bg-amber-200/20 p-3">
            <Professor size={270} eager className="max-w-full rounded-full object-contain" />
          </div>
        </div>
      </section>
      <section aria-label="Explore the classroom" className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Find your starting point",
            icon: Calculator,
            text: "Take a short check-in and get a lesson recommendation.",
            to: "/diagnostic",
          },
          {
            title: "Browse lessons",
            icon: BookOpen,
            text: "See a worked example, then try a problem yourself.",
            to: "/path",
          },
          {
            title: "See your progress",
            icon: ChartNoAxesCombined,
            text: "Track your practice, mastery, and badges.",
            to: "/dashboard",
          },
        ].map(({ title, icon: Icon, text, to }) => (
          <Link key={title} to={to} className="classroom-card block hover:border-primary">
            <Icon className="text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold">{title}</h2>
            <p className="mt-1 text-muted-foreground">{text}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
