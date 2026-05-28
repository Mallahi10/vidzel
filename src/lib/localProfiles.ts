import { supabase } from "@/lib/supabaseClient";

export type Role = "organization" | "volunteer" | "student" | "mentor";

export type OrgProfile = {
  organization_name: string;
  organization_type: string;
  country: string;
  city: string;
  year_founded: string;
  website: string;
  logo_url: string;
  mission: string;
  focus_areas: string[];
  target_population: string;
  team_size: string;
  managed_volunteers: boolean | null;
  hosted_students: boolean | null;
  has_coordinator: boolean | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  social_linkedin?: string;
  social_instagram?: string;
  social_facebook?: string;
  main_programs?: string;
  impact_metrics?: string;
  regions_served?: string;
  success_story?: string;
  collaboration_preference?: string;
  preferred_languages?: string;
  time_zone?: string;
  availability_notes?: string;
  support_needed?: string;
  resources_available?: string;
  tools_used?: string;
  partnerships?: string;
  updated_at: string;
};

export async function loadOrgProfile(userId: string): Promise<OrgProfile | null> {
  const { data } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as OrgProfile;

  // One-time migration: if Supabase is empty, check localStorage for old data
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`vidzel:profiles:org:${userId}`);
    if (raw) {
      try {
        const old = JSON.parse(raw) as OrgProfile;
        await saveOrgProfile(userId, old);
        localStorage.removeItem(`vidzel:profiles:org:${userId}`);
        return old;
      } catch {}
    }
  }

  return null;
}

export async function saveOrgProfile(userId: string, profile: OrgProfile): Promise<void> {
  await supabase
    .from("organization_profiles")
    .upsert(
      { ...profile, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}
