"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import styles from "./profileDetail.module.css";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { sendInvitation } from "@/lib/invitationService";

type ProfileData = {
  userId:    string;
  email:     string;
  role:      string;
  fullName:  string;
  location:  string;
  headline:  string;
  skills:    string[];
  experience: string;
  education:  string;
  motivation: string;
  about:      string;
  languages:  string;
};

function Page() {
  const { user } = useAuth();
  const router   = useRouter();
  const params   = useParams();
  const targetUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId as string;

  const [profile,      setProfile]      = useState<ProfileData | null>(null);
  const [inviteStatus, setInviteStatus] = useState<"none" | "pending" | "accepted" | "declined">("none");
  const [loading,      setLoading]      = useState(true);
  const [inviting,     setInviting]     = useState(false);

  useEffect(() => {
    if (!user || user.role !== "organization" || !targetUserId) return;

    (async () => {
      // 1. Get basic profile (email + role)
      const { data: baseProfile } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", targetUserId)
        .maybeSingle();

      if (!baseProfile) { setLoading(false); return; }

      const role = baseProfile.role as string;

      // 2. Get role-specific profile data
      let extra: any = {};
      if (role === "mentor") {
        const { data } = await supabase.from("mentor_profiles").select("full_name, location, headline, expertise, about, languages").eq("user_id", targetUserId).maybeSingle();
        if (data) extra = { fullName: data.full_name, location: data.location, headline: data.headline, skills: data.expertise || [], about: data.about, languages: data.languages };
      } else if (role === "volunteer") {
        const { data } = await supabase.from("volunteer_profiles").select("full_name, location, headline, skills, experience, education, motivation").eq("user_id", targetUserId).maybeSingle();
        if (data) extra = { fullName: data.full_name, location: data.location, headline: data.headline, skills: data.skills || [], experience: data.experience, education: data.education, motivation: data.motivation };
      } else if (role === "student") {
        const { data } = await supabase.from("student_profiles").select("full_name, location, headline, skills, experience, goals").eq("user_id", targetUserId).maybeSingle();
        if (data) extra = { fullName: data.full_name, location: data.location, headline: data.headline, skills: data.skills || [], experience: data.experience, goals: data.goals };
      }

      setProfile({
        userId:     baseProfile.id,
        email:      baseProfile.email,
        role,
        fullName:   extra.fullName   || "",
        location:   extra.location   || "",
        headline:   extra.headline   || "",
        skills:     extra.skills     || [],
        experience: extra.experience || "",
        education:  extra.education  || "",
        motivation: extra.motivation || extra.goals || "",
        about:      extra.about      || "",
        languages:  extra.languages  || "",
      });

      // 3. Check existing invitation status from this org to this user
      const { data: invite } = await supabase
        .from("invitations")
        .select("status")
        .eq("invited_user_id", targetUserId)
        .eq("invited_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invite) setInviteStatus(invite.status as any);

      setLoading(false);
    })();
  }, [user?.id, targetUserId]);

  if (!user)                    return <div className={styles.page}>Please log in first.</div>;
  if (user.role !== "organization") return <div className={styles.page}>Only organizations can view profiles.</div>;
  if (loading)                  return <div className={styles.page}>Loading…</div>;
  if (!profile)                 return <div className={styles.page}>Profile not found.</div>;

  /* Invite action — uses Supabase projects + sendInvitation */
  const inviteToProject = async () => {
    setInviting(true);

    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, workspaces(id)")
      .eq("organization_id", user.id)
      .neq("status", "completed");

    if (!projects || projects.length === 0) {
      alert("You have no active projects to invite to.");
      setInviting(false);
      return;
    }

    const list = projects.map((p: any, i: number) => `${i + 1}. ${p.title}`).join("\n");
    const choice = prompt(`Select a project (enter number):\n${list}`);
    if (!choice) { setInviting(false); return; }

    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= projects.length) {
      alert("Invalid selection.");
      setInviting(false);
      return;
    }

    const selected = projects[idx] as any;
    const workspaceId = selected.workspaces?.[0]?.id;

    if (!workspaceId) {
      alert("No workspace found for this project.");
      setInviting(false);
      return;
    }

    const result = await sendInvitation(workspaceId, profile.email, "member", user.id);

    if (result) {
      setInviteStatus("pending");
      alert("Invitation sent successfully.");
    } else {
      alert("This user is already invited to this workspace.");
    }

    setInviting(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Button variant="secondary" onClick={() => router.push("/dashboard/profiles")}>
          <ArrowLeft size={15} /> Back to Profiles
        </Button>
      </div>

      <div className={styles.profileHeader}>
        <h1 className={styles.profileName}>{profile.fullName || profile.email}</h1>
        <span className={styles.roleBadge}>
          <User size={12} /> {profile.role}
        </span>
      </div>

      {profile.headline && <InfoCard label="Headline" value={profile.headline} />}
      {profile.location && <InfoCard label="Location" value={profile.location} icon={<MapPin size={13} />} />}
      {profile.email    && <InfoCard label="Email" value={profile.email} />}
      {profile.about    && <InfoCard label="About" value={profile.about} />}

      {profile.skills.length > 0 && (
        <div className={styles.infoCard}>
          <p className={styles.infoLabel}>Skills / Expertise</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {profile.skills.map((s) => (
              <span key={s} style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(99,142,203,0.10)", color: "#395886", fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {profile.experience && <InfoCard label="Experience" value={profile.experience} />}
      {profile.education  && <InfoCard label="Education"  value={profile.education} />}
      {profile.motivation && <InfoCard label="Motivation / Goals" value={profile.motivation} />}
      {profile.languages  && <InfoCard label="Languages"  value={profile.languages} />}

      <hr className={styles.divider} />

      {inviteStatus === "none" && (
        <Button onClick={inviteToProject} disabled={inviting}>
          {inviting ? "Sending…" : "Invite to Project"}
        </Button>
      )}
      {inviteStatus === "pending" && (
        <div className={`${styles.inviteStatusBadge} ${styles.statusPending}`}>
          <Clock size={15} /> Invitation Pending
        </div>
      )}
      {inviteStatus === "accepted" && (
        <div className={`${styles.inviteStatusBadge} ${styles.statusAccepted}`}>
          <CheckCircle size={15} /> Invitation Accepted
        </div>
      )}
      {inviteStatus === "declined" && (
        <div className={`${styles.inviteStatusBadge} ${styles.statusDeclined}`}>
          <XCircle size={15} /> Invitation Declined
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className={styles.infoCard}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value || "—"}</p>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Page), { ssr: false });
