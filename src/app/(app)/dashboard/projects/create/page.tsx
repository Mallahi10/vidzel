"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  /* ================= STATE ================= */

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [location, setLocation] = useState("");
  const [locationOther, setLocationOther] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [participantsNeeded, setParticipantsNeeded] = useState("");
  const [problem, setProblem] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [successMeasure, setSuccessMeasure] = useState("");
  const [successOther, setSuccessOther] = useState("");
  const [evidence, setEvidence] = useState("");
  const [communication, setCommunication] = useState("");
  const [communicationOther, setCommunicationOther] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= ACCESS ================= */

  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization") {
      router.replace("/dashboard");
      return;
    }
    setLoading(false);
  }, [user, router]);

  if (!user || loading) {
    return <div style={{ padding: "3rem" }}>Loading…</div>;
  }

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const id = "project_" + Date.now();

    const storedProjects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const project = {
      id,
      createdBy: user.email,
      title,
      category: category === "Other" ? categoryOther : category,
      location: location === "Other" ? locationOther : location,
      description,
      tasks,
      roles,
      participantsNeeded,
      impact: {
        problem,
        outcomes,
        successMeasure:
          successMeasure === "Other" ? successOther : successMeasure,
        evidence,
      },
      communication:
        communication === "Other" ? communicationOther : communication,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "vidzel_projects",
      JSON.stringify([...storedProjects, project])
    );

    router.push("/dashboard/workspaces");
  };

  /* ================= UI ================= */

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <h1 style={titleStyle}>Create Project</h1>

        <form onSubmit={handleSubmit}>

          {/* BASIC INFO */}
          <Section title="Basic Information">

            <Label>Project Title</Label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
              required
            />
            <Helper>
              Choose a clear, outcome-focused title.
              Example: “Youth Digital Literacy Mentorship Program”
              instead of “Community Support.”
            </Helper>

            <Label>Project Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={input}
            >
              <option value="">Select Category</option>
              <option>Education</option>
              <option>Environment</option>
              <option>Health & Wellness</option>
              <option>Technology</option>
              <option>Community Development</option>
              <option>Social Impact</option>
              <option>Arts & Culture</option>
              <option>Economic Empowerment</option>
              <option>Other</option>
            </select>
            <Helper>
              Select the main impact area.
              
            </Helper>

            {category === "Other" && (
              <input
                placeholder="Please specify"
                value={categoryOther}
                onChange={(e) => setCategoryOther(e.target.value)}
                style={input}
              />
            )}

            <Label>Location</Label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={input}
            >
              <option value="">Select Location</option>
              <option>Remote</option>
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Other</option>
            </select>
            <Helper>
              Clarify how participation will happen.
              Example: Remote (Zoom sessions), On-site (community center),
              or Hybrid (both).
            </Helper>

            {location === "Other" && (
              <input
                placeholder="Please specify location"
                value={locationOther}
                onChange={(e) => setLocationOther(e.target.value)}
                style={input}
              />
            )}

            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textarea}
            />
            <Helper>
              Describe your organization and project, including who you serve, the problem you address, the change you aim to create, and why it matters. Provide enough detail to clearly explain your purpose and impact.
            </Helper>

            <Label>Key Tasks & Responsibilities</Label>
            <textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              style={textarea}
            />
            <Helper>
              Define specific responsibilities.
              Example: “Facilitate weekly sessions,”
              “Track attendance,” or “Develop curriculum materials.”
            </Helper>

          </Section>

          {/* ROLES */}
          <Section title="Roles Needed">

            <div style={checkboxGroup}>
              <Checkbox label="Volunteer" onChange={() => toggleRole("Volunteer")} />
              <Checkbox label="Student" onChange={() => toggleRole("Student")} />
              <Checkbox label="Mentor" onChange={() => toggleRole("Mentor")} />
            </div>

            <Helper>
              Choose the roles required.
              
            </Helper>

            <Label>Number of Participants Needed</Label>
            <input
              value={participantsNeeded}
              onChange={(e) => setParticipantsNeeded(e.target.value)}
              style={input}
            />
            <Helper>
              Align this number with project scope and timeline.
              Example: 10 participants for a 3-month program.
            </Helper>

          </Section>

          {/* IMPACT */}
          <Section title="Impact Goals">

            <Label>Problem This Project Addresses</Label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              style={textarea}
            />
            <Helper>
              Clearly state the challenge.
              Example: “Low digital literacy among rural youth.”
            </Helper>

            <Label>Expected Outcomes</Label>
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              style={textarea}
            />
            <Helper>
              State the specific results your project aims to achieve. Explain what change will happen through the involvement of volunteers, students, or mentors, and describe the measurable impact or improvements you expect.
            </Helper>

            <Label>How Success Will Be Measured</Label>
            <select
              value={successMeasure}
              onChange={(e) => setSuccessMeasure(e.target.value)}
              style={input}
            >
              <option value="">Select Method</option>
              <option>Attendance Numbers</option>
              <option>Surveys & Feedback</option>
              <option>Performance Metrics</option>
              <option>Reports & Documentation</option>
              <option>Community Impact Indicators</option>
              <option>Other</option>
            </select>

            {successMeasure === "Other" && (
              <input
                placeholder="Please specify measurement method"
                value={successOther}
                onChange={(e) => setSuccessOther(e.target.value)}
                style={input}
              />
            )}

            <Label>Evidence You Will Collect</Label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              style={textarea}
            />
            <Helper>
              Specify proof of impact.
              Example: attendance sheets, surveys,
              photos, reports, testimonials.
            </Helper>

          </Section>

          {/* COMMUNICATION */}
          <Section title="Communication">

            <Label>Primary Communication Method</Label>
            <select
              value={communication}
              onChange={(e) => setCommunication(e.target.value)}
              style={input}
            >
              <option value="">Select Method</option>
              <option>In-Platform Messaging</option>
              <option>Zoom</option>
              <option>Email</option>
              <option>Slack</option>
              <option>WhatsApp</option>
              <option>Other</option>
            </select>

            {communication === "Other" && (
              <input
                placeholder="Please specify"
                value={communicationOther}
                onChange={(e) => setCommunicationOther(e.target.value)}
                style={input}
              />
            )}

            <Helper>
              Define coordination tools.
              Example: Slack for updates, Zoom for weekly meetings.
            </Helper>

          </Section>

          {/* BUTTONS */}
          <div style={buttonRow}>
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard")}
            >
              ← Back to Dashboard
            </Button>

            <Button type="submit">
              Save Project
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const Section = ({ title, children }: any) => (
  <div style={{ marginBottom: "40px" }}>
    <h3 style={{ fontSize: "18px", color: "#1F3A5F", marginBottom: "20px" }}>
      {title}
    </h3>
    {children}
  </div>
);

