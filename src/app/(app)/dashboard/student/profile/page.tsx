"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./profile.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

/* ================= OPTIONS ================= */

const IMPACT_AREAS = [
  "Education",
  "Health",
  "Environment",
  "Technology for Good",
  "Youth Development",
  "Human Rights",
  "Public Policy",
  "Entrepreneurship",
  "Social Innovation",
  "Other",
];

const SKILLS = [
  "Research",
  "Academic Writing",
  "Public Speaking",
  "Data Analysis",
  "Graphic Design",
  "Programming",
  "Project Management",
  "Community Outreach",
  "Content Creation",
  "Leadership",
  "Other",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DURATIONS = [
  "Short-term (1–4 weeks)",
  "Medium (1–3 months)",
  "Long-term (3+ months)",
];
const COLLAB_TYPES = ["Remote", "In-person", "Hybrid"];
const ROLES = [
  "Research Support",
  "Strategy & Planning",
  "Field Work",
  "Technical Support",
  "Communications",
  "Open to Any",
];

/* ================= COMPONENT ================= */

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({
    impactAreas: [],
    skills: [],
    days: [],
  });

  const [cvUrl, setCvUrl]         = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDeleting, setCvDeleting]   = useState(false);

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

    const { data: urlData } = supabase.storage
      .from("cv-uploads")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    await supabase
      .from("profiles")
      .update({ cv_url: publicUrl })
      .eq("id", user.id);

    setCvUrl(publicUrl);
    setCvUploading(false);
  };

  const handleDeleteCV = async () => {
    if (!user || !cvUrl) return;
    setCvDeleting(true);

    // Extract the storage path from the full public URL
    // Format: .../storage/v1/object/public/cv-uploads/<path>
    const marker = "/cv-uploads/";
    const markerIdx = cvUrl.indexOf(marker);
    if (markerIdx !== -1) {
      const storagePath = cvUrl.substring(markerIdx + marker.length);
      await supabase.storage.from("cv-uploads").remove([storagePath]);
    }

    await supabase.from("profiles").update({ cv_url: null }).eq("id", user.id);
    setCvUrl(null);
    setCvDeleting(false);
  };

  /* ================= PROFILE SCORE ================= */

  const score = useMemo(() => {
    let total = 15;
    let filled = 0;

    if (form.fullName) filled++;
    if (form.location) filled++;
    if (form.school) filled++;
    if (form.major) filled++;
    if (form.year) filled++;
    if (form.gradYear) filled++;
    if (form.headline) filled++;
    if (form.impactAreas.length) filled++;
    if (form.skills.length) filled++;
    if (form.collabType) filled++;
    if (form.role) filled++;
    if (form.days.length) filled++;
    if (form.hours) filled++;
    if (form.experience) filled++;
    if (form.goals) filled++;

    return Math.round((filled / total) * 100);
  }, [form]);

  /* ================= HELPERS ================= */

  const toggleMulti = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...(prev[field] || []), value],
    }));
  };

  /* ================= UI ================= */

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Student Profile</h1>
      <p className={styles.muted}>
        Build your impact-focused academic profile.
      </p>

      {/* PROFILE SCORE */}
      <div className={styles.scoreBox}>
        <div className={styles.scoreLabel}>Profile Completion</div>
        <div className={styles.scoreValue}>{score}%</div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* ================= BASIC IDENTITY ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Basic Identity</h2>

        <div className={styles.formGrid}>
          <Field label="Full Name">
            <input
              placeholder="Your legal full name"
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />
          </Field>

          <Field label="Location">
            <input
              placeholder="City, Country"
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
          </Field>

          <Field label="University / School">
            <input
              placeholder="Name of your institution"
              onChange={(e) =>
                setForm({ ...form, school: e.target.value })
              }
            />
          </Field>

          <Field label="Degree / Major">
            <input
              placeholder="Your academic focus"
              onChange={(e) =>
                setForm({ ...form, major: e.target.value })
              }
            />
          </Field>

          <Field label="Year of Study">
            <input
              placeholder="Example: 2nd Year"
              onChange={(e) =>
                setForm({ ...form, year: e.target.value })
              }
            />
          </Field>

          <Field label="Expected Graduation Year">
            <input
              placeholder="Example: 2027"
              onChange={(e) =>
                setForm({ ...form, gradYear: e.target.value })
              }
            />
          </Field>

          <Field label="Headline" full>
            <input
              placeholder="Public Policy student passionate about youth education reform."
              onChange={(e) =>
                setForm({ ...form, headline: e.target.value })
              }
            />
          </Field>
        </div>
      </div>

      {/* ================= IMPACT AREAS ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Impact Interests</h2>

        <div className={styles.pills}>
          {IMPACT_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              className={`${styles.pill} ${
                form.impactAreas.includes(area)
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() => toggleMulti("impactAreas", area)}
            >
              {area}
            </button>
          ))}
        </div>

        {form.impactAreas.includes("Other") && (
          <div className={styles.fieldFull}>
            <input
              placeholder="Specify your impact area"
              onChange={(e) =>
                setForm({ ...form, impactOther: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* ================= SKILLS ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Skills & Capabilities</h2>

        <div className={styles.pills}>
          {SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              className={`${styles.pill} ${
                form.skills.includes(skill)
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() => toggleMulti("skills", skill)}
            >
              {skill}
            </button>
          ))}
        </div>

        {form.skills.includes("Other") && (
          <div className={styles.fieldFull}>
            <input
              placeholder="Specify additional skill"
              onChange={(e) =>
                setForm({ ...form, skillOther: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* ================= COLLAB ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Collaboration Preferences</h2>

        <div className={styles.formGrid}>
          <Field label="Collaboration Type">
            <select
              onChange={(e) =>
                setForm({ ...form, collabType: e.target.value })
              }
            >
              <option value="">Select</option>
              {COLLAB_TYPES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Preferred Role">
            <select
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="">Select</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ================= AVAILABILITY ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Availability</h2>

        <div className={styles.pills}>
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`${styles.pill} ${
                form.days.includes(day)
                  ? styles.pillActive
                  : ""
              }`}
              onClick={() => toggleMulti("days", day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <Field label="Hours per Week">
            <input
              placeholder="Example: 8–10 hours"
              onChange={(e) =>
                setForm({ ...form, hours: e.target.value })
              }
            />
          </Field>

          <Field label="Duration Preference">
            <select
              onChange={(e) =>
                setForm({ ...form, duration: e.target.value })
              }
            >
              <option value="">Select</option>
              {DURATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ================= EXPERIENCE ================= */}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Experience & Goals</h2>

        <Field label="Relevant Experience" full>
          <textarea
            placeholder="Describe projects, internships, volunteering, leadership roles, or real-world work you’ve done."
            onChange={(e) =>
              setForm({ ...form, experience: e.target.value })
            }
          />
        </Field>

        <Field label="What do you hope to gain from Vidzel?" full>
          <textarea
            placeholder="Example: I want hands-on experience in policy design and mentorship in social innovation."
            onChange={(e) =>
              setForm({ ...form, goals: e.target.value })
            }
          />
        </Field>
      </div>

      {/* AJOUTÉ [Task 3] : section upload CV/Resume */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>CV / Resume</h2>

        {cvUrl && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 600 }}>
              ✅ CV uploaded
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}
              >
                View current CV
              </a>
              <button
                onClick={handleDeleteCV}
                disabled={cvDeleting}
                title="Delete CV"
                style={{
                  background: "none",
                  border: "none",
                  cursor: cvDeleting ? "wait" : "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  color: "#dc2626",
                  opacity: cvDeleting ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "#374151" }}>
          {cvUrl ? "Replace CV" : "Upload your CV"} (PDF)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          disabled={cvUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCvUpload(file);
          }}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        {cvUploading && (
          <p style={{ fontSize: "0.85rem", color: "#2563eb", margin: 0 }}>Uploading...</p>
        )}
      </div>
    </div>
  );
}

/* ================= FIELD COMPONENT ================= */

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
    <div
      className={
        full
          ? `${styles.field} ${styles.fieldFull}`
          : styles.field
      }
    >
      <label>{label}</label>
      {children}
    </div>
  );
}