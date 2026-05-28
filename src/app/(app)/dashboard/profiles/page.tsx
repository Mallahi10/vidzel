"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./profiles.module.css";
import { ArrowLeft, Eye, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type BrowsableProfile = {
  userId: string;
  role: string;
  fullName: string;
  location: string;
  skills: string[];
};

const PAGE_SIZE = 6;

export default function BrowseProfilesPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [profiles,        setProfiles]        = useState<BrowsableProfile[]>([]);
  const [selectedRoles,   setSelectedRoles]   = useState<string[]>([]);
  const [search,          setSearch]          = useState("");
  const [currentPage,     setCurrentPage]     = useState(1);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("mentor_profiles").select("user_id, full_name, location, expertise").order("updated_at", { ascending: false }),
      supabase.from("volunteer_profiles").select("user_id, full_name, location, skills").order("updated_at", { ascending: false }),
      supabase.from("student_profiles").select("user_id, full_name, location, skills").order("updated_at", { ascending: false }),
    ]).then(([mentors, volunteers, students]) => {
      const list: BrowsableProfile[] = [
        ...((mentors.data || []).map((p: any) => ({
          userId:   p.user_id,
          role:     "mentor",
          fullName: p.full_name || "",
          location: p.location  || "",
          skills:   p.expertise || [],
        }))),
        ...((volunteers.data || []).map((p: any) => ({
          userId:   p.user_id,
          role:     "volunteer",
          fullName: p.full_name || "",
          location: p.location  || "",
          skills:   p.skills    || [],
        }))),
        ...((students.data || []).map((p: any) => ({
          userId:   p.user_id,
          role:     "student",
          fullName: p.full_name || "",
          location: p.location  || "",
          skills:   p.skills    || [],
        }))),
      ].filter((p) => p.fullName);  // only show profiles that have been filled in
      setProfiles(list);
      setLoadingProfiles(false);
    });
  }, [user?.id]);

  const allRoles = ["student", "volunteer", "mentor"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const filteredProfiles = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter((p) => {
      const roleMatch   = selectedRoles.length === 0 || selectedRoles.includes(p.role);
      const searchMatch = !q || p.fullName.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.skills.some((s) => s.toLowerCase().includes(q));
      return roleMatch && searchMatch;
    });
  }, [profiles, selectedRoles, search]);

  const totalPages        = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!user) return null;

  return (
    <div className={styles.page}>

      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>Browse Profiles</h1>
          <p className={styles.heroSubtitle}>Discover and invite the right contributors to your projects.</p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
        <button onClick={() => router.push("/dashboard")} className={styles.backLink}>
          <ArrowLeft size={15} /> Dashboard
        </button>
      </div>

      <input
        placeholder="Search by name, skill, or location..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        className={styles.searchInput}
      />

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Role</span>
          <div className={styles.checkboxRow ?? styles.filterGroup}>
            {allRoles.map((r) => (
              <label key={r} className={styles.filterChip}>
                <input type="checkbox" checked={selectedRoles.includes(r)} onChange={() => { toggleRole(r); setCurrentPage(1); }} />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {loadingProfiles && (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>Loading profiles…</p>
      )}

      {!loadingProfiles && paginatedProfiles.length === 0 && (
        <p className={styles.emptyState}>No profiles match your filters.</p>
      )}

      {!loadingProfiles && paginatedProfiles.length > 0 && (
        <div className={styles.profileGrid}>
          {paginatedProfiles.map((profile) => (
            <div key={profile.userId} className={styles.profileCard}>
              <h3 className={styles.profileName}>{profile.fullName}</h3>
              <span className={styles.profileRoleBadge}>{profile.role}</span>

              {profile.location && (
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{profile.location}</p>
              )}

              <div className={styles.tagsRow}>
                {profile.skills.slice(0, 4).map((skill, i) => (
                  <span key={i} className={styles.tag}>{skill}</span>
                ))}
              </div>

              <div className={styles.cardActions}>
                <Link href={`/dashboard/profiles/${profile.userId}`}>
                  <button className={`${styles.actionBtn} ${styles.btnView}`}>
                    <Eye size={13} /> View
                  </button>
                </Link>
                <button className={`${styles.actionBtn} ${styles.btnInvite}`}>
                  <UserPlus size={13} /> Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageBtnActive : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
