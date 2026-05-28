// NEW ANNOUNCEMENT SYSTEM — client-side service
import { supabase } from "@/lib/supabaseClient";

export type AnnouncementAudience =
  | "all_members"
  | "collaborators"
  | `workspace:${string}`
  | "role:student"
  | "role:volunteer"
  | "role:mentor";

export type AnnouncementType =
  | "organization"
  | "opportunity_public"
  | "opportunity_targeted"
  | "opportunity_private";

export type Announcement = {
  id:                string;
  organization_id:   string;
  title:             string;
  message:           string;
  cta_label:         string | null;
  cta_url:           string | null;
  workspace_id:      string | null;
  project_id:        string | null;
  audience:          string;
  announcement_type: AnnouncementType;
  target_roles:      string[] | null;
  created_at:        string;
  updated_at:        string;
};

export async function getOrgAnnouncements(
  organizationId: string
): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getOrgAnnouncements]", error.message);
    return [];
  }
  return data as Announcement[];
}
