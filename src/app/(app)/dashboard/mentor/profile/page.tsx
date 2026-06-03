"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import styles from "./mentorProfile.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  loadMentorProfile,
  saveMentorProfile,
  getEmptyMentorProfile,
  MentorProfile,
} from "@/lib/localMentorProfiles";
import { calculateMentorProfileScore, getMentorProfileLevel } from "@/lib/mentorProfileScore";

/* ================================================================
   CONSTANTS
================================================================ */

const EXPERTISE = [
  "Project Strategy", "NGO Operations", "Fundraising",
  "Monitoring & Evaluation", "Community Engagement",
  "Leadership Development", "Impact Measurement",
  "Digital Transformation", "Social Innovation",
];

const SECTORS = [
  "Education", "Health", "Environment",
  "Youth Development", "Human Rights", "Technology",
];

const FOCUS = [
  "Early-stage guidance", "Scaling strategy",
  "Operational improvement", "Impact measurement", "Career mentoring",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLLAB_TYPES = ["Remote", "In-person", "Hybrid"];

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  "Basic Info",
  "Background",
  "Expertise & Sectors",
  "Mentorship Style",
  "Documents",
];

/* ================================================================
   COMPONENT
================================================================ */

export default function MentorProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const [profile, setProfile] = useState<MentorProfile>(getEmptyMentorProfile());

  const [cvUrl, setCvUrl]       = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDeleting, setCvDeleting]   = useState(false);

  /* ---- Redirect ---- */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* ---- Load profile ---- */
  useEffect(() => {
    if (!user) return;
    loadMentorProfile(user.id).then((p) => {
      if (p) setProfile(p);
    });
    supabase
      .from("profiles")
      .select("cv_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.cv_url) setCvUrl(data.cv_url);
      });
  }, [user?.id]);

  /* ---- Auto-hide saved banner ---- */
  useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(t);
  }, [showSaved]);

  /* ---- Score ---- */
  const score = calculateMentorProfileScore(profile);
  const level = getMentorProfileLevel(score);

  /* ---- Toggle array field ---- */
  const toggleArray = (field: "expertise" | "sectors" | "mentorship_focus" | "available_days", value: string) => {
    setProfile((prev) => {
      const arr = (prev[field] as string[]) ?? [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  /* ---- Save to Supabase ---- */
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    try {
      await saveMentorProfile(user.id, profile);
      setShowSaved(true);
      return true;
    } catch (err) {
      console.error("[MentorProfile] save error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, profile]);

  /* ---- Navigation ---- */
  const handleNext = async () => {
    const ok = await saveCurrentStep();
    if (!ok) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dashboard/mentor");
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---- CV handlers ---- */
  const handleCvUpload = async (file: File) => {
    if (!user) return;
    setCvUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cv-uploads").upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("cv-uploads").getPublicUrl(filePath);
      await supabase.from("profiles").update({ cv_url: data.publicUrl }).eq("id", user.id);
      setCvUrl(data.publicUrl);
    }
    setCvUploading(false);
  };

  const handleDeleteCV = async () => {
    if (!user || !cvUrl) return;
    setCvDeleting(true);
    const marker = "/cv-uploads/";
    const idx = cvUrl.indexOf(marker);
    if (idx !== -1) await supabase.storage.from("cv-uploads").remove([cvUrl.substring(idx + marker.length)]);
    await supabase.from("profiles").update({ cv_url: null }).eq("id", user.id);
    setCvUrl(null);
    setCvDeleting(false);
  };

  if (loading || !user) return null;

  const progressPct = Math.round((currentStep / TOTAL_STEPS) * 100);

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div className={styles.wrapper}>

      {/* ── PAGE HEADER ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Mentor Profile</h1>
          <p className={styles.muted}>
            Strengthen your profile to increase project matching quality.
          </p>
        </div>
        {showSaved && (
          <div className={styles.autoSave}>
            <CheckCircle size={14} />
            All changes saved to cloud
          </div>
        )}
      </div>

      {/* ── STEP PROGRESS ── */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressHeader}>
          <span className={styles.stepLabel}>
            Step {currentStep} of {TOTAL_STEPS} &mdash;{" "}
            <strong>{STEP_LABELS[currentStep - 1]}</strong>
          </span>
          <span className={styles.scoreChip}>{score}% — {level}</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.stepDots}>
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              title={label}
              className={[
                styles.dot,
                i + 1 < currentStep ? styles.dotDone : "",
                i + 1 === currentStep ? styles.dotActive : "",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div className={styles.card}>

        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Dr. Amina Khalil" />
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Casablanca, Morocco" />
              </div>
              <div className={styles.field}>
                <label>Languages</label>
                <input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="English, French, Arabic" />
              </div>
              <div className={styles.field}>
                <label>Photo URL</label>
                <input value={profile.photo_url} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} placeholder="https://…" type="url" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Headline</label>
                <input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="NGO Strategy Consultant with 10+ years in social impact" />
              </div>
            </div>
          </>
        )}

        {/* STEP 2: PROFESSIONAL BACKGROUND */}
        {currentStep === 2 && (
          <>
            <h3 className={styles.sectionTitle}>Professional Background</h3>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Current Position</label>
                <input value={profile.current_position} onChange={(e) => setProfile({ ...profile, current_position: e.target.value })} placeholder="Director of Programs, XYZ Foundation" />
              </div>
              <div className={styles.field}>
                <label>Years of Experience</label>
                <input value={profile.experience_years} onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} placeholder="Example: 10" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>About / Mentorship Philosophy</label>
                <textarea value={profile.about} onChange={(e) => setProfile({ ...profile, about: e.target.value })} placeholder="Share your story, values, and how you approach mentorship…" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Key Achievements</label>
                <textarea value={profile.achievements} onChange={(e) => setProfile({ ...profile, achievements: e.target.value })} placeholder="Describe your most impactful projects or milestones…" />
              </div>
            </div>
          </>
        )}

        {/* STEP 3: EXPERTISE & SECTORS */}
        {currentStep === 3 && (
          <>
            <h3 className={styles.sectionTitle}>Expertise</h3>
            <div className={styles.pills}>
              {EXPERTISE.map((item) => (
                <div
                  key={item}
                  className={`${styles.pill} ${profile.expertise?.includes(item) ? styles.pillActive : ""}`}
                  onClick={() => toggleArray("expertise", item)}
                >
                  {item}
                </div>
              ))}
            </div>

            <h3 className={styles.sectionTitle} style={{ marginTop: 28 }}>Sectors</h3>
            <div className={styles.pills}>
              {SECTORS.map((item) => (
                <div
                  key={item}
                  className={`${styles.pill} ${profile.sectors?.includes(item) ? styles.pillActive : ""}`}
                  onClick={() => toggleArray("sectors", item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 4: MENTORSHIP STYLE & AVAILABILITY */}
        {currentStep === 4 && (
          <>
            <h3 className={styles.sectionTitle}>Mentorship Focus</h3>
            <div className={styles.pills}>
              {FOCUS.map((item) => (
                <div
                  key={item}
                  className={`${styles.pill} ${profile.mentorship_focus?.includes(item) ? styles.pillActive : ""}`}
                  onClick={() => toggleArray("mentorship_focus", item)}
                >
                  {item}
                </div>
              ))}
            </div>

            <h3 className={styles.sectionTitle} style={{ marginTop: 28 }}>Availability</h3>
            <div className={styles.pills} style={{ marginBottom: 16 }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={`${styles.pill} ${profile.available_days?.includes(day) ? styles.pillActive : ""}`}
                  onClick={() => toggleArray("available_days", day)}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Hours per Week</label>
                <input value={profile.availability_hours} onChange={(e) => setProfile({ ...profile, availability_hours: e.target.value })} placeholder="Example: 4–6 hours" />
              </div>
              <div className={styles.field}>
                <label>Collaboration Type</label>
                <select value={profile.collaboration_type} onChange={(e) => setProfile({ ...profile, collaboration_type: e.target.value })}>
                  <option value="">Select</option>
                  {COLLAB_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* STEP 5: DOCUMENTS & SUMMARY */}
        {currentStep === 5 && (
          <>
            <h3 className={styles.sectionTitle}>CV / Resume</h3>
            {cvUrl && (
              <div className={styles.cvBanner}>
                <span>✅ CV uploaded successfully</span>
                <div className={styles.cvBannerActions}>
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">View current CV ↗</a>
                  <button onClick={handleDeleteCV} disabled={cvDeleting} className={styles.deleteBtn} title="Delete CV">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
            <label className={styles.cvLabel}>
              {cvUrl ? "Replace CV" : "Upload your CV"} (PDF, DOC)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={cvUploading}
              className={styles.fileInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCvUpload(file);
              }}
            />
            {cvUploading && <p className={styles.uploading}>Uploading…</p>}

            <div className={styles.completionCard}>
              <div className={styles.completionScore}>{score}%</div>
              <div>
                <p className={styles.completionTitle}>Profile Strength — {level}</p>
                <p className={styles.completionHint}>
                  {score < 50 && "Fill in your background and expertise to start matching."}
                  {score >= 50 && score < 80 && "Good progress! Add your focus areas and availability."}
                  {score >= 80 && score < 100 && "Excellent profile! A few details remain."}
                  {score === 100 && "Outstanding — your profile is fully complete!"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── STICKY FOOTER ── */}
        <div className={styles.stickyFooter}>
          {currentStep > 1 ? (
            <button type="button" className={styles.btnBack} onClick={handleBack} disabled={isSaving}>
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button type="button" className={styles.btnNext} onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <span className={styles.spinnerWrap}>
                <Loader2 size={15} className={styles.spinIcon} />
                Saving…
              </span>
            ) : currentStep === TOTAL_STEPS ? (
              "Complete Profile 🎉"
            ) : (
              "Save & Next →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
