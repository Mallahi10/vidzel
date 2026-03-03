"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./volunteerProfile.module.css";

import {
  loadVolunteerProfile,
  saveVolunteerProfile,
  VolunteerProfile,
} from "@/lib/localVolunteerProfiles";

import { calculateVolunteerProfileScore } from "@/lib/volunteerProfileScore";
import { useAuth } from "@/context/AuthContext";

function getUserKey(user: any) {
  return user?.id || user?.email || "unknown-user";
}

const INTERESTS = [
  "Education",
  "Health",
  "Environment",
  "Youth Development",
  "Technology",
  "Human Rights",
];

const SKILLS = [
  "Project Management",
  "Teaching",
  "Graphic Design",
  "Social Media",
  "Research",
  "Fundraising",
  "Data Analysis",
  "Event Planning",
  "Web Development",
  "Translation",
  "Grant Writing",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLLABORATION_TYPES = [
  "Team Member",
  "Team Lead",
  "Research Support",
  "Technical Support",
  "Communications",
  "Strategy",
];

export default function VolunteerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const userKey = useMemo(() => getUserKey(user), [user]);

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [languages, setLanguages] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [collaborationType, setCollaborationType] = useState("");

  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [motivation, setMotivation] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!userKey) return;
    const existing = loadVolunteerProfile(userKey);
    if (existing) {
      setFullName(existing.full_name);
      setLocation(existing.location);
      setHeadline(existing.headline);
      setPhotoUrl(existing.photo_url);
      setLanguages(existing.languages);
      setSkills(existing.skills || []);
      setInterests(existing.interests || []);
      setCollaborationType(existing.collaboration_type || "");
      setExperience(existing.experience);
      setEducation(existing.education);
      setAvailabilityHours(existing.availability_hours);
      setAvailableDays(existing.available_days || []);
      setMotivation(existing.motivation || "");
    }
  }, [userKey]);

  const score = useMemo(() => {
    return calculateVolunteerProfileScore({
      full_name: fullName,
      location,
      headline,
      photo_url: photoUrl,
      languages,
      skills,
      interests,
      collaboration_type: collaborationType,
      experience,
      education,
      availability_hours: availabilityHours,
      available_days: availableDays,
      motivation,
    });
  }, [
    fullName,
    location,
    headline,
    photoUrl,
    languages,
    skills,
    interests,
    collaborationType,
    experience,
    education,
    availabilityHours,
    availableDays,
    motivation,
  ]);

  const toggleItem = (value: string, setter: any, current: string[]) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleSave = () => {
    const profile: VolunteerProfile = {
      full_name: fullName,
      location,
      headline,
      photo_url: photoUrl,
      languages,
      skills,
      interests,
      collaboration_type: collaborationType,
      experience,
      education,
      availability_hours: availabilityHours,
      available_days: availableDays,
      motivation,
      updated_at: new Date().toISOString(),
    };

    saveVolunteerProfile(userKey, profile);
    alert("Saved successfully.");
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Volunteer Profile</h1>
          <p className={styles.muted}>
            Complete your profile to improve matching.
          </p>
        </div>

        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Profile Score</div>
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
        <h2 className={styles.sectionTitle}>Basic Information</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Photo URL</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
          </div>

          <div className={styles.fieldFull}>
            <label>Languages</label>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} />
          </div>
        </div>
      </div>

      {/* SKILLS */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Skills</h2>
        <div className={styles.pills}>
          {SKILLS.map((s) => (
            <div
              key={s}
              className={`${styles.pill} ${
                skills.includes(s) ? styles.pillActive : ""
              }`}
              onClick={() => toggleItem(s, setSkills, skills)}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* INTERESTS */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Causes of Interest</h2>
        <div className={styles.pills}>
          {INTERESTS.map((i) => (
            <div
              key={i}
              className={`${styles.pill} ${
                interests.includes(i) ? styles.pillActive : ""
              }`}
              onClick={() => toggleItem(i, setInterests, interests)}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* COLLABORATION */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Project Preferences</h2>

        <div className={styles.field}>
          <label>Preferred Role</label>
          <select
            value={collaborationType}
            onChange={(e) => setCollaborationType(e.target.value)}
          >
            <option value="">Select</option>
            {COLLABORATION_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AVAILABILITY */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Availability & Background</h2>

        <div className={styles.pills}>
          {DAYS.map((d) => (
            <div
              key={d}
              className={`${styles.pill} ${
                availableDays.includes(d) ? styles.pillActive : ""
              }`}
              onClick={() => toggleItem(d, setAvailableDays, availableDays)}
            >
              {d}
            </div>
          ))}
        </div>

        <div className={styles.grid2} style={{ marginTop: 20 }}>
          <div className={styles.fieldFull}>
            <label>Experience</label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Education</label>
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Hours per week</label>
            <input
              value={availabilityHours}
              onChange={(e) => setAvailabilityHours(e.target.value)}
            />
          </div>

          <div className={styles.fieldFull}>
            <label>Why do you want to volunteer?</label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/dashboard/volunteer" className={styles.backLink}>
          Back
        </Link>
        <Button onClick={handleSave}>Save Profile</Button>
      </div>
    </div>
  );
}