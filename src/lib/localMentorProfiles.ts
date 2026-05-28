import { supabase } from "@/lib/supabaseClient";

export type MentorProfile = {
  full_name: string;
  location: string;
  headline: string;
  photo_url: string;
  about: string;
  expertise: string[];
  sectors: string[];
  mentorship_focus: string[];
  experience_years: string;
  current_position: string;
  achievements: string;
  availability_hours: string;
  available_days: string[];
  collaboration_type: string;
  languages: string;
  updated_at: string;
};

export async function loadMentorProfile(userId: string): Promise<MentorProfile | null> {
  const { data } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as MentorProfile;

  // One-time migration: if Supabase is empty, check localStorage for old data
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`vidzel:profiles:mentor:${userId}`);
    if (raw) {
      try {
        const old = JSON.parse(raw) as MentorProfile;
        await saveMentorProfile(userId, old);
        localStorage.removeItem(`vidzel:profiles:mentor:${userId}`);
        return old;
      } catch {}
    }
  }

  return null;
}

export async function saveMentorProfile(userId: string, profile: MentorProfile): Promise<void> {
  await supabase
    .from("mentor_profiles")
    .upsert(
      { ...profile, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}

export async function deleteMentorProfile(userId: string): Promise<void> {
  await supabase.from("mentor_profiles").delete().eq("user_id", userId);
}

export function getEmptyMentorProfile(): MentorProfile {
  return {
    full_name: "", location: "", headline: "", photo_url: "",
    about: "", expertise: [], sectors: [], mentorship_focus: [],
    experience_years: "", current_position: "", achievements: "",
    availability_hours: "", available_days: [], collaboration_type: "",
    languages: "", updated_at: "",
  };
}
