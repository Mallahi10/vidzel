"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

  const userKey = useMemo(() => {
    if (!user) return "";
    return user.id || user.email || "";
  }, [user]);

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    if (!userKey) return;

    const existing = loadMentorProfile(userKey);
    if (existing) {
      setProfile(existing);
    }
  }, [userKey]);

  /* ================= SCORE ================= */

  const score = calculateMentorProfileScore(profile);
  const level = getMentorProfileLevel(score);

  /* ================= SAVE ================= */

  function handleSave() {
    if (!userKey) return;

    saveMentorProfile(userKey, profile);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
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