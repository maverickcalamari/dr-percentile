import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { accountsConfigured, classroom } from "./classroom-client";
import { emptyProgress, day, useDemoProgress, type DemoProgress } from "./demo-progress";
import { z } from "zod";

const skillId = z.string().min(1).max(64);
const progressEvent = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("attempt"),
    payload: z.object({
      skillId,
      prompt: z.string().max(512),
      given: z.string().max(72),
      expected: z.string().max(72),
      correct: z.boolean(),
      usedHint: z.boolean(),
    }),
  }),
  z.object({
    kind: z.literal("assessment"),
    payload: z.object({
      skillId,
      score: z.number().int().min(0).max(100),
      total: z.number().int().min(1).max(100),
    }),
  }),
  z.object({ kind: z.literal("resume"), payload: z.object({ skillId }) }),
  z.object({ kind: z.literal("diagnostic"), payload: z.object({ unit: skillId }) }),
]);

export type ClassroomMember = {
  id: string;
  role: "student" | "guardian";
  nickname: string;
  ai_allowed: boolean;
};
type ProgressEvent = z.infer<typeof progressEvent>;

export function useClassroomAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(accountsConfigured);
  useEffect(() => {
    if (!classroom) return;
    const { data } = classroom.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const profile = useQuery({
    queryKey: ["classroom-member", user?.id],
    enabled: Boolean(user && classroom),
    queryFn: async () => {
      const { data, error } = await classroom!
        .from("classroom_members")
        .select("id,role,nickname,ai_allowed")
        .eq("id", user!.id)
        .maybeSingle<ClassroomMember>();
      if (error) throw error;
      return data;
    },
  });

  return {
    user,
    member: profile.data,
    loading: loading || Boolean(user && profile.isPending),
    error: profile.error,
  };
}

function append(previous: DemoProgress, event: ProgressEvent, date: string): DemoProgress {
  switch (event.kind) {
    case "attempt":
      return { ...previous, attempts: [...previous.attempts, { ...event.payload, date }] };
    case "assessment":
      return { ...previous, assessments: [...previous.assessments, { ...event.payload, date }] };
    case "resume":
      return { ...previous, lastLesson: event.payload.skillId };
    case "diagnostic":
      return { ...previous, startUnit: event.payload.unit };
  }
}

export function useStudentHistory(studentId?: string, viewerId?: string) {
  return useQuery({
    queryKey: ["classroom-history", studentId, viewerId],
    enabled: Boolean(classroom && studentId),
    queryFn: async () => {
      let progress = emptyProgress;
      for (let start = 0; ; start += 500) {
        const { data, error } = await classroom!
          .from("classroom_events")
          .select("kind,payload,created_at")
          .eq("student_id", studentId!)
          .order("created_at")
          .order("id")
          .range(start, start + 499);
        if (error) throw error;
        for (const row of data) {
          const event = progressEvent.safeParse(row);
          if (event.success) progress = append(progress, event.data, row.created_at.slice(0, 10));
        }
        if (data.length < 500) return progress;
      }
    },
  });
}

export function useLearningProgress() {
  const local = useDemoProgress();
  const account = useClassroomAccount();
  const studentId = account.member?.role === "student" ? account.member.id : undefined;
  const history = useStudentHistory(studentId, account.user?.id);
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ event, id }: { event: ProgressEvent; id: string }) => {
      const { error } = await classroom!
        .from("classroom_events")
        .insert({ id, student_id: studentId, ...event });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["classroom-history", studentId] }),
  });

  function save(event: ProgressEvent) {
    if (studentId) return mutation.mutateAsync({ event, id: crypto.randomUUID() });
    if (!account.user) local.update((previous) => append(previous, event, day()));
    return Promise.resolve();
  }

  const blocked = Boolean(account.user && !studentId && !account.loading);
  return {
    account,
    blocked,
    save,
    progress: studentId ? (history.data ?? emptyProgress) : local.progress,
    ready: account.loading === false && (studentId ? history.isSuccess : local.ready),
    storageError: Boolean(
      account.error || history.isError || mutation.isError || local.storageError,
    ),
  };
}
