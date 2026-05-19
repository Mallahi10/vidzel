"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { createWorkspace } from "@/lib/workspaceService";




// MODIFIÉ [Build fix] : export default déplacé vers le wrapper Suspense en bas du fichier
function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();


  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

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
  const [visibility, setVisibility] = useState<"open" | "private">("open");



 useEffect(() => {
    if (editId && user) {
      const fetchProject = async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", editId)
          .single();

        if (data && !error) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setTasks(data.tasks || "");
          setRoles(data.roles || []);
          setParticipantsNeeded(data.participants_needed || "");
          setProblem(data.problem || "");
          setOutcomes(data.outcomes || "");
          setEvidence(data.evidence || "");
          setVisibility(data.visibility || "open");

          // Liste des options standards pour vérifier si c'est "Other"
          const stdCats = ["Education", "Environment", "Health & Wellness", "Technology", "Community Development", "Social Impact", "Arts & Culture", "Economic Empowerment"];
          const stdLocs = ["Remote", "On-site", "Hybrid"];
          const stdMeasures = ["Attendance Numbers", "Surveys & Feedback", "Performance Metrics", "Reports & Documentation", "Community Impact Indicators"];
          const stdComm = ["In-Platform Messaging", "Zoom", "Email", "Slack", "WhatsApp"];

          // Gestion Category
          if (data.category && !stdCats.includes(data.category)) {
            setCategory("Other");
            setCategoryOther(data.category);
          } else {
            setCategory(data.category || "");
          }

          // Gestion Location
          if (data.location && !stdLocs.includes(data.location)) {
            setLocation("Other");
            setLocationOther(data.location);
          } else {
            setLocation(data.location || "");
          }

          // Gestion Success Measure
          if (data.success_measure && !stdMeasures.includes(data.success_measure)) {
            setSuccessMeasure("Other");
            setSuccessOther(data.success_measure);
          } else {
            setSuccessMeasure(data.success_measure || "");
          }

          // Gestion Communication
          if (data.communication && !stdComm.includes(data.communication)) {
            setCommunication("Other");
            setCommunicationOther(data.communication);
          } else {
            setCommunication(data.communication || "");
          }
        }
      };
      fetchProject();
    }
  }, [editId, user?.id]);



  


/* ================= SAVE PROJECT TO SUPABASE ================= */
const handleSaveProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
 
    if (!title.trim() || !description.trim()) {
      alert("Please fill in at least the Title and Description.");
      return;
    }
 
    if (!user?.id) {
      alert("You must be logged in.");
      return;
    }
 
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      organization_id: user.id,
      organization_email: user.email,
      status: "open",
      visibility,
      category: category === "Other" ? categoryOther : category,
      location: location === "Other" ? locationOther : location,
      tasks,
      roles,
      participants_needed: participantsNeeded,
      problem,
      outcomes,
      success_measure:
        successMeasure === "Other" ? successOther : successMeasure,
      evidence,
      communication:
        communication === "Other" ? communicationOther : communication,
    };
 
    try {
      if (editId) {
        /* ── UPDATE MODE ── */
 
        // .select() at the end makes Supabase return the updated rows.
        // If RLS blocks the update silently, data will be empty — we
        // catch that and throw a real error instead of a false "success".
        const { data, error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editId)
          .select(); // ← critical: detects silent RLS failures
 
        if (error) throw error;
 
        // If 0 rows were returned, the update was blocked (RLS)
        if (!data || data.length === 0) {
          throw new Error(
            "Update blocked — check RLS UPDATE policy on the projects table in Supabase."
          );
        }
 
        alert("Project updated successfully! ✅");
      
      router.push("/dashboard/projects");
    } else {
  /* ── STEP 1: insert the project ── */
  const { data: newProject, error: projectError } = await supabase
    .from("projects")
    .insert([projectData])
    .select()
    .single();

  if (projectError) throw projectError;

  if (!newProject) {
    throw new Error(
      "Insert blocked — check RLS INSERT policy on the projects table."
    );
  }

  /* ── STEP 2: auto-create the workspace for this project ── */
   try {
    await createWorkspace({
      project_id: newProject.id,
      organization_id: user!.id,
      title: newProject.title,
      description: newProject.description ?? undefined,
      type: visibility,
      status: "active",
    });
  } catch (workspaceErr) {
    console.warn("[handleSaveProject] Workspace creation failed (non-blocking):", workspaceErr);
  }

  alert("Project created successfully! 🚀");
  router.push("/dashboard/projects"); // ✅ redirect ajouté ici
    }
  }
    
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[handleSaveProject] Supabase error:", message);
      alert("Error saving project: " + message);
    }
  };
           

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

 /* const handleSubmit = (e: React.FormEvent) => {
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
  };*/

  /* ================= UI ================= */

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <h1 style={titleStyle}>{editId ? "Edit Project" : "Create Project"}</h1>
          <form onSubmit={handleSaveProject}>          <Section title="Basic Information">

            <Label>Project Type</Label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "open" | "private")}
              style={input}
            >
              <option value="open">🌐 Open / Public</option>
              <option value="private">🔒 Private / Internal</option>
            </select>
            <Helper>
              Open projects are visible and joinable by students, volunteers, and mentors.
              Private projects are hidden from the platform and only accessible by invited team members.
            </Helper>

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
              onClick={() => router.push("/dashboard/projects")}
            >
              ← Back
            </Button>

            <Button type="submit">
              {editId ? "Update Project" : "Save Project"}
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

// AJOUTÉ [Build fix] : Suspense requis par Next.js 14 pour useSearchParams() en production
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem" }}>Loading…</div>}>
      <CreateProjectPage />
    </Suspense>
  );
}