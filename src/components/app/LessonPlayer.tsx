import { useRef, useState } from "react";
import { Lightbulb, Volume2, Check, X, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { answersMatch, formatNumber } from "@/lib/math";
import type { Difficulty, Question, Skill } from "@/lib/curriculum";
import { speak, canSpeak } from "@/lib/tts";
import { Professor, SpeechBubble } from "./Professor";
import type { AttemptInput } from "@/lib/data";

type Phase = "learn" | "practice" | "done";

function SpeakBtn({ text }: { text: string }) {
  if (!canSpeak()) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Read aloud"
      onClick={() => speak(text)}
    >
      <Volume2 />
    </Button>
  );
}

export function LessonPlayer({
  skill,
  count = 5,
  difficulty = "standard",
  onAttempt,
  onFinish,
}: {
  skill: Skill;
  count?: number;
  difficulty?: Difficulty;
  onAttempt?: (a: AttemptInput) => Promise<void> | void;
  onFinish?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("learn");
  const [stepShown, setStepShown] = useState(1);
  const [questions] = useState<Question[]>(() =>
    Array.from({ length: count }, () => skill.generate(difficulty)),
  );
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [result, setResult] = useState<null | "right" | "wrong" | "revealed">(null);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const assessment = qi >= questions.length - 2;
  const stage = assessment ? "Assessment" : qi === 0 ? "Guided practice" : "Independent practice";
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[qi]!;
  const expected = typeof q?.answer === "number" ? formatNumber(q.answer) : String(q?.answer);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    if (!answer.trim() || result === "right" || result === "revealed") return;
    const ok = answersMatch(answer, q.answer);
    const firstTry = tries === 0;
    setTries((t) => t + 1);
    if (ok) {
      setResult("right");
      if (assessment && firstTry) setScore((s) => s + 1);
    } else {
      setResult(assessment ? "revealed" : "wrong");
      if (qi === 0 && hintsShown < q.hints.length) setHintsShown((h) => h + 1); // Socratic: offer a hint before the answer
    }
    if (firstTry)
      await onAttempt?.({
        skillId: skill.id,
        prompt: q.prompt,
        given: answer,
        expected,
        correct: ok && firstTry,
        usedHint: hintsShown > 0,
      });
  }

  function next() {
    if (qi + 1 >= questions.length) {
      setPhase("done");
      onFinish?.(score, 2);
      return;
    }
    setQi(qi + 1);
    setAnswer("");
    setHintsShown(0);
    setResult(null);
    setTries(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (phase === "learn") {
    const ex = skill.example;
    return (
      <section aria-labelledby="learn-title" className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Professor size={120} className="animate-bob shrink-0" />
          <SpeechBubble className="flex-1">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h2 id="learn-title" className="text-2xl font-semibold text-primary">
                  {skill.title}
                </h2>
                <p className="mt-2">{skill.intro}</p>
              </div>
              <SpeakBtn text={`${skill.title}. ${skill.intro}`} />
            </div>
          </SpeechBubble>
        </div>
        <div className="rounded-3xl border-2 border-secondary/30 bg-card p-5 shadow-card chalk-grid">
          <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
            Worked example
          </p>
          <p className="mt-1 font-display text-2xl">{ex.problem}</p>
          <ol className="mt-4 space-y-2" aria-live="polite">
            {ex.steps.slice(0, stepShown).map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-background/90 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {stepShown < ex.steps.length ? (
              <Button variant="teal" onClick={() => setStepShown(stepShown + 1)}>
                Next step <ArrowRight />
              </Button>
            ) : (
              <>
                <p className="w-full font-semibold text-success">Answer: {ex.answer} 🎉</p>
                <Button
                  variant="pop"
                  size="lg"
                  onClick={() => {
                    setPhase("practice");
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                >
                  Your turn — practice! <ArrowRight />
                </Button>
              </>
            )}
            <SpeakBtn text={`${ex.problem}. ${ex.steps.slice(0, stepShown).join(". ")}`} />
          </div>
        </div>
      </section>
    );
  }

  if (phase === "done") {
    const msg =
      score === 2
        ? "Perfectly multiplied! You're a star."
        : score === 1
          ? "Splendid work — practice makes progress!"
          : "Every mistake is a stepping stone. Let's try again soon!";
    return (
      <section className="flex flex-col items-center gap-4 text-center" aria-live="polite">
        <Professor size={160} className="animate-bob" />
        <h2 className="text-3xl font-semibold text-primary">Lesson complete!</h2>
        <p className="text-xl">
          You got <strong>{score}</strong> of 2 assessment questions right.
        </p>
        <p className="text-muted-foreground">{msg}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="q-title" className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {stage} · Question {qi + 1} of {questions.length}
        </span>
        <Progress
          value={(qi / questions.length) * 100}
          className="h-3 flex-1"
          aria-label="Lesson progress"
        />
      </div>
      <form
        onSubmit={check}
        className="rounded-3xl border-2 border-primary/15 bg-card p-5 shadow-card sm:p-8"
      >
        <div className="flex items-start gap-2">
          <h2 id="q-title" className="flex-1 font-display text-3xl font-semibold sm:text-4xl">
            {q.prompt}
          </h2>
          <SpeakBtn text={q.prompt} />
        </div>
        <label htmlFor="answer" className="mt-6 block text-sm font-medium">
          Your answer
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="answer"
            maxLength={72}
            ref={inputRef}
            value={answer}
            inputMode="text"
            autoComplete="off"
            onChange={(e) => {
              setAnswer(e.target.value);
              if (result === "wrong") setResult(null);
            }}
            disabled={result === "right" || result === "revealed"}
            className="h-14 rounded-xl text-2xl"
            placeholder="e.g. 42 or 3/4"
          />
          {result === "right" || result === "revealed" ? (
            <Button type="button" variant="pop" size="lg" onClick={next} autoFocus>
              {qi + 1 >= questions.length ? "Finish" : "Next"} <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" variant="pop" size="lg" disabled={!answer.trim()}>
              Check
            </Button>
          )}
        </div>

        <div aria-live="polite" className="mt-4 space-y-3">
          {result === "right" && (
            <p className="flex items-center gap-2 rounded-xl bg-success-soft p-3 font-medium text-success">
              <Check /> Correct!{" "}
              {tries > 1 ? "You worked it out — brilliant persistence." : "Spot on!"}
            </p>
          )}
          {result === "wrong" && (
            <p className="flex items-center gap-2 rounded-xl bg-destructive-soft p-3 font-medium text-destructive">
              <X /> Not quite — that's okay!{" "}
              {hintsShown > 0 ? "Here's a nudge:" : "Have another go."}
            </p>
          )}
          {q.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className="flex gap-2 rounded-xl bg-accent/30 p-3">
              <Lightbulb className="mt-1 h-5 w-5 shrink-0" />{" "}
              <span>
                <strong>Hint {i + 1}:</strong> {h}
              </span>
            </p>
          ))}
          {(result === "right" || result === "revealed") && (
            <div className="rounded-xl bg-secondary-soft p-4">
              <p className="font-semibold text-secondary">How it works</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {q.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {result === "revealed" && <p className="mt-2 font-semibold">Answer: {expected}</p>}
            </div>
          )}
        </div>

        {!assessment && result !== "right" && result !== "revealed" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hintsShown < q.hints.length ? (
              <Button type="button" variant="sunny" onClick={() => setHintsShown(hintsShown + 1)}>
                <Lightbulb /> Hint
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setResult("revealed");
                  if (tries === 0)
                    await onAttempt?.({
                      skillId: skill.id,
                      prompt: q.prompt,
                      given: "(revealed)",
                      expected,
                      correct: false,
                      usedHint: true,
                    });
                }}
              >
                <Eye /> Show me the answer
              </Button>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