const Label = ({ children }: any) => (
  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#1F3A5F" }}>
    {children}
  </label>
);

const Helper = ({ children }: any) => (
  <p
    style={{
      fontSize: "13px",
      color: "#6b7c8f",
      marginTop: "-10px",
      marginBottom: "18px",
      lineHeight: "1.6",
      background: "rgba(31, 58, 95, 0.04)",
      padding: "10px 14px",
      borderRadius: "10px",
    }}
  >
    {children}
  </p>
);

const Checkbox = ({ label, onChange }: any) => (
  <label style={{ marginRight: "20px", fontSize: "14px", color: "#1F3A5F" }}>
    <input type="checkbox" onChange={onChange} /> {label}
  </label>
);

/* ================= STYLES ================= */

const pageWrapper = {
  padding: "40px",
  maxWidth: "1300px",
  margin: "auto",
};

const card = {
  background: "white",
  borderRadius: "22px",
  padding: "40px",
  boxShadow: "0 12px 30px rgba(31, 58, 95, 0.08)",
  border: "1px solid rgba(31, 58, 95, 0.05)",
};

const titleStyle = {
  fontSize: "28px",
  color: "#1F3A5F",
  marginBottom: "30px",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(31, 58, 95, 0.15)",
  marginBottom: "10px",
  fontSize: "14px",
};

const textarea = {
  ...input,
  minHeight: "120px",
};

const checkboxGroup = {
  marginBottom: "10px",
};

const buttonRow = {
  marginTop: "40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};