import { supabase } from "@/integrations/supabase/client";
import { addDays, earnedBadges, MASTERED_AT, nextMastery, reviewIntervalDays } from "./progress";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function getProfile() {
  const id = await uid();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: created, error: e2 } = await supabase.from("profiles").insert({ id }).select("*").single();
    if (e2) throw e2;
    return created;
  }
  return data;
}

export async function updateProfile(patch: {
  nickname?: string | null; age_band?: string; guardian_consent?: boolean; guardian_consent_at?: string | null;
  level?: string; diagnostic_done?: boolean; start_unit?: string | null; daily_goal?: number;
}) {
  const id = await uid();
  const { error } = await supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function getMastery() {
  const { data, error } = await supabase.from("skill_mastery").select("*");
  if (error) throw error;
  return data;
}

export async function getAttempts(limit = 300) {
  const { data, error } = await supabase.from("attempts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function getBadges() {
  const { data, error } = await supabase.from("badges").select("*");
  if (error) throw error;
  return data;
}

export type AttemptInput = { skillId: string; prompt: string; given: string; expected: string; correct: boolean; usedHint: boolean };

export async function recordAttempt(a: AttemptInput): Promise<{ mastery: number; newBadges: string[] }> {
  const user_id = await uid();
  const { error: e1 } = await supabase.from("attempts").insert({
    user_id, skill_id: a.skillId, prompt: a.prompt, given: a.given, expected: a.expected, is_correct: a.correct, used_hint: a.usedHint,
  });
  if (e1) throw e1;
  const { data: prev } = await supabase.from("skill_mastery").select("*").eq("skill_id", a.skillId).maybeSingle();
  const mastery = nextMastery(prev?.mastery ?? 0, a.correct, a.usedHint);
  const { error: e2 } = await supabase.from("skill_mastery").upsert({
    user_id, skill_id: a.skillId, mastery,
    attempts: (prev?.attempts ?? 0) + 1, correct: (prev?.correct ?? 0) + (a.correct ? 1 : 0),
    next_review: addDays(new Date(), reviewIntervalDays(mastery)), updated_at: new Date().toISOString(),
  });
  if (e2) throw e2;

  // Badges
  const [all, attempts, have] = await Promise.all([getMastery(), supabase.from("attempts").select("is_correct, used_hint"), getBadges()]);
  const rows = attempts.data ?? [];
  const earned = earnedBadges({
    totalAttempts: rows.length,
    totalCorrect: rows.filter((r) => r.is_correct).length,
    masteredSkills: all.filter((m) => m.mastery >= MASTERED_AT).map((m) => m.skill_id),
    correctWithHint: rows.some((r) => r.is_correct && r.used_hint),
  });
  const haveIds = new Set(have.map((b) => b.badge_id));
  const newBadges = earned.filter((b) => !haveIds.has(b));
  if (newBadges.length) {
    const { error: e3 } = await supabase.from("badges").insert(newBadges.map((badge_id) => ({ user_id, badge_id })));
    if (e3) throw e3;
  }
  return { mastery, newBadges };
}

export async function deleteMyLearningData() {
  const id = await uid();
  for (const t of ["attempts", "skill_mastery", "badges"] as const) {
    const { error } = await supabase.from(t).delete().eq("user_id", id);
    if (error) throw error;
  }
  await updateProfile({ diagnostic_done: false, start_unit: null });
}
