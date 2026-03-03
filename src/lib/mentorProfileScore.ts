/* =========================================
   Mentor Profile Score Logic
   ========================================= */

import { MentorProfile } from "./localMentorProfiles";

/* 
  Score Philosophy:
  -----------------
  We measure how "mentorship-ready" a profile is.

  Total Score = 100

  Identity & Credibility .......... 25 pts
  Mentorship Philosophy ........... 15 pts
  Expertise & Focus ............... 25 pts
  Experience Depth ................ 15 pts
  Availability & Collaboration .... 15 pts
  Languages ....................... 5 pts
*/

export function calculateMentorProfileScore(
  profile: MentorProfile | null
): number {
  if (!profile) return 0;

  let score = 0;

  /* =============================
     1️⃣ Identity & Credibility (25)
     ============================= */

  if (profile.full_name?.trim()) score += 5;
  if (profile.location?.trim()) score += 5;
  if (profile.headline?.trim()) score += 5;
  if (profile.photo_url?.trim()) score += 5;

  // Strong headline bonus
  if (profile.headline && profile.headline.length > 20) score += 5;

  /* =============================
     2️⃣ Mentorship Philosophy (15)
     ============================= */

  if (profile.about?.trim()) {
    if (profile.about.length > 80) score += 10;
    if (profile.about.length > 200) score += 5; // depth bonus
  }

  /* =============================
     3️⃣ Expertise & Focus (25)
     ============================= */

  if (profile.expertise?.length >= 1) score += 10;
  if (profile.expertise?.length >= 3) score += 5;

  if (profile.sectors?.length >= 1) score += 5;

  if (profile.mentorship_focus?.length >= 1) score += 5;

  /* =============================
     4️⃣ Experience Depth (15)
     ============================= */

  if (profile.experience_years?.trim()) score += 5;
  if (profile.current_role?.trim()) score += 5;

  if (profile.achievements?.trim()) {
    if (profile.achievements.length > 60) score += 5;
  }

  /* =============================
     5️⃣ Availability & Collaboration (15)
     ============================= */

  if (profile.availability_hours?.trim()) score += 5;
  if (profile.available_days?.length >= 1) score += 5;
  if (profile.collaboration_type?.trim()) score += 5;

  /* =============================
     6️⃣ Languages (5)
     ============================= */

  if (profile.languages?.trim()) score += 5;

  /* =============================
     Cap Score at 100
     ============================= */

  if (score > 100) return 100;

  return score;
}

/* =========================================
   Score Level Helper (Optional)
   ========================================= */

export function getMentorProfileLevel(score: number): string {
  if (score >= 85) return "Elite Mentor";
  if (score >= 70) return "Advanced Mentor";
  if (score >= 50) return "Developing Mentor";
  if (score >= 30) return "Starter Mentor";
  return "Incomplete Profile";
}