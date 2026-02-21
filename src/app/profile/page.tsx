"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/Button";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Common
  const [bio, setBio] = useState("");

  // Student
  const [education, setEducation] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");

  // Volunteer
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");

  // Mentor
  const [expertise, setExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/signup");
    }
  }, [user, router]);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const profile = {
      userId: user.id,
      role: user.role,
      bio,
      education,
      fieldOfStudy,
      skills,
      availability,
      expertise,
      experienceYears,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );

    localStorage.setItem(
      "vidzel_profiles",
      JSON.stringify([...existing, profile])
    );

    router.push("/dashboard");
  };

  return (
    <div
      style={{
        padding: "4rem 2rem",
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>
        Create Your{" "}
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Profile
      </h1>

      <form
        onSubmit={handleSave}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          width: "100%",
        }}
      >
        {/* Common */}
        <textarea
          placeholder="Short Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
          style={{ width: "100%", minHeight: "100px" }}
        />

        {/* STUDENT */}
        {user.role === "student" && (
          <>
            <input
              placeholder="Education (University / School)"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              required
            />
            <input
              placeholder="Field of Study"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              required
            />
          </>
        )}

        {/* VOLUNTEER */}
        {user.role === "volunteer" && (
          <>
            <textarea
              placeholder="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
              style={{ minHeight: "80px" }}
            />
            <input
              placeholder="Availability (e.g. 5 hrs/week)"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              required
            />
          </>
        )}

        {/* MENTOR */}
        {user.role === "mentor" && (
          <>
            <textarea
              placeholder="Areas of Expertise"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              required
              style={{ minHeight: "80px" }}
            />
            <input
              placeholder="Years of Experience"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              required
            />
          </>
        )}

        {/* ✅ FORCED VISUAL PROOF BUTTON */}
        <div style={{ marginTop: "1rem", alignSelf: "flex-start" }}>
          <Button type="submit" variant="secondary">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
