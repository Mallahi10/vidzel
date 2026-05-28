import { supabase } from "@/lib/supabaseClient";

export type VolunteerProfile = {
  full_name: string;
  location: string;
  headline: string;
  photo_url: string;
  languages: string;
  skills: string[];
  interests: string[];
  collaboration_type: string;
  experience: string;
  education: string;
  availability_hours: string;
  available_days: string[];
  motivation: string;
  updated_at: string;
};

export async function loadVolunteerProfile(userId: string): Promise<VolunteerProfile | null> {
  const { data } = await supabase
    .from("volunteer_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as VolunteerProfile;

  // One-time migration: if Supabase is empty, check localStorage for old data
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`vidzel:profiles:volunteer:${userId}`);
    if (raw) {
      try {
        const old = JSON.parse(raw) as VolunteerProfile;
        await saveVolunteerProfile(userId, old);
        localStorage.removeItem(`vidzel:profiles:volunteer:${userId}`);
        return old;
      } catch {}
    }
  }

  return null;
}

export async function saveVolunteerProfile(userId: string, profile: VolunteerProfile): Promise<void> {
  await supabase
    .from("volunteer_profiles")
    .upsert(
      { ...profile, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}
