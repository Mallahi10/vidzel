export type StudentProfile = {
  full_name: string;
  location: string;
  headline: string;

  school: string;
  major: string;
  year_of_study: string;
  graduation_year: string;

  languages: string;

  interests: string[]; // selected + “Other” values stored here
  skills: string[]; // selected + “Other” values stored here

  work_preference: "Remote" | "In-Person" | "Hybrid" | "";
  available_days: string[];
  hours_per_week: string;

  experience: string;
  goals: string;
  wants_mentorship: "Yes" | "No" | "Maybe" | "";

  updated_at: string;
};

const KEY_PREFIX = "vidzel:profiles:student:";

export function getStudentProfileKey(userIdOrEmail: string) {
  return `${KEY_PREFIX}${userIdOrEmail}`;
}

export function loadStudentProfile(userIdOrEmail: string): StudentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStudentProfileKey(userIdOrEmail));
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveStudentProfile(userIdOrEmail: string, profile: StudentProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStudentProfileKey(userIdOrEmail), JSON.stringify(profile));
}