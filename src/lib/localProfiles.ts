// src/lib/localProfiles.ts

export type Role = "organization" | "volunteer" | "student" | "mentor";

export type OrgProfile = {
  organization_name: string;
  organization_type: string;
  country: string;
  city: string;
  year_founded: string; // keep as string for inputs
  website: string;
  logo_url: string;

  mission: string;
  focus_areas: string[];
  target_population: string;

  team_size: string;
  managed_volunteers: boolean | null;
  hosted_students: boolean | null;
  has_coordinator: boolean | null;

  updated_at: string;
};

const KEY_PREFIX = "vidzel:profiles:org:";

/**
 * Use your auth user id if you have it.
 * If you don't have a real id yet, use user email as fallback key.
 */
export function getOrgProfileKey(userIdOrEmail: string) {
  return `${KEY_PREFIX}${userIdOrEmail}`;
}

export function loadOrgProfile(userIdOrEmail: string): OrgProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getOrgProfileKey(userIdOrEmail));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as OrgProfile;
  } catch {
    return null;
  }
}

export function saveOrgProfile(userIdOrEmail: string, profile: OrgProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getOrgProfileKey(userIdOrEmail), JSON.stringify(profile));
}