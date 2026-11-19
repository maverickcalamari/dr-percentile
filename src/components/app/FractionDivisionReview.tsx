import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fractionText, solveFractionDivision } from "@/lib/fraction-division";

export function FractionDivisionReview() {
  const [total, setTotal] = useState("");
  const [divisor, setDivisor] = useState("");
  const [whole, setWhole] = useState(false);
  const [guide, setGuide] = useState<ReturnType<typeof solveFractionDivision>>();
  const [visibleSteps, setVisibleSteps] = useState(1);
  const label = "h-10 rounded-lg border bg-background px-3";

  return (
    <section className="classroom-card mt-5 space-y-4">
      <h2 className="text-2xl font-bold text-primary">Work through fraction division</h2>
      <p>
        For a tape diagram, enter the length to measure and the length of one group. For a word
        problem, divide the total by the amount per group to find the number of groups, or divide
        the total by the number of groups to find the amount in one group.
      </p>
      <p className="text-sm text-muted-foreground">
        Use whole numbers, fractions like 2/3, or mixed numbers like 9 2/3.
      </p>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setGuide(solveFractionDivision(total, divisor));
          setVisibleSteps(1);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            Total (dividend)
            <input
              required
              className={label}
              maxLength={24}
              value={total}
              onChange={(event) => {
                setTotal(event.target.value);
                setGuide(undefined);
              }}
            />
          </label>
          <label className="grid gap-1">
            Group size or number of groups (divisor)
            <input
              required
              className={label}
              maxLength={24}
              value={divisor}
              onChange={(event) => {
                setDivisor(event.target.value);
                setGuide(undefined);
              }}
            />
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={whole}
            onChange={(event) => setWhole(event.target.checked)}
          />{" "}
          Count only complete groups
        </label>
        <Button className="justify-self-start">Work it out</Button>
      </form>
      {guide === null && (
        <p role="alert">Enter valid nonnegative quantities and a divisor greater than zero.</p>
      )}
      {guide && (
        <div className="space-y-3 rounded-xl bg-primary-soft p-4" aria-live="polite">
          <ol className="list-decimal space-y-2 pl-6">
            {guide.steps.slice(0, visibleSteps).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {visibleSteps < guide.steps.length ? (
            <Button variant="outline" onClick={() => setVisibleSteps(visibleSteps + 1)}>
              Show next step
            </Button>
          ) : (
            <p className="font-bold">
              {whole
                ? `${guide.wholeGroups} complete group${guide.wholeGroups === 1 ? "" : "s"} (exact quotient: ${fractionText(guide.exact)})`
                : `Exact quotient: ${fractionText(guide.exact)}`}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
