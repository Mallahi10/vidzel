"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import styles from "./volunteerProfile.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  loadVolunteerProfile,
  saveVolunteerProfile,
  VolunteerProfile,
} from "@/lib/localVolunteerProfiles";
import { calculateVolunteerProfileScore } from "@/lib/volunteerProfileScore";

/* ================================================================
   CONSTANTS
================================================================ */

const INTERESTS = [
  "Education", "Health", "Environment",
  "Youth Development", "Technology", "Human Rights",
];

const SKILLS = [
  "Project Management", "Teaching", "Graphic Design", "Social Media",
  "Research", "Fundraising", "Data Analysis", "Event Planning",
  "Web Development", "Translation", "Grant Writing",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLLABORATION_TYPES = [
  "Team Member", "Team Lead", "Research Support",
  "Technical Support", "Communications", "Strategy",
];

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  "Basic Info",
  "Skills & Causes",
  "Collaboration",
  "Background",
  "Documents",
];

function getUserKey(user: any) {
  return user?.id || user?.email || "unknown-user";
}

/* ================================================================
   COMPONENT
================================================================ */

export default function VolunteerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const userKey = useMemo(() => getUserKey(user), [user]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  /* ---- Form state (mirrors VolunteerProfile) ---- */
  const [fullName, setFullName]                       = useState("");
  const [location, setLocation]                       = useState("");
  const [headline, setHeadline]                       = useState("");
  const [photoUrl, setPhotoUrl]                       = useState("");
  const [languages, setLanguages]                     = useState("");
  const [skills, setSkills]                           = useState<string[]>([]);
  const [interests, setInterests]                     = useState<string[]>([]);
  const [collaborationType, setCollaborationType]     = useState("");
  const [experience, setExperience]                   = useState("");
  const [education, setEducation]                     = useState("");
  const [availabilityHours, setAvailabilityHours]     = useState("");
  const [availableDays, setAvailableDays]             = useState<string[]>([]);
  const [motivation, setMotivation]                   = useState("");

  const [cvUrl, setCvUrl]           = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDeleting, setCvDeleting]   = useState(false);

  /* ---- Redirect ---- */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* ---- Load profile ---- */
  useEffect(() => {
    if (!userKey || userKey === "unknown-user") return;
    loadVolunteerProfile(userKey).then((p) => {
      if (!p) return;
      setFullName(p.full_name);
      setLocation(p.location);
      setHeadline(p.headline);
      setPhotoUrl(p.photo_url);
      setLanguages(p.languages);
      setSkills(p.skills ?? []);
      setInterests(p.interests ?? []);
      setCollaborationType(p.collaboration_type ?? "");
      setExperience(p.experience);
      setEducation(p.education);
      setAvailabilityHours(p.availability_hours);
      setAvailableDays(p.available_days ?? []);
      setMotivation(p.motivation ?? "");
    });
    if (user) {
      supabase
        .from("profiles")
        .select("cv_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.cv_url) setCvUrl(data.cv_url);
        });
    }
  }, [userKey, user]);

  /* ---- Auto-hide saved banner ---- */
  useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(t);
  }, [showSaved]);

  /* ---- Score ---- */
  const score = useMemo(
    () =>
      calculateVolunteerProfileScore({
        full_name: fullName, location, headline, photo_url: photoUrl,
        languages, skills, interests, collaboration_type: collaborationType,
        experience, education, availability_hours: availabilityHours,
        available_days: availableDays, motivation,
      }),
    [fullName, location, headline, photoUrl, languages, skills, interests,
      collaborationType, experience, education, availabilityHours, availableDays, motivation]
  );

  /* ---- Toggle array ---- */
  const toggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, arr: string[]) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  /* ---- Save to Supabase ---- */
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!userKey || userKey === "unknown-user") return false;
    setIsSaving(true);
    try {
      const profileData: VolunteerProfile = {
        full_name: fullName, location, headline, photo_url: photoUrl,
        languages, skills, interests, collaboration_type: collaborationType,
        experience, education, availability_hours: availabilityHours,
        available_days: availableDays, motivation,
        updated_at: new Date().toISOString(),
      };
      await saveVolunteerProfile(userKey, profileData);
      setShowSaved(true);
      return true;
    } catch (err) {
      console.error("[VolunteerProfile] save error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userKey, fullName, location, headline, photoUrl, languages, skills, interests,
    collaborationType, experience, education, availabilityHours, availableDays, motivation]);

  /* ---- Navigation ---- */
  const handleNext = async () => {
    const ok = await saveCurrentStep();
    if (!ok) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dashboard/volunteer");
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
          <h1 className={styles.title}>Volunteer Profile</h1>
          <p className={styles.muted}>Complete your profile to improve project matching.</p>
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

        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
              </div>
              <div className={styles.field}>
                <label>Headline</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Passionate about youth education and community development" />
              </div>
              <div className={styles.field}>
                <label>Photo URL</label>
                <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" type="url" />
              </div>
              <div className={styles.fieldFull}>
                <label>Languages</label>
                <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, French…" />
              </div>
            </div>
          </>
        )}

        {/* STEP 2: SKILLS & CAUSES */}
        {currentStep === 2 && (
          <>
            <h2 className={styles.sectionTitle}>Skills</h2>
            <div className={styles.pills}>
              {SKILLS.map((s) => (
                <div
                  key={s}
                  className={`${styles.pill} ${skills.includes(s) ? styles.pillActive : ""}`}
                  onClick={() => toggle(s, setSkills, skills)}
                >
                  {s}
                </div>
              ))}
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>Causes of Interest</h2>
            <div className={styles.pills}>
              {INTERESTS.map((i) => (
                <div
                  key={i}
                  className={`${styles.pill} ${interests.includes(i) ? styles.pillActive : ""}`}
                  onClick={() => toggle(i, setInterests, interests)}
                >
                  {i}
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 3: COLLABORATION & AVAILABILITY */}
        {currentStep === 3 && (
          <>
            <h2 className={styles.sectionTitle}>Project Preferences</h2>
            <div className={styles.field} style={{ marginBottom: 20 }}>
              <label>Preferred Role</label>
              <select value={collaborationType} onChange={(e) => setCollaborationType(e.target.value)}>
                <option value="">Select</option>
                {COLLABORATION_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <h2 className={styles.sectionTitle}>Availability</h2>
            <div className={styles.pills} style={{ marginBottom: 16 }}>
              {DAYS.map((d) => (
                <div
                  key={d}
                  className={`${styles.pill} ${availableDays.includes(d) ? styles.pillActive : ""}`}
                  onClick={() => toggle(d, setAvailableDays, availableDays)}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className={styles.field}>
              <label>Hours per week</label>
              <input value={availabilityHours} onChange={(e) => setAvailabilityHours(e.target.value)} placeholder="Example: 5–10 hours" />
            </div>
          </>
        )}

        {/* STEP 4: BACKGROUND & MOTIVATION */}
        {currentStep === 4 && (
          <>
            <h2 className={styles.sectionTitle}>Background & Motivation</h2>
            <div className={styles.fieldFull} style={{ marginBottom: 16 }}>
              <label>Experience</label>
              <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Describe your volunteer history, relevant projects, or community involvement…" />
            </div>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label>Education</label>
              <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Degree & field of study" />
            </div>
            <div className={styles.fieldFull}>
              <label>Why do you want to volunteer?</label>
              <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Share what drives you and what impact you hope to create…" />
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
                  {score < 50 && "Add your background and skills to start matching with projects."}
                  {score >= 50 && score < 80 && "Nice work! A few more details will increase your visibility."}
                  {score >= 80 && score < 100 && "Almost perfect! Just a few fields missing."}
                  {score === 100 && "Profile complete — ready to make an impact!"}
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
