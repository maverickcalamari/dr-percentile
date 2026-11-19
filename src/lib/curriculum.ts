import { formatNumber, gcd } from "./math";

export type Question = {
  prompt: string;
  answer: number | string;
  /** Socratic hints, revealed one at a time before the answer. */
  hints: string[];
  /** Full worked solution, shown after answering or giving up. */
  steps: string[];
  choices?: string[];
};

export type Skill = {
  id: string;
  unit: string;
  title: string;
  level: number; // 1..9 order in path
  intro: string;
  example: { problem: string; steps: string[]; answer: string };
  generate: () => Question;
};

export type Unit = { id: string; title: string; emoji: string; blurb: string };

export const UNITS: Unit[] = [
  { id: "number-sense", title: "Number Sense", emoji: "🔢", blurb: "Place value & comparing" },
  { id: "add-sub", title: "Addition & Subtraction", emoji: "➕", blurb: "Regrouping with confidence" },
  { id: "mul-div", title: "Multiplication & Division", emoji: "✖️", blurb: "Dr. P's favourite!" },
  { id: "fractions", title: "Fractions", emoji: "🍕", blurb: "Parts of a whole" },
  { id: "decimals", title: "Decimals", emoji: "🔘", blurb: "Tenths & hundredths" },
  { id: "percents", title: "Percentages", emoji: "💯", blurb: "Out of a hundred" },
  { id: "ratios", title: "Ratios & Proportions", emoji: "⚖️", blurb: "Comparing quantities" },
  { id: "prealgebra", title: "Pre-algebra", emoji: "🧮", blurb: "Order of operations & integers" },
  { id: "algebra", title: "Algebra", emoji: "🔤", blurb: "Solving for x" },
];

const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)] as T;

