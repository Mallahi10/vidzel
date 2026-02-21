"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

type ProfileRole = "volunteer" | "student" | "mentor";

type UserProfile = {
  userId: string;
  role: ProfileRole;
  fullName: string;
  location: string;
  bio: string;
  skills: string;
  availability: string;
  causes: string;
  experience: string;
  education?: string;
  resumeFileName?: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ✅ Robust role check (case-insensitive)
  const role = useMemo(() => {
    const r = (user?.role ?? "").toString().toLowerCase().trim();
    return r;
  }, [user]);

  const isOrg = role === "organization";

  const [profile, setProfile] = useState<UserProfile>({
    userId: "",
    role: "volunteer",
    fullName: "",
    location: "",
    bio: "",
    skills: "",
    availability: "",
    causes: "",
    experience: "",
    education: "",
    resumeFileName: "",
    updatedAt: "",
  });

  const [isSaved, setIsSaved] = useState(false);

  /* ======================
     ROLE GUARD (REDIRECT)
  ====================== */
  useEffect(() => {
    if (!user) return;

    if (isOrg) {
      router.replace("/dashboard/organization");
    }
  }, [user, isOrg, router]);

  /* ======================
     LOAD OR INIT PROFILE
  ====================== */
  useEffect(() => {
    if (!user) return;
    if (isOrg) return;

    const stored = JSON.parse(localStorage.getItem("vidzel_profiles") || "[]");

    const existing = stored.find((p: UserProfile) => p.userId === user.id);

    if (existing) {
      setProfile(existing);
    } else {
      setProfile((prev) => ({
        ...prev,
        userId: user.id,
        role: role as ProfileRole,
        fullName: user.name,
      }));
    }
  }, [user, isOrg, role]);

  /* ======================
     NOT LOGGED IN
  ====================== */
  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  // ✅ Important: do NOT render this page for organizations
  if (isOrg) {
    return (
      <div style={{ padding: "3rem" }}>
        Redirecting to organization dashboard…
        <div style={{ marginTop: "1rem", fontSize: 12, opacity: 0.7 }}>
          Debug: user.role = <b>{String(user.role)}</b>
        </div>
      </div>
    );
  }

  /* ======================
     SAVE PROFILE
  ====================== */
  const handleSave = () => {
    const stored = JSON.parse(localStorage.getItem("vidzel_profiles") || "[]");

    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    const updated = stored.filter((p: UserProfile) => p.userId !== user.id);

    localStorage.setItem("vidzel_profiles", JSON.stringify([...updated, updatedProfile]));

    setIsSaved(true);
  };

  /* ======================
     SUCCESS SCREEN
  ====================== */
  if (isSaved) {
    return (
      <div style={{ padding: "3rem", maxWidth: "700px" }}>
        <h1>✅ Profile saved</h1>

        <p style={{ marginTop: "1rem" }}>
          Your profile is ready. Organizations can now view it when you apply to projects.
        </p>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <Button onClick={() => setIsSaved(false)}>Edit Profile</Button>
          <Button onClick={() => router.push("/dashboard/explore")}>Explore Projects</Button>
        </div>
      </div>
    );
  }

  /* ======================
     PROFILE FORM
  ====================== */
  return (
    <div style={{ padding: "3rem", maxWidth: "800px" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>
        {role.charAt(0).toUpperCase() + role.slice(1)} Profile
      </h1>

      <label>Full Name</label>
      <input
        value={profile.fullName}
        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
        style={input}
      />

      <label>Location</label>
      <input
        value={profile.location}
        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
        style={input}
      />

      <label>Short Bio</label>
      <textarea
        value={profile.bio}
        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        style={textarea}
      />

      <label>Skills</label>
      <input
        value={profile.skills}
        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
        style={input}
      />

      {role !== "student" && (
        <>
          <label>Availability</label>
          <input
            value={profile.availability}
            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
            style={input}
          />
        </>
      )}

      {role === "student" && (
        <>
          <label>Education</label>
          <input
            value={profile.education || ""}
            onChange={(e) => setProfile({ ...profile, education: e.target.value })}
            style={input}
          />
        </>
      )}

      <label>Experience</label>
      <textarea
        value={profile.experience}
        onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
        style={textarea}
      />

      <label>Resume</label>
      <input
        type="file"
        onChange={(e) =>
          setProfile({
            ...profile,
            resumeFileName: e.target.files?.[0]?.name || "",
          })
        }
        style={{ marginBottom: "1.5rem" }}
      />

      {profile.resumeFileName && <p>Uploaded: {profile.resumeFileName}</p>}

      <Button onClick={handleSave}>Save Profile</Button>
    </div>
  );
}

/* styles */
const input = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
};

const textarea = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  minHeight: "100px",
};