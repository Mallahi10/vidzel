/* ===============================
   Mentor Profile Local Storage
   =============================== */

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
  current_role: string;
  achievements: string;

  availability_hours: string;
  available_days: string[];
  collaboration_type: string;

  languages: string;

  updated_at: string;
};

const KEY_PREFIX = "vidzel:profiles:mentor:";

/* ===============================
   Helpers
   =============================== */

export function getMentorProfileKey(userIdOrEmail: string) {
  return `${KEY_PREFIX}${userIdOrEmail}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

/* ===============================
   Load Profile
   =============================== */

export function loadMentorProfile(
  userIdOrEmail: string
): MentorProfile | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(
      getMentorProfileKey(userIdOrEmail)
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed as MentorProfile;
  } catch (error) {
    console.error("Failed to load mentor profile:", error);
    return null;
  }
}

/* ===============================
   Save Profile
   =============================== */

export function saveMentorProfile(
  userIdOrEmail: string,
  profile: MentorProfile
) {
  if (!isBrowser()) return;

  try {
    const profileWithTimestamp: MentorProfile = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(
      getMentorProfileKey(userIdOrEmail),
      JSON.stringify(profileWithTimestamp)
    );
  } catch (error) {
    console.error("Failed to save mentor profile:", error);
  }
}

/* ===============================
   Delete Profile
   =============================== */

export function deleteMentorProfile(userIdOrEmail: string) {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(
      getMentorProfileKey(userIdOrEmail)
    );
  } catch (error) {
    console.error("Failed to delete mentor profile:", error);
  }
}

/* ===============================
   Default Empty Profile Template
   =============================== */

export function getEmptyMentorProfile(): MentorProfile {
  return {
    full_name: "",
    location: "",
    headline: "",
    photo_url: "",

    about: "",

    expertise: [],
    sectors: [],
    mentorship_focus: [],

    experience_years: "",
    current_role: "",
    achievements: "",

    availability_hours: "",
    available_days: [],
    collaboration_type: "",

    languages: "",

    updated_at: "",
  };
}