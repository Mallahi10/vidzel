"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import styles from "./profile.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  loadStudentProfile,
  saveStudentProfile,
  getEmptyStudentProfile,
  StudentProfile,
} from "@/lib/localStudentProfiles";

/* ================================================================
   CONSTANTS
================================================================ */

const IMPACT_AREAS = [
  "Education", "Health", "Environment", "Technology for Good",
  "Youth Development", "Human Rights", "Public Policy",
  "Entrepreneurship", "Social Innovation", "Other",
];

const SKILLS = [
  "Research", "Academic Writing", "Public Speaking", "Data Analysis",
  "Graphic Design", "Programming", "Project Management",
  "Community Outreach", "Content Creation", "Leadership", "Other",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLLAB_TYPES = ["Remote", "In-person", "Hybrid"];
const ROLES = [
  "Research Support", "Strategy & Planning", "Field Work",
  "Technical Support", "Communications", "Open to Any",
];

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  "Basic Identity",
  "Impact & Skills",
  "Collaboration",
  "Experience & Goals",
  "Documents",
];

/* ================================================================
   COMPONENT
================================================================ */

export default function StudentProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const [profile, setProfile] = useState<StudentProfile>(getEmptyStudentProfile());

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDeleting, setCvDeleting] = useState(false);

  /* ---- Redirect if not logged in ---- */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* ---- Load existing profile from Supabase ---- */
  useEffect(() => {
    if (!user) return;
    loadStudentProfile(user.id).then((p) => {
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

  /* ---- Auto-hide saved banner after 4 s ---- */
  useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(t);
  }, [showSaved]);

  /* ---- Profile completion score ---- */
  const score = useMemo(() => {
    const checks = [
      profile.full_name, profile.location, profile.school, profile.major,
      profile.year_of_study, profile.graduation_year, profile.headline,
      profile.impact_areas.length, profile.skills.length,
      profile.collab_type, profile.role_preference,
      profile.available_days.length, profile.hours_per_week,
      profile.experience, profile.goals,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  /* ---- Toggle array field ---- */
  const toggle = (field: keyof StudentProfile, value: string) => {
    setProfile((prev) => {
      const arr = (prev[field] as string[]) ?? [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  /* ---- Save current step data to Supabase ---- */
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    try {
      await saveStudentProfile(user.id, profile);
      setShowSaved(true);
      return true;
    } catch (err) {
      console.error("[StudentProfile] save error:", err);
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
      router.push("/dashboard/student");
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
    const { error } = await supabase.storage
      .from("cv-uploads")
      .upload(filePath, file, { upsert: true });
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
    if (idx !== -1) {
      await supabase.storage.from("cv-uploads").remove([cvUrl.substring(idx + marker.length)]);
    }
    await supabase.from("profiles").update({ cv_url: null }).eq("id", user.id);
    setCvUrl(null);
    setCvDeleting(false);
  };

  if (loading) return null;

  const progressPct = Math.round((currentStep / TOTAL_STEPS) * 100);

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div className={styles.page}>

      {/* ── PAGE HEADER ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Student Profile</h1>
          <p className={styles.muted}>Build your impact-focused academic profile.</p>
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
          <span className={styles.scoreChip}>{score}% profile complete</span>
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

        {/* ── STEP 1 : BASIC IDENTITY ── */}
        {currentStep === 1 && (
          <>
            <h2 className={styles.sectionTitle}>Basic Identity</h2>
            <div className={styles.formGrid}>
              <Field label="Full Name">
                <input
                  value={profile.full_name}
                  placeholder="Your legal full name"
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  value={profile.location}
                  placeholder="City, Country"
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </Field>
              <Field label="University / School">
                <input
                  value={profile.school}
                  placeholder="Name of your institution"
                  onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                />
              </Field>
              <Field label="Degree / Major">
                <input
                  value={profile.major}
                  placeholder="Your academic focus"
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                />
              </Field>
              <Field label="Year of Study">
                <input
                  value={profile.year_of_study}
                  placeholder="Example: 2nd Year"
                  onChange={(e) => setProfile({ ...profile, year_of_study: e.target.value })}
                />
              </Field>
              <Field label="Expected Graduation Year">
                <input
                  value={profile.graduation_year}
                  placeholder="Example: 2027"
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                />
              </Field>
              <Field label="Languages">
                <input
                  value={profile.languages}
                  placeholder="English, French…"
                  onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                />
              </Field>
              <Field label="Headline" full>
                <input
                  value={profile.headline}
                  placeholder="Public Policy student passionate about youth education reform."
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                />
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 2 : IMPACT & SKILLS ── */}
        {currentStep === 2 && (
          <>
            <h2 className={styles.sectionTitle}>Impact Interests</h2>
            <p className={styles.cardHint}>Select all areas that align with your goals.</p>
            <div className={styles.pills}>
              {IMPACT_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  className={`${styles.pill} ${profile.impact_areas.includes(area) ? styles.pillActive : ""}`}
                  onClick={() => toggle("impact_areas", area)}
                >
                  {area}
                </button>
              ))}
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>Skills & Capabilities</h2>
            <p className={styles.cardHint}>Pick at least 2 skills you can contribute.</p>
            <div className={styles.pills}>
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`${styles.pill} ${profile.skills.includes(skill) ? styles.pillActive : ""}`}
                  onClick={() => toggle("skills", skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 3 : COLLABORATION & AVAILABILITY ── */}
        {currentStep === 3 && (
          <>
            <h2 className={styles.sectionTitle}>Collaboration Preferences</h2>
            <div className={styles.formGrid}>
              <Field label="Collaboration Type">
                <select
                  value={profile.collab_type}
                  onChange={(e) => setProfile({ ...profile, collab_type: e.target.value })}
                >
                  <option value="">Select</option>
                  {COLLAB_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Preferred Role">
                <select
                  value={profile.role_preference}
                  onChange={(e) => setProfile({ ...profile, role_preference: e.target.value })}
                >
                  <option value="">Select</option>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>Availability</h2>
            <p className={styles.cardHint}>Select the days you are typically free.</p>
            <div className={styles.pills}>
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`${styles.pill} ${profile.available_days.includes(day) ? styles.pillActive : ""}`}
                  onClick={() => toggle("available_days", day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className={styles.formGrid} style={{ marginTop: 16 }}>
              <Field label="Hours per Week">
                <input
                  value={profile.hours_per_week}
                  placeholder="Example: 8–10 hours"
                  onChange={(e) => setProfile({ ...profile, hours_per_week: e.target.value })}
                />
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 4 : EXPERIENCE & GOALS ── */}
        {currentStep === 4 && (
          <>
            <h2 className={styles.sectionTitle}>Experience & Goals</h2>
            <div className={styles.fieldFull} style={{ marginBottom: 16 }}>
              <label>Relevant Experience</label>
              <textarea
                value={profile.experience}
                placeholder="Describe projects, internships, volunteering, leadership roles, or real-world work you've done."
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              />
            </div>
            <div className={styles.fieldFull}>
              <label>What do you hope to gain from Vidzel?</label>
              <textarea
                value={profile.goals}
                placeholder="Example: I want hands-on experience in policy design and mentorship in social innovation."
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              />
            </div>
          </>
        )}

        {/* ── STEP 5 : DOCUMENTS & SUMMARY ── */}
        {currentStep === 5 && (
          <>
            <h2 className={styles.sectionTitle}>CV / Resume</h2>

            {cvUrl && (
              <div className={styles.cvBanner}>
                <span>✅ CV uploaded successfully</span>
                <div className={styles.cvBannerActions}>
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    View current CV
                  </a>
                  <button
                    onClick={handleDeleteCV}
                    disabled={cvDeleting}
                    className={styles.deleteBtn}
                    title="Delete CV"
                  >
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

            {/* Completion summary */}
            <div className={styles.completionCard}>
              <div className={styles.completionScore}>{score}%</div>
              <div>
                <p className={styles.completionTitle}>Profile Completion</p>
                <p className={styles.completionHint}>
                  {score < 50 && "Add your basic info and skills to stand out to organizations."}
                  {score >= 50 && score < 80 && "Almost there! A few more details will boost your visibility."}
                  {score >= 80 && score < 100 && "Excellent! Just a couple of fields missing."}
                  {score === 100 && "Your profile is 100% complete — ready to match!"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── STICKY FOOTER NAVIGATION ── */}
        <div className={styles.stickyFooter}>
          {currentStep > 1 ? (
            <button
              type="button"
              className={styles.btnBack}
              onClick={handleBack}
              disabled={isSaving}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className={styles.btnNext}
            onClick={handleNext}
            disabled={isSaving}
          >
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

/* ================================================================
   FIELD HELPER
================================================================ */

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? `${styles.field} ${styles.fieldFull}` : styles.field}>
      <label>{label}</label>
      {children}
    </div>
  );
}
