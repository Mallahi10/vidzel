// src/lib/profileScore.ts
import type { OrgProfile } from "./localProfiles";

function hasText(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}
function hasArray(v: unknown) {
  return Array.isArray(v) && v.length > 0;
}
function hasBool(v: unknown) {
  return typeof v === "boolean";
}

/**
 * Smooth per-field scoring:
 * Section 1 (Basic): 40%
 * Section 2 (Mission & Focus): 35%
 * Section 3 (Capacity): 25%
 */
export function calculateOrgProfileScore(p: Partial<OrgProfile> | null): number {
  if (!p) return 0;

  const section1 = [
    hasText(p.organization_name),
    hasText(p.organization_type),
    hasText(p.country),
    hasText(p.city),
    hasText(p.year_founded),
    hasText(p.website),   // optional but counts
    hasText(p.logo_url),  // optional but counts
  ];

  const section2 = [
    hasText(p.mission),
    hasArray(p.focus_areas),
    hasText(p.target_population),
  ];

  const section3 = [
    hasText(p.team_size),
    hasBool(p.managed_volunteers),
    hasBool(p.hosted_students),
    hasBool(p.has_coordinator),
  ];

  const s1 = (section1.filter(Boolean).length / section1.length) * 40;
  const s2 = (section2.filter(Boolean).length / section2.length) * 35;
  const s3 = (section3.filter(Boolean).length / section3.length) * 25;

  return Math.max(0, Math.min(100, Math.round(s1 + s2 + s3)));
}