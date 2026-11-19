// Pure mastery + spaced-review rules, shared by the app and tests.
export const MASTERED_AT = 80;

export function nextMastery(prev: number, correct: boolean, usedHint: boolean): number {
  const gain = correct ? (usedHint ? 6 : 12) : -8;
  return Math.max(0, Math.min(100, prev + gain));
}

/** Review interval in days grows with mastery. */
export function reviewIntervalDays(mastery: number): number {
  if (mastery < 40) return 1;
  if (mastery < 60) return 2;
  if (mastery < MASTERED_AT) return 4;
  if (mastery < 95) return 7;
  return 14;
}

export function addDays(d: Date, days: number): string {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x.toISOString().slice(0, 10);
}

export type BadgeDef = { id: string; name: string; emoji: string; desc: string };
export const BADGES: BadgeDef[] = [
  { id: "first-step", name: "First Step", emoji: "🌱", desc: "Answer your first question" },
  { id: "ten-correct", name: "Ten Tremendous", emoji: "🔟", desc: "Get 10 answers right" },
  { id: "times-titan", name: "Times Titan", emoji: "✖️", desc: "Master a multiplication skill" },
  { id: "divide-dynamo", name: "Divide Dynamo", emoji: "➗", desc: "Master a division skill" },
  { id: "mastery-1", name: "Mastermind", emoji: "🎓", desc: "Master any skill" },
  { id: "hint-humble", name: "Brave Asker", emoji: "💡", desc: "Use a hint and still get it right" },
];

export function earnedBadges(stats: {
  totalAttempts: number;
  totalCorrect: number;
  masteredSkills: string[];
  correctWithHint: boolean;
}): string[] {
  const b: string[] = [];
  if (stats.totalAttempts >= 1) b.push("first-step");
  if (stats.totalCorrect >= 10) b.push("ten-correct");
  if (stats.masteredSkills.some((s) => s.startsWith("mul"))) b.push("times-titan");
  if (stats.masteredSkills.some((s) => s.startsWith("div"))) b.push("divide-dynamo");
  if (stats.masteredSkills.length > 0) b.push("mastery-1");
  if (stats.correctWithHint) b.push("hint-humble");
  return b;
}
