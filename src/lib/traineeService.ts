/**
 * traineeService.ts — Service layer for the Trainee role.
 * Mirrors the pattern of workspaceService.ts and invitationService.ts.
 *
 * Run the SQL in SUPABASE_SETUP.md to create:
 *   trainee_profiles, internship_offers, trainee_applications, trainee_bookmarks
 */

import { supabase } from "@/lib/supabaseClient";
import { addNotification } from "@/lib/notifications";

/* ============================================================
   TYPES
============================================================ */

export type TraineeProfile = {
  id: string;
  user_id: string;
  full_name: string;
  photo_url: string;
  formation: string;
  school: string;
  education_level: string;
  skills: string[];
  linkedin_url: string;
  bio: string;
  availability_start: string | null;
  availability_end: string | null;
  cv_url: string | null;
  updated_at: string;
};

export type InternshipOffer = {
  id: string;
  created_at: string;
  org_id: string;
  org_name: string;
  org_logo_url: string | null;
  title: string;
  description: string;
  missions: string[];
  required_skills: string[];
  domain: string;
  duration: string;
  location_type: "remote" | "on-site" | "hybrid";
  location_city: string | null;
  start_date: string | null;
  is_active: boolean;
};

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected"
  | "interview";

export type TraineeApplication = {
  id: string;
  created_at: string;
  updated_at: string;
  offer_id: string;
  trainee_id: string;
  cover_letter: string | null;
  cv_url: string | null;
  status: ApplicationStatus;
  interview_date: string | null;
  internship_offers: InternshipOffer | null;
};

export type TraineeDashboardStats = {
  offersAvailable: number;
  applicationsSent: number;
  interviewsPending: number;
  tasksAssigned: number;
};

export type OfferFilters = {
  domain?: string;
  location_type?: string;
  search?: string;
};

/* ============================================================
   PROFILE
============================================================ */

export async function getTraineeProfile(
  userId: string
): Promise<TraineeProfile | null> {
  const { data, error } = await supabase
    .from("trainee_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (!error.message?.includes("AbortError")) {
      console.error("[getTraineeProfile]", error.message);
    }
    return null;
  }
  return data as TraineeProfile | null;
}

