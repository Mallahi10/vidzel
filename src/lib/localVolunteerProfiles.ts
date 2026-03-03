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

const KEY_PREFIX = "vidzel:profiles:volunteer:";

export function getVolunteerProfileKey(userIdOrEmail: string) {
  return `${KEY_PREFIX}${userIdOrEmail}`;
}

export function loadVolunteerProfile(
  userIdOrEmail: string
): VolunteerProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(
      getVolunteerProfileKey(userIdOrEmail)
    );

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveVolunteerProfile(
  userIdOrEmail: string,
  profile: VolunteerProfile
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    getVolunteerProfileKey(userIdOrEmail),
    JSON.stringify(profile)
  );
}