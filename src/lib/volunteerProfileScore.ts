import type { VolunteerProfile } from "./localVolunteerProfiles";

function hasText(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}
function hasArray(v: unknown) {
  return Array.isArray(v) && v.length > 0;
}

export function calculateVolunteerProfileScore(
  p: Partial<VolunteerProfile> | null
): number {
  if (!p) return 0;

  const section1 = [
    hasText(p.full_name),
    hasText(p.location),
    hasText(p.headline),
    hasText(p.photo_url),
    hasText(p.languages),
  ];

  const section2 = [
    hasArray(p.skills),
    hasArray(p.interests),
    hasText(p.collaboration_type),
  ];

  const section3 = [
    hasText(p.experience),
    hasText(p.education),
    hasText(p.availability_hours),
    hasArray(p.available_days),
  ];

  const s1 = (section1.filter(Boolean).length / section1.length) * 40;
  const s2 = (section2.filter(Boolean).length / section2.length) * 35;
  const s3 = (section3.filter(Boolean).length / section3.length) * 25;

  return Math.round(Math.min(100, s1 + s2 + s3));
}