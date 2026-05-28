"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
// AJOUTÉ [Task 3] : upload CV vers Supabase Storage
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./mentorProfile.module.css";

import {
  loadMentorProfile,
  saveMentorProfile,
  getEmptyMentorProfile,
  MentorProfile,
} from "@/lib/localMentorProfiles";

import {
  calculateMentorProfileScore,
  getMentorProfileLevel,
} from "@/lib/mentorProfileScore";

/* ================= CONSTANTS ================= */

const EXPERTISE = [
  "Project Strategy",
  "NGO Operations",
  "Fundraising",
  "Monitoring & Evaluation",
  "Community Engagement",
  "Leadership Development",
  "Impact Measurement",
  "Digital Transformation",
  "Social Innovation",
];

const SECTORS = [
  "Education",
  "Health",
  "Environment",
  "Youth Development",
  "Human Rights",
  "Technology",
];

const FOCUS = [
  "Early-stage guidance",
  "Scaling strategy",
  "Operational improvement",
  "Impact measurement",
  "Career mentoring",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ================= PAGE ================= */

export default function MentorProfilePage() {
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<MentorProfile>(
    getEmptyMentorProfile()
  );

  const [saved, setSaved] = useState(false);
  // AJOUTÉ [Task 3] : états pour le CV
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  const userKey = useMemo(() => {
    if (!user) return "";
    return user.id || user.email || "";
  }, [user]);

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    if (!userKey) return;
    loadMentorProfile(userKey).then((existing) => {
      if (existing) setProfile(existing);
    });
  }, [userKey]);

  // AJOUTÉ [Task 3] : charger le CV existant depuis profiles
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("cv_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.cv_url) setCvUrl(data.cv_url);
      });
  }, [user?.id]);

  // AJOUTÉ [Task 3] : upload CV vers Storage + sauvegarde URL dans profiles
  const handleCvUpload = async (file: File) => {
    if (!user) return;
    setCvUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error("[CV upload]", uploadError.message);
      setCvUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(filePath);
    await supabase.from("profiles").update({ cv_url: urlData.publicUrl }).eq("id", user.id);
    setCvUrl(urlData.publicUrl);
    setCvUploading(false);
  };

  /* ================= SCORE ================= */

  const score = calculateMentorProfileScore(profile);
  const level = getMentorProfileLevel(score);

  /* ================= SAVE ================= */

  function handleSave() {
    if (!userKey) return;
    saveMentorProfile(userKey, profile).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  /* ================= TOGGLE ARRAY ================= */

  function toggleArrayField(
    field: "expertise" | "sectors" | "mentorship_focus",
    value: string
  ) {
    setProfile((prev) => {
      const current = prev[field] || [];

      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [field]: updated,
      };
    });
  }

  /* ================= SAFETY ================= */

  if (loading) return null;
  if (!user) return null;

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Mentor Profile</h1>
          <p className={styles.muted}>
            Strengthen your profile to increase project matching quality.
          </p>
        </div>

        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>
            Profile Strength — {level}
          </div>

          <div className={styles.scoreValue}>{score}%</div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* BASIC INFO */}
      <div className={styles.card}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input
              value={profile.full_name}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  full_name: e.target.value,
                })
              }
            />
          </div>

          <div className={styles.field}>
            <label>Location</label>
            <input
              value={profile.location}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: e.target.value,
                })
              }
            />
          </div>

          <div
            className={`${styles.field} ${styles.fieldFull}`}
          >
            <label>Headline</label>
            <input
              value={profile.headline}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  headline: e.target.value,
                })
              }
            />
          </div>

          <div
            className={`${styles.field} ${styles.fieldFull}`}
          >
            <label>
              About / Mentorship Philosophy
            </label>
            <textarea
              value={profile.about}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  about: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* EXPERTISE */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>
          Expertise
        </h3>

        <div className={styles.pills}>
          {EXPERTISE.map((item) => (
            <div
              key={item}
              className={`${styles.pill} ${
                profile.expertise?.includes(item)
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() =>
                toggleArrayField("expertise", item)
              }
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* SECTORS */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>
          Sectors
        </h3>

        <div className={styles.pills}>
          {SECTORS.map((item) => (
            <div
              key={item}
              className={`${styles.pill} ${
                profile.sectors?.includes(item)
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() =>
                toggleArrayField("sectors", item)
              }
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* FOCUS */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>
          Mentorship Focus
        </h3>

        <div className={styles.pills}>
          {FOCUS.map((item) => (
            <div
              key={item}
              className={`${styles.pill} ${
                profile.mentorship_focus?.includes(
                  item
                )
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() =>
                toggleArrayField(
                  "mentorship_focus",
                  item
                )
              }
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* AJOUTÉ [Task 3] : section CV/Resume */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>CV / Resume</h3>
        {cvUrl && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 600 }}>✅ CV uploaded</span>
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>View current CV</a>
          </div>
        )}
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "#374151" }}>
          {cvUrl ? "Replace CV" : "Upload your CV"} (PDF)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          disabled={cvUploading}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCvUpload(file); }}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        {cvUploading && <p style={{ fontSize: "0.85rem", color: "#2563eb", margin: 0 }}>Uploading...</p>}
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <Link
          href="/dashboard/mentor"
          className={styles.backLink}
        >
          ← Back to Dashboard
        </Link>

        <Button onClick={handleSave}>
          Save Profile
        </Button>
      </div>

      {saved && (
        <div className={styles.success}>
          Profile saved successfully.
        </div>
      )}
    </div>
  );
}