export async function saveTraineeProfile(
  userId: string,
  profile: Omit<TraineeProfile, "id" | "user_id" | "updated_at">
): Promise<boolean> {
  const { error } = await supabase
    .from("trainee_profiles")
    .upsert(
      { user_id: userId, ...profile, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[saveTraineeProfile]", error.message);
    return false;
  }
  return true;
}

export function calculateProfileScore(p: Partial<TraineeProfile>): number {
  const checks = [
    Boolean(p.full_name?.trim()),
    Boolean(p.photo_url?.trim()),
    Boolean(p.formation?.trim()),
    Boolean(p.school?.trim()),
    Boolean(p.education_level?.trim()),
    Boolean(p.bio?.trim()),
    Boolean(p.linkedin_url?.trim()),
    Boolean(p.cv_url),
    Boolean(p.availability_start),
    (p.skills?.length ?? 0) >= 2,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* ============================================================
   CV UPLOAD
============================================================ */

export async function uploadTraineeCv(
  userId: string,
  file: File
): Promise<string | null> {
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("cv-uploads")
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("[uploadTraineeCv]", error.message);
    return null;
  }
  const { data } = supabase.storage.from("cv-uploads").getPublicUrl(filePath);
  return data.publicUrl;
}

/* ============================================================
   INTERNSHIP OFFERS
============================================================ */

export async function getInternshipOffers(
  filters?: OfferFilters
): Promise<InternshipOffer[]> {
  let query = supabase
    .from("internship_offers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (filters?.domain) query = query.eq("domain", filters.domain);
  if (filters?.location_type) query = query.eq("location_type", filters.location_type);
  if (filters?.search)
    query = query.or(
      `title.ilike.%${filters.search}%,org_name.ilike.%${filters.search}%`
    );

  const { data, error } = await query;
  if (error) {
    console.error("[getInternshipOffers]", error.message);
    return [];
  }
  return (data ?? []) as InternshipOffer[];
}

export async function getBookmarkedOffers(
  traineeId: string
): Promise<InternshipOffer[]> {
  // Step 1: get bookmarked offer IDs
  const { data: bookmarks, error: bErr } = await supabase
    .from("trainee_bookmarks")
    .select("offer_id")
    .eq("trainee_id", traineeId)
    .order("created_at", { ascending: false });

  if (bErr) {
    console.error("[getBookmarkedOffers]", bErr.message);
    return [];
  }
  if (!bookmarks || bookmarks.length === 0) return [];

  const ids = bookmarks.map((b: { offer_id: string }) => b.offer_id);

  // Step 2: fetch offer details
  const { data, error } = await supabase
    .from("internship_offers")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    console.error("[getBookmarkedOffers:offers]", error.message);
    return [];
  }
  return (data ?? []) as InternshipOffer[];
}

/* ============================================================
   APPLICATIONS
============================================================ */

export async function applyToOffer(
  offerId: string,
  traineeId: string,
  coverLetter: string,
  cvUrl: string | null
): Promise<boolean> {
  const { error } = await supabase.from("trainee_applications").insert({
    offer_id: offerId,
    trainee_id: traineeId,
    cover_letter: coverLetter.trim() || null,
    cv_url: cvUrl,
    status: "pending",
  });
  if (error) {
    console.error("[applyToOffer]", error.message);
    return false;
  }
  return true;
}

export async function getMyApplications(
  traineeId: string
): Promise<TraineeApplication[]> {
  // Step 1: fetch application rows
  const { data: apps, error } = await supabase
    .from("trainee_applications")
    .select("id, created_at, updated_at, offer_id, trainee_id, cover_letter, cv_url, status, interview_date")
    .eq("trainee_id", traineeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyApplications]", error.message);
    return [];
  }
  if (!apps || apps.length === 0) return [];

  // Step 2: fetch related offers
  const offerIds = apps.map((a: { offer_id: string }) => a.offer_id);
  const { data: offers } = await supabase
    .from("internship_offers")
    .select("*")
    .in("id", offerIds);

  const offerMap: Record<string, InternshipOffer> = Object.fromEntries(
    (offers ?? []).map((o: InternshipOffer) => [o.id, o])
  );

  return apps.map((a: Omit<TraineeApplication, "internship_offers">) => ({
    ...a,
    internship_offers: offerMap[a.offer_id] ?? null,
  }));
}

export async function getAppliedOfferIds(traineeId: string): Promise<string[]> {
  const { data } = await supabase
    .from("trainee_applications")
    .select("offer_id")
    .eq("trainee_id", traineeId);
  return (data ?? []).map((r: { offer_id: string }) => r.offer_id);
}

/* ============================================================
   BOOKMARKS
============================================================ */

export async function getBookmarkedOfferIds(traineeId: string): Promise<string[]> {
  const { data } = await supabase
    .from("trainee_bookmarks")
    .select("offer_id")
    .eq("trainee_id", traineeId);
  return (data ?? []).map((r: { offer_id: string }) => r.offer_id);
}

export async function toggleBookmark(
  traineeId: string,
  offerId: string,
  isCurrentlyBookmarked: boolean
): Promise<boolean> {
  if (isCurrentlyBookmarked) {
    const { error } = await supabase
      .from("trainee_bookmarks")
      .delete()
      .eq("trainee_id", traineeId)
      .eq("offer_id", offerId);
    return !error;
  }
  const { error } = await supabase
    .from("trainee_bookmarks")
    .insert({ trainee_id: traineeId, offer_id: offerId });
  return !error;
}

/* ============================================================
   DASHBOARD STATS
============================================================ */

export async function getTraineeDashboardStats(
  userId: string
): Promise<TraineeDashboardStats> {
  const [offersRes, appsRes, interviewsRes, membershipsRes] = await Promise.all([
    supabase
      .from("internship_offers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("trainee_applications")
      .select("id", { count: "exact", head: true })
      .eq("trainee_id", userId),
    supabase
      .from("trainee_applications")
      .select("id", { count: "exact", head: true })
      .eq("trainee_id", userId)
      .eq("status", "interview"),
    supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  let tasksAssigned = 0;
  if (membershipsRes.data && membershipsRes.data.length > 0) {
    const wsIds = membershipsRes.data.map(
      (m: { workspace_id: string }) => m.workspace_id
    );
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("workspace_id", wsIds)
      .eq("completed", false);
    tasksAssigned = count ?? 0;
  }

  return {
    offersAvailable: offersRes.count ?? 0,
    applicationsSent: appsRes.count ?? 0,
    interviewsPending: interviewsRes.count ?? 0,
    tasksAssigned,
  };
}

/* ============================================================
   NOTIFICATIONS  — plugged into existing system
============================================================ */

export async function notifyAllTraineesNewOffer(
  orgName: string,
  offerTitle: string,
  offerId: string
): Promise<void> {
  const { data: trainees, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "trainee");

  if (error || !trainees || trainees.length === 0) return;

  const rows = trainees.map((t: { id: string }) => ({
    user_id: t.id,
    type: "new_offer",
    title: "Nouvelle offre de stage",
    message: `${orgName} vient de publier : "${offerTitle}"`,
    project_id: offerId,
    workspace_id: null,
    is_read: false,
  }));

  await supabase.from("notifications").insert(rows);
}

export async function notifyTraineeStatusChange(
  traineeId: string,
  orgName: string,
  offerTitle: string,
  newStatus: ApplicationStatus
): Promise<void> {
  const msgs: Record<ApplicationStatus, string> = {
    reviewed: `${orgName} a examiné votre candidature pour "${offerTitle}"`,
    accepted: `🎉 ${orgName} a accepté votre candidature pour "${offerTitle}"`,
    rejected: `${orgName} n'a pas retenu votre candidature pour "${offerTitle}"`,
    interview: `${orgName} souhaite vous rencontrer — "${offerTitle}"`,
    pending: `Candidature en attente chez ${orgName}`,
  };

  await addNotification({
    user_id: traineeId,
    type: `application_${newStatus}`,
    title: "Mise à jour de candidature",
    message: msgs[newStatus],
    project_id: null,
    workspace_id: null,
    is_read: false,
  });
}

/* ============================================================
   SKILL MATCH SCORE
============================================================ */

export function calculateSkillMatch(
  traineeSkills: string[],
  offerSkills: string[]
): number {
  if (!offerSkills.length || !traineeSkills.length) return 0;
  const tLower = traineeSkills.map((s) => s.toLowerCase());
  const matched = offerSkills.filter((s) => tLower.includes(s.toLowerCase())).length;
  return Math.round((matched / offerSkills.length) * 100);
}
