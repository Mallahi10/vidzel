import type { StudentProfile } from "./localStudentProfiles";

export function calculateStudentProfileScore(p: Partial<StudentProfile>) {
  // Simple scoring: 10 fields * 10 points = 100
  const checks: Array<boolean> = [
    !!p.full_name,
    !!p.location,
    !!p.headline,
    !!p.school,
    !!p.major,
    !!p.year_of_study,
    !!p.languages,
    (p.skills?.length || 0) > 0,
    (p.interests?.length || 0) > 0,
    (p.available_days?.length || 0) > 0 && !!p.hours_per_week,
  ];

  const points = checks.filter(Boolean).length * 10;
  return Math.min(100, points);
}