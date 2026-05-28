"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { createWorkspace } from "@/lib/workspaceService";
// NEW MODERN UI UPDATE — CSS module replaces inline styles
import styles from "./create.module.css";
import { ArrowLeft } from "lucide-react";

// MODIFIÉ [Build fix] : export default déplacé vers le wrapper Suspense en bas du fichier
function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  /* ================= STATE (inchangé) ================= */
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

  /* Edit mode load (inchangé) */
  useEffect(() => {
    if (editId && user) {
      const fetchProject = async () => {
        const { data, error } = await supabase.from("projects").select("*").eq("id", editId).single();

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

          const stdCats = ["Education", "Environment", "Health & Wellness", "Technology", "Community Development", "Social Impact", "Arts & Culture", "Economic Empowerment"];
          const stdLocs = ["Remote", "On-site", "Hybrid"];
          const stdMeasures = ["Attendance Numbers", "Surveys & Feedback", "Performance Metrics", "Reports & Documentation", "Community Impact Indicators"];
          const stdComm = ["In-Platform Messaging", "Zoom", "Email", "Slack", "WhatsApp"];

          if (data.category && !stdCats.includes(data.category)) { setCategory("Other"); setCategoryOther(data.category); } else { setCategory(data.category || ""); }
          if (data.location && !stdLocs.includes(data.location)) { setLocation("Other"); setLocationOther(data.location); } else { setLocation(data.location || ""); }
          if (data.success_measure && !stdMeasures.includes(data.success_measure)) { setSuccessMeasure("Other"); setSuccessOther(data.success_measure); } else { setSuccessMeasure(data.success_measure || ""); }
          if (data.communication && !stdComm.includes(data.communication)) { setCommunication("Other"); setCommunicationOther(data.communication); } else { setCommunication(data.communication || ""); }
        }
      };
      fetchProject();
    }
  }, [editId, user?.id]);

  /* ================= SAVE PROJECT (inchangé) ================= */
  const handleSaveProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim() || !description.trim()) { alert("Please fill in at least the Title and Description."); return; }
    if (!user?.id) { alert("You must be logged in."); return; }

    const projectData = {
      title: title.trim(), description: description.trim(),
      organization_id: user.id, organization_email: user.email,
      status: "open", visibility,
      category: category === "Other" ? categoryOther : category,
      location: location === "Other" ? locationOther : location,
      tasks, roles, participants_needed: participantsNeeded,
      problem, outcomes,
      success_measure: successMeasure === "Other" ? successOther : successMeasure,
      evidence,
      communication: communication === "Other" ? communicationOther : communication,
    };

    try {
      if (editId) {
        const { data, error } = await supabase.from("projects").update(projectData).eq("id", editId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Update blocked — check RLS UPDATE policy on the projects table in Supabase.");
        alert("Project updated successfully! ✅");
        router.push("/dashboard/projects");
      } else {
        const { data: newProject, error: projectError } = await supabase.from("projects").insert([projectData]).select().single();
        if (projectError) throw projectError;
        if (!newProject) throw new Error("Insert blocked — check RLS INSERT policy on the projects table.");
        try {
          await createWorkspace({ project_id: newProject.id, organization_id: user!.id, title: newProject.title, description: newProject.description ?? undefined, type: visibility, status: "active" });
        } catch (workspaceErr) {
          console.warn("[handleSaveProject] Workspace creation failed (non-blocking):", workspaceErr);
        }
        alert("Project created successfully! 🚀");
        router.push("/dashboard/projects");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[handleSaveProject] Supabase error:", message);
      alert("Error saving project: " + message);
    }
  };

  /* Access guard (inchangé) */
  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization") { router.replace("/dashboard"); return; }
    setLoading(false);
  }, [user, router]);

  if (!user || loading) {
    return <div className={styles.pageWrapper}>Loading…</div>;
  }

  const toggleRole = (role: string) => {
    setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  /* ================= UI ================= */
  return (
    // OLD STYLE BACKUP: <div style={pageWrapper}><div style={card}>
    <div className={styles.pageWrapper}>
      {/* HERO BANNER */}
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>{editId ? "Edit Project" : "Create Project"}</h1>
          <p className={styles.heroSubtitle}>
            {editId ? "Update your project details and settings." : "Build and launch an impact project for your organization."}
          </p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
        <button type="button" onClick={() => router.push("/dashboard/projects")} className={styles.heroBackBtn}>
          <ArrowLeft size={15} />
          My Projects
        </button>
      </div>

      <div className={styles.card}>

        <form onSubmit={handleSaveProject}>

          {/* ── SECTION 1: BASIC INFORMATION ── */}
          <Section title="Basic Information" className={styles.section} titleClassName={styles.sectionTitle}>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Project Type</label>
                {/* OLD STYLE BACKUP: <select style={input}> */}
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as "open" | "private")} className={styles.formSelect}>
                  <option value="open">Open / Public</option>
                  <option value="private">Private / Internal</option>
                </select>
                <Helper className={styles.helperText}>Open projects are visible and joinable by students, volunteers, and mentors. Private projects are only accessible by invited team members.</Helper>
              </div>

              <div>
                <label className={styles.formLabel}>Project Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={styles.formInput} required placeholder='e.g. "Youth Digital Literacy Mentorship Program"' />
                <Helper className={styles.helperText}>Choose a clear, outcome-focused title.</Helper>
              </div>

              <div>
                <label className={styles.formLabel}>Project Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.formSelect}>
                  <option value="">Select Category</option>
                  <option>Education</option><option>Environment</option><option>Health &amp; Wellness</option>
                  <option>Technology</option><option>Community Development</option><option>Social Impact</option>
                  <option>Arts &amp; Culture</option><option>Economic Empowerment</option><option>Other</option>
                </select>
                {category === "Other" && <input placeholder="Please specify" value={categoryOther} onChange={(e) => setCategoryOther(e.target.value)} className={styles.formInput} />}
                <Helper className={styles.helperText}>Select the main impact area.</Helper>
              </div>

              <div>
                <label className={styles.formLabel}>Location</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className={styles.formSelect}>
                  <option value="">Select Location</option>
                  <option>Remote</option><option>On-site</option><option>Hybrid</option><option>Other</option>
                </select>
                {location === "Other" && <input placeholder="Please specify location" value={locationOther} onChange={(e) => setLocationOther(e.target.value)} className={styles.formInput} />}
                <Helper className={styles.helperText}>Clarify how participation will happen.</Helper>
              </div>

              <div className={styles.formGridFull}>
                <label className={styles.formLabel}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={styles.formTextarea} />
                <Helper className={styles.helperText}>Describe your organization and project, including who you serve, the problem you address, and the change you aim to create.</Helper>
              </div>

              <div className={styles.formGridFull}>
                <label className={styles.formLabel}>Key Tasks &amp; Responsibilities</label>
                <textarea value={tasks} onChange={(e) => setTasks(e.target.value)} className={styles.formTextarea} />
                <Helper className={styles.helperText}>Define specific responsibilities. Example: "Facilitate weekly sessions," "Track attendance," or "Develop curriculum materials."</Helper>
              </div>
            </div>

          </Section>

          {/* ── SECTION 2: ROLES NEEDED ── */}
          <Section title="Roles Needed" className={styles.section} titleClassName={styles.sectionTitle}>
            {/* OLD STYLE BACKUP: <div style={checkboxGroup}><Checkbox label="Volunteer" ... /></div> */}
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}><input type="checkbox" onChange={() => toggleRole("Volunteer")} checked={roles.includes("Volunteer")} /> Volunteer</label>
              <label className={styles.checkboxLabel}><input type="checkbox" onChange={() => toggleRole("Student")} checked={roles.includes("Student")} /> Student</label>
              <label className={styles.checkboxLabel}><input type="checkbox" onChange={() => toggleRole("Mentor")} checked={roles.includes("Mentor")} /> Mentor</label>
            </div>
            <Helper className={styles.helperText}>Choose the roles required for this project.</Helper>

            <label className={styles.formLabel}>Number of Participants Needed</label>
            <input value={participantsNeeded} onChange={(e) => setParticipantsNeeded(e.target.value)} className={styles.formInput} placeholder="e.g. 10" />
            <Helper className={styles.helperText}>Align this number with project scope and timeline.</Helper>
          </Section>

          {/* ── SECTION 3: IMPACT GOALS ── */}
          <Section title="Impact Goals" className={styles.section} titleClassName={styles.sectionTitle}>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Problem This Project Addresses</label>
                <textarea value={problem} onChange={(e) => setProblem(e.target.value)} className={styles.formTextarea} />
                <Helper className={styles.helperText}>Clearly state the challenge. Example: "Low digital literacy among rural youth."</Helper>
              </div>

              <div>
                <label className={styles.formLabel}>Expected Outcomes</label>
                <textarea value={outcomes} onChange={(e) => setOutcomes(e.target.value)} className={styles.formTextarea} />
                <Helper className={styles.helperText}>State the specific results your project aims to achieve and the measurable impact you expect.</Helper>
              </div>

              <div>
                <label className={styles.formLabel}>How Success Will Be Measured</label>
                <select value={successMeasure} onChange={(e) => setSuccessMeasure(e.target.value)} className={styles.formSelect}>
                  <option value="">Select Method</option>
                  <option>Attendance Numbers</option><option>Surveys &amp; Feedback</option>
                  <option>Performance Metrics</option><option>Reports &amp; Documentation</option>
                  <option>Community Impact Indicators</option><option>Other</option>
                </select>
                {successMeasure === "Other" && <input placeholder="Please specify measurement method" value={successOther} onChange={(e) => setSuccessOther(e.target.value)} className={styles.formInput} />}
              </div>

              <div className={styles.formGridFull}>
                <label className={styles.formLabel}>Evidence You Will Collect</label>
                <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} className={styles.formTextarea} />
                <Helper className={styles.helperText}>Specify proof of impact. Example: attendance sheets, surveys, photos, reports, testimonials.</Helper>
              </div>
            </div>
          </Section>

          {/* ── SECTION 4: COMMUNICATION ── */}
          <Section title="Communication" className={styles.section} titleClassName={styles.sectionTitle}>
            <label className={styles.formLabel}>Primary Communication Method</label>
            <select value={communication} onChange={(e) => setCommunication(e.target.value)} className={styles.formSelect}>
              <option value="">Select Method</option>
              <option>In-Platform Messaging</option><option>Zoom</option><option>Email</option>
              <option>Slack</option><option>WhatsApp</option><option>Other</option>
            </select>
            {communication === "Other" && <input placeholder="Please specify" value={communicationOther} onChange={(e) => setCommunicationOther(e.target.value)} className={styles.formInput} />}
            <Helper className={styles.helperText}>Define coordination tools. Example: Slack for updates, Zoom for weekly meetings.</Helper>
          </Section>

          {/* ── BUTTONS ── */}
          {/* OLD STYLE BACKUP: <div style={buttonRow}> */}
          <div className={styles.buttonRow}>
            <Button variant="outline" type="button" onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft size={15} />
              Back
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

/* ================= HELPER COMPONENTS (styles modernisés) ================= */

// NEW MODERN UI UPDATE — Section and Helper accept className props instead of hardcoded inline styles
function Section({ title, children, className, titleClassName }: { title: string; children: React.ReactNode; className?: string; titleClassName?: string }) {
  return (
    // OLD STYLE BACKUP: <div style={{ marginBottom: "40px" }}>
    <div className={className}>
      {/* OLD STYLE BACKUP: <h3 style={{ fontSize:"18px", color:"#1F3A5F", marginBottom:"20px" }}> */}
      <h3 className={titleClassName}>{title}</h3>
      {children}
    </div>
  );
}

function Helper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    // OLD STYLE BACKUP: <p style={{ fontSize:"13px", color:"#6b7c8f", background:"rgba(31,58,95,0.04)", padding:"10px 14px", borderRadius:"10px" }}>
    <p className={className}>{children}</p>
  );
}

/* ================= EXPORT ================= */
// AJOUTÉ [Build fix] : Suspense requis par Next.js 14 pour useSearchParams() en production
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem" }}>Loading…</div>}>
      <CreateProjectPage />
    </Suspense>
  );
}