export const SKILLS: Skill[] = [
  {
    id: "ns-place-value", unit: "number-sense", title: "Place value", level: 1,
    intro: "Every digit has a job depending on where it sits: ones, tens, hundreds, thousands…",
    example: { problem: "What is the value of the 4 in 3,482?", steps: ["Count places from the right: 2 is ones, 8 is tens, 4 is hundreds.", "So the 4 means 4 hundreds = 400."], answer: "400" },
    generate: () => {
      const n = r(1000, 9999); const digits = String(n).split("");
      const idx = r(0, 3); const place = [1000, 100, 10, 1][idx]!; const d = Number(digits[idx]);
      const name = ["thousands", "hundreds", "tens", "ones"][idx];
      return { prompt: `What is the value of the digit ${d} in position ${idx + 1} of ${n.toLocaleString("en-US")}? (counting from the left)`, answer: d * place,
        hints: ["Which place is that digit in — ones, tens, hundreds or thousands?", `It's in the ${name} place. What is ${d} × ${place}?`],
        steps: [`The digit ${d} sits in the ${name} place.`, `${d} × ${place} = ${d * place}`] };
    },
  },
  {
    id: "as-add-regroup", unit: "add-sub", title: "Adding with regrouping", level: 2,
    intro: "Add column by column from the right. If a column makes 10 or more, carry the extra ten to the next column.",
    example: { problem: "478 + 365", steps: ["Ones: 8 + 5 = 13 → write 3, carry 1.", "Tens: 7 + 6 + 1 = 14 → write 4, carry 1.", "Hundreds: 4 + 3 + 1 = 8.", "Answer: 843"], answer: "843" },
    generate: () => { const a = r(120, 899), b = r(120, 899);
      return { prompt: `${a} + ${b} = ?`, answer: a + b,
        hints: ["Start with the ones column. What do the two ones digits add to?", "Remember to carry if a column reaches 10 or more."],
        steps: [`Add ones, then tens, then hundreds, carrying when needed.`, `${a} + ${b} = ${a + b}`] }; },
  },
  {
    id: "as-sub-regroup", unit: "add-sub", title: "Subtracting with borrowing", level: 2,
    intro: "Subtract column by column from the right. If the top digit is too small, borrow a ten from the next column.",
    example: { problem: "602 − 247", steps: ["Ones: 2 − 7 can't, borrow → 12 − 7 = 5.", "Tens: 0 became 9 after borrowing through: 9 − 4 = 5.", "Hundreds: 5 − 2 = 3.", "Answer: 355"], answer: "355" },
    generate: () => { const a = r(300, 999), b = r(100, a - 50);
      return { prompt: `${a} − ${b} = ?`, answer: a - b,
        hints: ["Look at the ones column. Is the top digit big enough?", `Check: your answer + ${b} should equal ${a}.`],
        steps: [`Subtract column by column, borrowing when needed.`, `${a} − ${b} = ${a - b}`, `Check: ${a - b} + ${b} = ${a} ✓`] }; },
  },
  {
    id: "mul-facts", unit: "mul-div", title: "Times tables", level: 3,
    intro: "Multiplication is fast repeated addition. 6 × 4 means four groups of six. Dr. P's trick: break a hard fact into easy ones!",
    example: { problem: "7 × 8", steps: ["Break 8 into 5 + 3.", "7 × 5 = 35 and 7 × 3 = 21.", "35 + 21 = 56."], answer: "56" },
    generate: () => { const a = r(2, 12), b = r(2, 12);
      return { prompt: `${a} × ${b} = ?`, answer: a * b,
        hints: [`Do you know ${a} × ${Math.min(b, 5)}? Start there.`, b > 5 ? `${a} × ${b} = ${a} × 5 + ${a} × ${b - 5}` : `Count up in ${a}s, ${b} times.`],
        steps: [`${a} × ${b} means ${b} groups of ${a}.`, `${a} × ${b} = ${a * b}`] }; },
  },
  {
    id: "mul-multi", unit: "mul-div", title: "Multi-digit multiplication", level: 3,
    intro: "Split the bigger number into tens and ones (the area model), multiply each part, then add.",
    example: { problem: "23 × 14", steps: ["23 × 10 = 230", "23 × 4 = 92", "230 + 92 = 322"], answer: "322" },
    generate: () => { const a = r(12, 98), b = r(11, 39); const t = Math.floor(b / 10) * 10, o = b % 10;
      return { prompt: `${a} × ${b} = ?`, answer: a * b,
        hints: [`Split ${b} into ${t} + ${o}. What is ${a} × ${t}?`, `Now find ${a} × ${o} and add the two parts.`],
        steps: [`${a} × ${t} = ${a * t}`, `${a} × ${o} = ${a * o}`, `${a * t} + ${a * o} = ${a * b}`] }; },
  },
  {
    id: "div-facts", unit: "mul-div", title: "Division facts", level: 3,
    intro: "Division asks: how many groups? 56 ÷ 8 means 'what times 8 makes 56?' Every division is a multiplication in disguise!",
    example: { problem: "56 ÷ 8", steps: ["Ask: 8 × ? = 56", "8 × 7 = 56", "So 56 ÷ 8 = 7"], answer: "7" },
    generate: () => { const b = r(2, 12), q = r(2, 12);
      return { prompt: `${b * q} ÷ ${b} = ?`, answer: q,
        hints: [`Turn it around: ${b} × ? = ${b * q}`, `Try counting up in ${b}s until you reach ${b * q}.`],
        steps: [`${b} × ${q} = ${b * q}`, `So ${b * q} ÷ ${b} = ${q}`] }; },
  },
  {
    id: "div-long", unit: "mul-div", title: "Long division (with remainders)", level: 4,
    intro: "Divide, Multiply, Subtract, Bring down — repeat! Give remainders like '23 r 4'… or here, just the whole-number quotient.",
    example: { problem: "157 ÷ 6 (whole number part)", steps: ["15 ÷ 6 = 2, 2 × 6 = 12, 15 − 12 = 3.", "Bring down 7 → 37. 37 ÷ 6 = 6, 6 × 6 = 36, remainder 1.", "Answer: 26 remainder 1, so quotient is 26."], answer: "26" },
    generate: () => { const d = r(3, 9), q = r(12, 99), rem = r(0, d - 1); const n = d * q + rem;
      return { prompt: `${n} ÷ ${d} = ? (whole-number quotient; ignore any remainder)`, answer: q,
        hints: [`How many times does ${d} go into the first digit or two of ${n}?`, `Check: ${d} × your answer should be just under or equal to ${n}.`],
        steps: [`${d} × ${q} = ${d * q}`, `${n} − ${d * q} = ${rem} (remainder)`, `Quotient: ${q}${rem ? ` r ${rem}` : ""}`] }; },
  },
  {
    id: "fr-equivalent", unit: "fractions", title: "Simplifying fractions", level: 5,
    intro: "Divide the top and bottom by the same number (their greatest common factor) to simplify.",
    example: { problem: "Simplify 12/18", steps: ["The biggest number dividing both 12 and 18 is 6.", "12 ÷ 6 = 2, 18 ÷ 6 = 3.", "12/18 = 2/3"], answer: "2/3" },
    generate: () => { const n = r(1, 8), d = r(n + 1, 12); const g = gcd(n, d); const sn = n / g, sd = d / g; const k = r(2, 6);
      return { prompt: `Simplify ${sn * k}/${sd * k}`, answer: `${sn}/${sd}`,
        hints: [`What number divides both ${sn * k} and ${sd * k}?`, `Try dividing both by ${k * gcd(sn, sd)}.`],
        steps: [`GCF of ${sn * k} and ${sd * k} is ${k}.`, `${sn * k} ÷ ${k} = ${sn}, ${sd * k} ÷ ${k} = ${sd}`, `Answer: ${sn}/${sd}`] }; },
  },
  {
    id: "fr-add", unit: "fractions", title: "Adding fractions", level: 5,
    intro: "To add fractions, make the bottoms (denominators) match first, then add the tops.",
    example: { problem: "1/4 + 1/3", steps: ["Common denominator: 12.", "1/4 = 3/12, 1/3 = 4/12.", "3/12 + 4/12 = 7/12"], answer: "7/12" },
    generate: () => { const a = r(2, 6), b = pick([2, 3, 4, 5, 6].filter((x) => x !== a)); const L = (a * b) / gcd(a, b);
      const num = L / a + L / b; const g = gcd(num, L);
      return { prompt: `1/${a} + 1/${b} = ? (as a fraction)`, answer: `${num / g}/${L / g}`,
        hints: [`What number do both ${a} and ${b} divide into?`, `Use ${L} as the denominator: 1/${a} = ${L / a}/${L}.`],
        steps: [`1/${a} = ${L / a}/${L}, 1/${b} = ${L / b}/${L}`, `${L / a}/${L} + ${L / b}/${L} = ${num}/${L}`, g > 1 ? `Simplify: ${num / g}/${L / g}` : `Already simplest.`] }; },
  },
  {
    id: "dec-mul", unit: "decimals", title: "Multiplying decimals", level: 6,
    intro: "Multiply as if there were no decimal points, then count the total decimal places and put them back.",
    example: { problem: "0.4 × 2.5", steps: ["4 × 25 = 100", "There are 2 decimal places in total.", "100 → 1.00 = 1"], answer: "1" },
    generate: () => { const a = r(2, 9) / 10, b = r(11, 59) / 10; const ans = Math.round(a * b * 100) / 100;
      return { prompt: `${a} × ${b} = ?`, answer: ans,
        hints: [`Ignore the decimals: what is ${a * 10} × ${Math.round(b * 10)}?`, "Now count decimal places: one in each number, so two in the answer."],
        steps: [`${a * 10} × ${Math.round(b * 10)} = ${a * 10 * Math.round(b * 10)}`, `Two decimal places → ${formatNumber(ans)}`] }; },
  },
  {
    id: "pct-of", unit: "percents", title: "Percent of a number", level: 7,
    intro: "Percent means 'out of 100'. To find 25% of 80: 10% is 8, so 25% is 8 + 8 + 4 = 20. Or multiply by 0.25.",
    example: { problem: "15% of 60", steps: ["10% of 60 = 6", "5% of 60 = 3", "15% = 6 + 3 = 9"], answer: "9" },
    generate: () => { const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 75]); const n = r(2, 20) * 20; const ans = (p * n) / 100;
      return { prompt: `What is ${p}% of ${n}?`, answer: ans,
        hints: [`Start with 10% of ${n}. (Divide by 10.)`, `${p}% is ${p / 10} lots of 10%.`],
        steps: [`10% of ${n} = ${n / 10}`, `${p}% = ${p / 10} × ${n / 10} = ${formatNumber(ans)}`] }; },
  },
  {
    id: "ratio-share", unit: "ratios", title: "Sharing in a ratio", level: 8,
    intro: "To share in a ratio a:b, add the parts, find one part's value, then multiply.",
    example: { problem: "Share 40 sweets in the ratio 3:5. How many in the bigger share?", steps: ["3 + 5 = 8 parts", "40 ÷ 8 = 5 per part", "5 × 5 = 25"], answer: "25" },
    generate: () => { const a = r(1, 5), b = r(a + 1, 7); const unit = r(2, 9); const total = (a + b) * unit;
      return { prompt: `Share ${total} in the ratio ${a}:${b}. How big is the larger share?`, answer: b * unit,
        hints: ["How many parts are there altogether?", `Each part is ${total} ÷ ${a + b}. How many parts does the larger share get?`],
        steps: [`${a} + ${b} = ${a + b} parts`, `${total} ÷ ${a + b} = ${unit} per part`, `${b} × ${unit} = ${b * unit}`] }; },
  },
  {
    id: "pre-order-ops", unit: "prealgebra", title: "Order of operations", level: 8,
    intro: "Brackets first, then powers, then × and ÷ (left to right), then + and − (left to right).",
    example: { problem: "3 + 4 × 2", steps: ["Multiply first: 4 × 2 = 8", "Then add: 3 + 8 = 11"], answer: "11" },
    generate: () => { const a = r(2, 9), b = r(2, 9), c = r(2, 9);
      const forms = [
        { p: `${a} + ${b} × ${c}`, v: a + b * c, s: [`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] },
        { p: `(${a} + ${b}) × ${c}`, v: (a + b) * c, s: [`${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`] },
        { p: `${a * c} ÷ ${c} + ${b}`, v: a + b, s: [`${a * c} ÷ ${c} = ${a}`, `${a} + ${b} = ${a + b}`] },
      ];
      const f = pick(forms);
      return { prompt: `${f.p} = ?`, answer: f.v, hints: ["Are there brackets? Do those first.", "Multiply and divide before you add."], steps: f.s }; },
  },
  {
    id: "alg-one-step", unit: "algebra", title: "Solving one-step equations", level: 9,
    intro: "An equation is a balance. Do the opposite operation to both sides to get x alone.",
    example: { problem: "x + 7 = 15", steps: ["Undo +7 by subtracting 7 from both sides.", "x = 15 − 7 = 8"], answer: "8" },
    generate: () => { const x = r(2, 15), k = r(2, 12);
      return pick([
        { prompt: `Solve: x + ${k} = ${x + k}`, answer: x, hints: [`What's the opposite of adding ${k}?`, `Subtract ${k} from both sides.`], steps: [`x = ${x + k} − ${k}`, `x = ${x}`] },
        { prompt: `Solve: ${k}x = ${k * x}`, answer: x, hints: [`${k}x means ${k} × x. What undoes multiplying?`, `Divide both sides by ${k}.`], steps: [`x = ${k * x} ÷ ${k}`, `x = ${x}`] },
      ]); },
  },
  {
    id: "alg-two-step", unit: "algebra", title: "Solving two-step equations", level: 9,
    intro: "Undo addition/subtraction first, then undo multiplication/division.",
    example: { problem: "3x + 4 = 19", steps: ["Subtract 4: 3x = 15", "Divide by 3: x = 5"], answer: "5" },
    generate: () => { const x = r(1, 12), a = r(2, 9), b = r(1, 20);
      return { prompt: `Solve: ${a}x + ${b} = ${a * x + b}`, answer: x,
        hints: [`First get rid of the + ${b}. What is ${a * x + b} − ${b}?`, `Now ${a}x = ${a * x}. Divide both sides by ${a}.`],
        steps: [`${a}x = ${a * x + b} − ${b} = ${a * x}`, `x = ${a * x} ÷ ${a} = ${x}`] }; },
  },
];

export const skillById = (id: string) => SKILLS.find((s) => s.id === id);
export const skillsInUnit = (unit: string) => SKILLS.filter((s) => s.unit === unit);

/** Diagnostic: one question per level band; the first wrong answer sets the start unit. */
export const DIAGNOSTIC_SKILLS = ["ns-place-value", "as-add-regroup", "mul-facts", "div-facts", "fr-equivalent", "dec-mul", "pct-of", "ratio-share", "pre-order-ops", "alg-two-step"];

export function startUnitFromDiagnostic(results: boolean[]): string {
  const firstMiss = results.findIndex((ok) => !ok);
  const idx = firstMiss === -1 ? DIAGNOSTIC_SKILLS.length - 1 : firstMiss;
  return skillById(DIAGNOSTIC_SKILLS[idx]!)!.unit;
}

export const SAMPLE_SKILL_ID = "mul-multi";
