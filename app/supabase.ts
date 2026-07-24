"use client";

import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = "https://hhcubvixldieuwdeqnwc.supabase.co";
const supabasePublishableKey =
  "sb_publishable_S-fBRRvMYbhAq_FmxgTDbQ_qGeQKmwA";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export type CourseId = "claude-01" | "claude-code";
export type CourseProgress = {
  completedUnits: number;
  passed: boolean;
  bestScore: number;
};

export type HonorRow = {
  display_name: string;
  avatar_url: string | null;
  completed_courses: number;
};

export function displayName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "學員"
  );
}

export async function ensureCourseProfile(user: User) {
  const { error } = await supabase.from("claude_course_profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName(user),
      avatar_url: user.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.assign("/");
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function loadProgress(
  courseId: CourseId,
): Promise<CourseProgress> {
  const { data, error } = await supabase
    .from("claude_course_progress")
    .select("completed_unit_ids,passed,quiz_score")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return {
    completedUnits: data?.completed_unit_ids?.length ?? 0,
    passed: !!data?.passed,
    bestScore: data?.quiz_score ?? 0,
  };
}

export async function saveProgress(
  courseId: CourseId,
  requested: CourseProgress,
): Promise<CourseProgress> {
  const session = await getSession();
  if (!session) throw new Error("請先登入");

  const current = await loadProgress(courseId);
  const total = courseId === "claude-01" ? 6 : 7;
  const completedUnits = Math.min(
    total,
    Math.max(current.completedUnits, Math.min(requested.completedUnits, current.completedUnits + 1)),
  );
  const bestScore = Math.max(
    current.bestScore,
    Math.min(8, requested.bestScore || 0),
  );
  const passed =
    current.passed ||
    (completedUnits === total && requested.passed && bestScore >= 6);

  const { error } = await supabase.from("claude_course_progress").upsert(
    {
      user_id: session.user.id,
      course_id: courseId,
      completed_unit_ids: Array.from(
        { length: completedUnits },
        (_, index) => String(index + 1),
      ),
      quiz_score: bestScore,
      passed,
      completed_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) throw error;
  return { completedUnits, passed, bestScore };
}

export async function firstCoursePassed() {
  const progress = await loadProgress("claude-01");
  return progress.passed;
}

export async function loadDashboard() {
  const [{ data: rows, error }, { data: board, error: boardError }] =
    await Promise.all([
      supabase
        .from("claude_course_progress")
        .select("course_id,completed_unit_ids,passed,quiz_score"),
      supabase.rpc("claude_course_honor_roll"),
    ]);
  if (error) throw error;
  if (boardError) throw boardError;

  const progress = (id: CourseId): CourseProgress => {
    const row = rows?.find((item) => item.course_id === id);
    return {
      completedUnits: row?.completed_unit_ids?.length ?? 0,
      passed: !!row?.passed,
      bestScore: row?.quiz_score ?? 0,
    };
  };

  return {
    first: progress("claude-01"),
    second: progress("claude-code"),
    board: (board ?? []) as HonorRow[],
  };
}
