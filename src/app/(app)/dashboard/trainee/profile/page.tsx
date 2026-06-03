"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import styles from "./traineeProfile.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  getTraineeProfile,
  saveTraineeProfile,
  calculateProfileScore,
  uploadTraineeCv,
} from "@/lib/traineeService";

/* ================================================================
   CONSTANTS
================================================================ */

const SKILLS_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Python", "SQL",
  "Figma", "UX Design", "Digital Marketing", "SEO", "Data Analysis",
  "Project Management", "Communication", "Excel", "Photoshop", "Node.js",
];

const EDUCATION_LEVELS = [
  "Bac+2", "Bac+3 (Licence)", "Bac+4", "Bac+5 (Master)", "Doctorat",
];

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  "Personal Info",
  "Bio & Links",
  "Skills",
  "Availability",
  "Documents",
];

/* ================================================================
   COMPONENT
================================================================ */

export default function TraineeProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  /* ---- Form state ---- */
  const [fullName, setFullName]               = useState("");
  const [photoUrl, setPhotoUrl]               = useState("");
  const [formation, setFormation]             = useState("");
  const [school, setSchool]                   = useState("");
  const [educationLevel, setEducationLevel]   = useState("");
  const [skills, setSkills]                   = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl]         = useState("");
  const [bio, setBio]                         = useState("");
  const [availabilityStart, setAvailStart]    = useState("");
  const [availabilityEnd, setAvailEnd]        = useState("");
  const [cvUrl, setCvUrl]                     = useState<string | null>(null);
  const [cvUploading, setCvUploading]         = useState(false);
  const [cvDeleting, setCvDeleting]           = useState(false);

  /* ---- Redirect if not logged in ---- */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* ---- Load existing profile ---- */
  useEffect(() => {
    if (!user) return;
    getTraineeProfile(user.id).then((p) => {
      if (!p) return;
      setFullName(p.full_name ?? "");
      setPhotoUrl(p.photo_url ?? "");
      setFormation(p.formation ?? "");
      setSchool(p.school ?? "");
      setEducationLevel(p.education_level ?? "");
      setSkills(p.skills ?? []);
      setLinkedinUrl(p.linkedin_url ?? "");
      setBio(p.bio ?? "");
      setAvailStart(p.availability_start ?? "");
      setAvailEnd(p.availability_end ?? "");
      setCvUrl(p.cv_url ?? null);
    });
  }, [user?.id]);

  /* ---- Auto-hide saved banner ---- */
  useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(t);
  }, [showSaved]);

  /* ---- Profile completion score ---- */
  const score = useMemo(
    () =>
      calculateProfileScore({
        full_name: fullName,
        photo_url: photoUrl,
        formation,
        school,
        education_level: educationLevel,
        skills,
        linkedin_url: linkedinUrl,
        bio,
        availability_start: availabilityStart || null,
        cv_url: cvUrl,
      }),
    [fullName, photoUrl, formation, school, educationLevel, skills, linkedinUrl, bio, availabilityStart, cvUrl]
  );

  /* ---- Toggle skill ---- */
  const toggleSkill = (s: string) =>
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  /* ---- Save current step to Supabase ---- */
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    try {
      await saveTraineeProfile(user.id, {
        full_name: fullName,
        photo_url: photoUrl,
        formation,
        school,
        education_level: educationLevel,
        skills,
        linkedin_url: linkedinUrl,
        bio,
        availability_start: availabilityStart || null,
        availability_end: availabilityEnd || null,
        cv_url: cvUrl,
      });
      setShowSaved(true);
      return true;
    } catch (err) {
      console.error("[TraineeProfile] save error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, fullName, photoUrl, formation, school, educationLevel, skills, linkedinUrl, bio, availabilityStart, availabilityEnd, cvUrl]);

  /* ---- Navigation ---- */
  const handleNext = async () => {
    const ok = await saveCurrentStep();
    if (!ok) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dashboard/trainee");
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
    const url = await uploadTraineeCv(user.id, file);
    if (url) setCvUrl(url);
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
          <h1 className={styles.title}>My Trainee Profile</h1>
          <p className={styles.muted}>
            A complete profile increases your chances of being contacted by organizations.
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

        {/* STEP 1: PERSONAL INFO */}
        {currentStep === 1 && (
          <>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sophie Martin" />
              </div>
              <div className={styles.field}>
                <label>Program / Major</label>
                <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="Master's in Computer Science" />
              </div>
              <div className={styles.field}>
                <label>School / University</label>
                <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University of Paris" />
              </div>
              <div className={styles.field}>
                <label>Education Level</label>
                <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                  <option value="">Select</option>
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Avatar URL</label>
                <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" type="url" />
              </div>
            </div>
          </>
        )}

        {/* STEP 2: BIO & LINKS */}
        {currentStep === 2 && (
          <>
            <h2 className={styles.sectionTitle}>Bio & Professional Links</h2>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label>LinkedIn URL</label>
              <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" type="url" />
            </div>
            <div className={styles.fieldFull}>
              <label>Bio / Introduction</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                placeholder="Describe your background, motivations and what you're looking for in an internship…"
              />
            </div>
          </>
        )}

        {/* STEP 3: SKILLS */}
        {currentStep === 3 && (
          <>
            <h2 className={styles.sectionTitle}>Skills</h2>
            <p className={styles.cardHint}>Select at least 2 skills that best represent you.</p>
            <div className={styles.pills}>
              {SKILLS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.pill} ${skills.includes(s) ? styles.pillActive : ""}`}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 4: AVAILABILITY */}
        {currentStep === 4 && (
          <>
            <h2 className={styles.sectionTitle}>Availability</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Available from</label>
                <input type="date" value={availabilityStart} onChange={(e) => setAvailStart(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Until (optional)</label>
                <input type="date" value={availabilityEnd} onChange={(e) => setAvailEnd(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* STEP 5: DOCUMENTS & SUMMARY */}
        {currentStep === 5 && (
          <>
            <h2 className={styles.sectionTitle}>CV / Resume</h2>
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
                <p className={styles.completionTitle}>Profile Completion</p>
                <p className={styles.completionHint}>
                  {score < 50 && "Add your info and skills to attract organizations."}
                  {score >= 50 && score < 80 && "Good start! A few more details will boost your visibility."}
                  {score >= 80 && score < 100 && "Excellent! Almost there."}
                  {score === 100 && "Your profile is 100% complete — ready to be found!"}
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
