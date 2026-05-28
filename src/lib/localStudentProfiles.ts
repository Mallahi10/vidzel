import { supabase } from "@/lib/supabaseClient";

export type StudentProfile = {
  full_name: string;
  location: string;
  headline: string;
  school: string;
  major: string;
  year_of_study: string;
  graduation_year: string;
  languages: string;
  impact_areas: string[];
  skills: string[];
  collab_type: string;
  role_preference: string;
  available_days: string[];
  hours_per_week: string;
  experience: string;
  goals: string;
  updated_at: string;
};

export async function loadStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as StudentProfile;

  // One-time migration: if Supabase is empty, check localStorage for old data
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`vidzel:profiles:student:${userId}`);
    if (raw) {
      try {
        const old = JSON.parse(raw) as StudentProfile;
        await saveStudentProfile(userId, old);
        localStorage.removeItem(`vidzel:profiles:student:${userId}`);
        return old;
      } catch {}
    }
  }

  return null;
}

export async function saveStudentProfile(userId: string, profile: StudentProfile): Promise<void> {
  await supabase
    .from("student_profiles")
    .upsert(
      { ...profile, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}

export function getEmptyStudentProfile(): StudentProfile {
  return {
    full_name: "",
    location: "",
    headline: "",
    school: "",
    major: "",
    year_of_study: "",
    graduation_year: "",
    languages: "",
    impact_areas: [],
    skills: [],
    collab_type: "",
    role_preference: "",
    available_days: [],
    hours_per_week: "",
    experience: "",
    goals: "",
    updated_at: "",
  };
}
