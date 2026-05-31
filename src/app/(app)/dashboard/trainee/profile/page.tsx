"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import styles from "./traineeProfile.module.css";
import {
  getTraineeProfile,
  saveTraineeProfile,
  calculateProfileScore,
  uploadTraineeCv,
} from "@/lib/traineeService";

const SKILLS_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Python", "SQL",
  "Figma", "UX Design", "Marketing Digital", "SEO", "Data Analysis",
  "Project Management", "Communication", "Excel", "Photoshop", "Node.js",
];

const EDUCATION_LEVELS = ["Bac+2", "Bac+3 (Licence)", "Bac+4", "Bac+5 (Master)", "Doctorat"];

const DOMAINS = [
  "Technologie", "Marketing", "Design", "Data", "Finance",
  "RH", "Juridique", "Communication", "Commerce", "Autre",
];

export default function TraineeProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  /* form state */
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
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);

  /* redirect if not logged in */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  /* load existing profile */
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

  const toggleSkill = (s: string) =>
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleCvUpload = async (file: File) => {
    if (!user) return;
    setCvUploading(true);
    const url = await uploadTraineeCv(user.id, file);
    if (url) setCvUrl(url);
    setCvUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
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
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return null;

  return (
    <div className={styles.page}>

      {/* Top row: title + score */}
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Mon Profil Stagiaire</h1>
          <p className={styles.muted}>
            Un profil complet augmente vos chances d&apos;être contacté par les organisations.
          </p>
        </div>

        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Profil complété</div>
          <div className={styles.scoreValue}>{score}%</div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${score}%` }} />
          </div>
          <p className={styles.scoreTip}>
            {score < 50 && "Ajoutez vos infos de base pour commencer."}
            {score >= 50 && score < 80 && "Presque prêt ! Ajoutez votre CV et vos compétences."}
            {score >= 80 && score < 100 && "Excellent ! Quelques détails manquants."}
            {score === 100 && "Profil complet — vous êtes prêt à postuler !"}
          </p>
        </div>
      </div>

      {/* ── BASIC INFO ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Informations personnelles</h2>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Nom complet</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sophie Martin" />
          </div>
          <div className={styles.field}>
            <label>Formation (programme/filière)</label>
            <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="Master Informatique" />
          </div>
          <div className={styles.field}>
            <label>École / Université</label>
            <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Université Paris Cité" />
          </div>
          <div className={styles.field}>
            <label>Niveau d&apos;études</label>
            <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
              <option value="">Sélectionner</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>URL LinkedIn</label>
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/votre-profil" type="url" />
          </div>
          <div className={styles.field}>
            <label>URL Photo (avatar)</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." type="url" />
          </div>
          <div className={styles.fieldFull}>
            <label>Bio / Présentation</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Décrivez votre parcours, vos motivations et ce que vous recherchez en stage…"
            />
          </div>
        </div>
      </div>

      {/* ── SKILLS ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Compétences</h2>
        <p className={styles.cardHint}>Sélectionnez au minimum 2 compétences.</p>
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
      </div>

      {/* ── AVAILABILITY ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Disponibilité</h2>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Disponible à partir du</label>
            <input
              type="date"
              value={availabilityStart}
              onChange={(e) => setAvailStart(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Jusqu&apos;au (optionnel)</label>
            <input
              type="date"
              value={availabilityEnd}
              onChange={(e) => setAvailEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── CV UPLOAD ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>CV / Resume</h2>

        {cvUrl && (
          <div className={styles.cvBanner}>
            <span>✅ CV uploadé</span>
            <a href={cvUrl} target="_blank" rel="noopener noreferrer">
              Voir mon CV actuel ↗
            </a>
          </div>
        )}

        <label className={styles.cvLabel}>
          {cvUrl ? "Remplacer le CV" : "Uploader votre CV"} (PDF)
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
        {cvUploading && <p className={styles.uploading}>Upload en cours…</p>}
      </div>

      {/* ── SAVE ── */}
      <div className={styles.actions}>
        <Link href="/dashboard/trainee" className={styles.backLink}>
          ← Retour
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saved && <span className={styles.savedMsg}>✓ Profil sauvegardé</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde…" : "Sauvegarder le profil"}
          </Button>
        </div>
      </div>
    </div>
  );
}
