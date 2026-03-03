"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";

import styles from "./organizationProfile.module.css";
import { calculateOrgProfileScore } from "@/lib/profileScore";
import { loadOrgProfile, saveOrgProfile, OrgProfile } from "@/lib/localProfiles";
import { useAuth } from "@/context/AuthContext";

const ORG_TYPES = [
  "NGO / Nonprofit",
  "Social Enterprise",
  "School / University",
  "Government Agency",
  "Community Group",
  "Startup",
  "Other",
] as const;

const TEAM_SIZES = ["1–5", "6–15", "16–50", "50+"] as const;

const FOCUS_AREAS = [
  "Education",
  "Health",
  "Environment",
  "Youth Development",
  "Women Empowerment",
  "Economic Development",
  "Technology",
  "Human Rights",
  "Other",
] as const;

const COLLAB_PREFS = ["Remote", "Hybrid", "On-site", "Flexible"] as const;

function getUserKey(user: any) {
  return user?.id || user?.email || "unknown-user";
}

export default function OrganizationProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const userKey = useMemo(() => getUserKey(user), [user]);

  const [saving, setSaving] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ===================== SECTION 1: BASIC INFO ===================== */
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [yearFounded, setYearFounded] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  /* ===================== SECTION 2: MISSION & FOCUS ===================== */
  const [mission, setMission] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [targetPopulation, setTargetPopulation] = useState("");

  /* ===================== SECTION 3: OPERATIONAL CAPACITY ===================== */
  const [teamSize, setTeamSize] = useState("");
  const [managedVolunteers, setManagedVolunteers] = useState<boolean | null>(null);
  const [hostedStudents, setHostedStudents] = useState<boolean | null>(null);
  const [hasCoordinator, setHasCoordinator] = useState<boolean | null>(null);

  /* ===================== NEW SECTION 4: CONTACT & SOCIAL ===================== */
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [socialLinkedIn, setSocialLinkedIn] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");

  /* ===================== NEW SECTION 5: PROGRAMS & IMPACT ===================== */
  const [mainPrograms, setMainPrograms] = useState("");
  const [impactMetrics, setImpactMetrics] = useState("");
  const [regionsServed, setRegionsServed] = useState("");
  const [successStory, setSuccessStory] = useState("");

  /* ===================== NEW SECTION 6: COLLABORATION PREFERENCES ===================== */
  const [collaborationPreference, setCollaborationPreference] = useState("");
  const [preferredLanguages, setPreferredLanguages] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  /* ===================== NEW SECTION 7: NEEDS / SUPPORT ===================== */
  const [supportNeeded, setSupportNeeded] = useState("");
  const [resourcesAvailable, setResourcesAvailable] = useState("");
  const [toolsUsed, setToolsUsed] = useState("");
  const [partnerships, setPartnerships] = useState("");

  /* ===================== REDIRECTS ===================== */
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && user.role && user.role !== "organization") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  /* ===================== LOAD FROM LOCAL STORAGE ===================== */
  useEffect(() => {
    if (!userKey || userKey === "unknown-user") return;
    if (loadedOnce) return;

    const existing = loadOrgProfile(userKey);
    if (existing) {
      setOrganizationName(existing.organization_name || "");
      setOrganizationType(existing.organization_type || "");
      setCountry(existing.country || "");
      setCity(existing.city || "");
      setYearFounded(existing.year_founded || "");
      setWebsite(existing.website || "");
      setLogoUrl(existing.logo_url || "");

      setMission(existing.mission || "");
      setFocusAreas(existing.focus_areas || []);
      setTargetPopulation(existing.target_population || "");

      setTeamSize(existing.team_size || "");
      setManagedVolunteers(existing.managed_volunteers ?? null);
      setHostedStudents(existing.hosted_students ?? null);
      setHasCoordinator(existing.has_coordinator ?? null);

      // NEW FIELDS (safe optional reads)
      setContactName((existing as any).contact_name || "");
      setContactEmail((existing as any).contact_email || "");
      setContactPhone((existing as any).contact_phone || "");
      setContactRole((existing as any).contact_role || "");
      setSocialLinkedIn((existing as any).social_linkedin || "");
      setSocialInstagram((existing as any).social_instagram || "");
      setSocialFacebook((existing as any).social_facebook || "");

      setMainPrograms((existing as any).main_programs || "");
      setImpactMetrics((existing as any).impact_metrics || "");
      setRegionsServed((existing as any).regions_served || "");
      setSuccessStory((existing as any).success_story || "");

      setCollaborationPreference((existing as any).collaboration_preference || "");
      setPreferredLanguages((existing as any).preferred_languages || "");
      setTimeZone((existing as any).time_zone || "");
      setAvailabilityNotes((existing as any).availability_notes || "");

      setSupportNeeded((existing as any).support_needed || "");
      setResourcesAvailable((existing as any).resources_available || "");
      setToolsUsed((existing as any).tools_used || "");
      setPartnerships((existing as any).partnerships || "");
    }

    setLoadedOnce(true);
  }, [userKey, loadedOnce]);

  /* ===================== SCORE ===================== */
  const computedScore = useMemo(() => {
    const profile: Partial<OrgProfile> = {
      organization_name: organizationName,
      organization_type: organizationType,
      country,
      city,
      year_founded: yearFounded,
      website,
      logo_url: logoUrl,
      mission,
      focus_areas: focusAreas,
      target_population: targetPopulation,
      team_size: teamSize,
      managed_volunteers: managedVolunteers,
      hosted_students: hostedStudents,
      has_coordinator: hasCoordinator,

      // include new fields too (cast because OrgProfile may not include them yet)
      ...( {
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_role: contactRole,
        social_linkedin: socialLinkedIn,
        social_instagram: socialInstagram,
        social_facebook: socialFacebook,
        main_programs: mainPrograms,
        impact_metrics: impactMetrics,
        regions_served: regionsServed,
        success_story: successStory,
        collaboration_preference: collaborationPreference,
        preferred_languages: preferredLanguages,
        time_zone: timeZone,
        availability_notes: availabilityNotes,
        support_needed: supportNeeded,
        resources_available: resourcesAvailable,
        tools_used: toolsUsed,
        partnerships: partnerships,
      } as any ),
    };

    return calculateOrgProfileScore(profile);
  }, [
    organizationName,
    organizationType,
    country,
    city,
    yearFounded,
    website,
    logoUrl,
    mission,
    focusAreas,
    targetPopulation,
    teamSize,
    managedVolunteers,
    hostedStudents,
    hasCoordinator,
    contactName,
    contactEmail,
    contactPhone,
    contactRole,
    socialLinkedIn,
    socialInstagram,
    socialFacebook,
    mainPrograms,
    impactMetrics,
    regionsServed,
    successStory,
    collaborationPreference,
    preferredLanguages,
    timeZone,
    availabilityNotes,
    supportNeeded,
    resourcesAvailable,
    toolsUsed,
    partnerships,
  ]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]
    );
  };

  /* ===================== SAVE ===================== */
  const handleSave = () => {
    if (!userKey || userKey === "unknown-user") return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Minimal required fields
    if (!organizationName.trim()) {
      setErrorMsg("Organization name is required.");
      setSaving(false);
      return;
    }
    if (!organizationType.trim()) {
      setErrorMsg("Organization type is required.");
      setSaving(false);
      return;
    }
    if (!country.trim() || !city.trim()) {
      setErrorMsg("Country and city are required.");
      setSaving(false);
      return;
    }
    if (!mission.trim()) {
      setErrorMsg("Mission statement is required.");
      setSaving(false);
      return;
    }

    const profile: OrgProfile = {
      organization_name: organizationName.trim(),
      organization_type: organizationType.trim(),
      country: country.trim(),
      city: city.trim(),
      year_founded: yearFounded.trim(),
      website: website.trim(),
      logo_url: logoUrl.trim(),

      mission: mission.trim(),
      focus_areas: focusAreas,
      target_population: targetPopulation.trim(),

      team_size: teamSize.trim(),
      managed_volunteers: managedVolunteers,
      hosted_students: hostedStudents,
      has_coordinator: hasCoordinator,

      updated_at: new Date().toISOString(),

      // NEW FIELDS saved too (cast if OrgProfile doesn’t yet have them)
      ...( {
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        contact_role: contactRole.trim(),
        social_linkedin: socialLinkedIn.trim(),
        social_instagram: socialInstagram.trim(),
        social_facebook: socialFacebook.trim(),
        main_programs: mainPrograms.trim(),
        impact_metrics: impactMetrics.trim(),
        regions_served: regionsServed.trim(),
        success_story: successStory.trim(),
        collaboration_preference: collaborationPreference.trim(),
        preferred_languages: preferredLanguages.trim(),
        time_zone: timeZone.trim(),
        availability_notes: availabilityNotes.trim(),
        support_needed: supportNeeded.trim(),
        resources_available: resourcesAvailable.trim(),
        tools_used: toolsUsed.trim(),
        partnerships: partnerships.trim(),
      } as any ),
    };

    saveOrgProfile(userKey, profile);

    setSuccessMsg("Saved successfully.");
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Organization Profile</h1>
          <p className={styles.muted}>
            Complete your profile to increase trust and improve matching.
          </p>
        </div>

        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Profile score</div>
          <div className={styles.scoreValue}>{computedScore}%</div>
          <div className={styles.progressTrack} aria-label="profile score progress bar">
            <div className={styles.progressFill} style={{ width: `${computedScore}%` }} />
          </div>
        </div>
      </div>

      {errorMsg ? <div className={styles.error}>{errorMsg}</div> : null}
      {successMsg ? <div className={styles.success}>{successMsg}</div> : null}

      {/* SECTION 1 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Basic Information</h2>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Organization Name *</label>
            <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Organization Type *</label>
            <select value={organizationType} onChange={(e) => setOrganizationType(e.target.value)}>
              <option value="">Select…</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Country *</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>City *</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Year Founded</label>
            <input value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} inputMode="numeric" />
          </div>

          <div className={styles.field}>
            <label>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className={styles.fieldFull}>
            <label>Logo URL (MVP)</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Mission & Focus</h2>

        <div className={styles.field}>
          <label>Mission Statement *</label>
          <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={4} />
        </div>

        <div className={styles.field}>
          <label>Focus Areas</label>
          <div className={styles.pills}>
            {FOCUS_AREAS.map((area) => {
              const active = focusAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                  onClick={() => toggleFocusArea(area)}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.field}>
          <label>Target Population</label>
          <input value={targetPopulation} onChange={(e) => setTargetPopulation(e.target.value)} />
        </div>
      </div>

      {/* SECTION 3 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Operational Capacity</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Team Size</label>
            <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
              <option value="">Select…</option>
              {TEAM_SIZES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Managed Volunteers Before?</label>
            <div className={styles.radioRow}>
              <label className={styles.radio}>
                <input type="radio" name="managedVolunteers" checked={managedVolunteers === true} onChange={() => setManagedVolunteers(true)} />
                Yes
              </label>
              <label className={styles.radio}>
                <input type="radio" name="managedVolunteers" checked={managedVolunteers === false} onChange={() => setManagedVolunteers(false)} />
                No
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label>Hosted Students Before?</label>
            <div className={styles.radioRow}>
              <label className={styles.radio}>
                <input type="radio" name="hostedStudents" checked={hostedStudents === true} onChange={() => setHostedStudents(true)} />
                Yes
              </label>
              <label className={styles.radio}>
                <input type="radio" name="hostedStudents" checked={hostedStudents === false} onChange={() => setHostedStudents(false)} />
                No
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label>Has a Project Coordinator?</label>
            <div className={styles.radioRow}>
              <label className={styles.radio}>
                <input type="radio" name="hasCoordinator" checked={hasCoordinator === true} onChange={() => setHasCoordinator(true)} />
                Yes
              </label>
              <label className={styles.radio}>
                <input type="radio" name="hasCoordinator" checked={hasCoordinator === false} onChange={() => setHasCoordinator(false)} />
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Primary Contact</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Contact Name</label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Contact Role</label>
            <input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="e.g., Program Manager" />
          </div>

          <div className={styles.field}>
            <label>Contact Email</label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@email.com" />
          </div>

          <div className={styles.field}>
            <label>Contact Phone</label>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1…" />
          </div>
        </div>
      </div>

      {/* SECTION 5 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Social & Links</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>LinkedIn</label>
            <input value={socialLinkedIn} onChange={(e) => setSocialLinkedIn(e.target.value)} placeholder="https://linkedin.com/…" />
          </div>

          <div className={styles.field}>
            <label>Instagram</label>
            <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/…" />
          </div>

          <div className={styles.field}>
            <label>Facebook</label>
            <input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/…" />
          </div>
        </div>
      </div>

      {/* SECTION 6 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Programs & Impact</h2>

        <div className={styles.field}>
          <label>Main Programs</label>
          <textarea value={mainPrograms} onChange={(e) => setMainPrograms(e.target.value)} rows={3} placeholder="List your key programs…" />
        </div>

        <div className={styles.field}>
          <label>Impact Metrics</label>
          <textarea value={impactMetrics} onChange={(e) => setImpactMetrics(e.target.value)} rows={3} placeholder="e.g., served 2,000 youth, improved test scores by 20%…" />
        </div>

        <div className={styles.field}>
          <label>Regions Served</label>
          <input value={regionsServed} onChange={(e) => setRegionsServed(e.target.value)} placeholder="e.g., Northern Morocco, Tangier region" />
        </div>

        <div className={styles.field}>
          <label>Success Story</label>
          <textarea value={successStory} onChange={(e) => setSuccessStory(e.target.value)} rows={3} placeholder="Short story of impact…" />
        </div>
      </div>

      {/* SECTION 7 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Collaboration Preferences</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Preferred Collaboration</label>
            <select value={collaborationPreference} onChange={(e) => setCollaborationPreference(e.target.value)}>
              <option value="">Select…</option>
              {COLLAB_PREFS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Preferred Languages</label>
            <input value={preferredLanguages} onChange={(e) => setPreferredLanguages(e.target.value)} placeholder="e.g., English, French, Arabic" />
          </div>

          <div className={styles.field}>
            <label>Time Zone</label>
            <input value={timeZone} onChange={(e) => setTimeZone(e.target.value)} placeholder="e.g., GMT+1" />
          </div>

          <div className={styles.field}>
            <label>Availability Notes</label>
            <input value={availabilityNotes} onChange={(e) => setAvailabilityNotes(e.target.value)} placeholder="e.g., weekdays 9–5" />
          </div>
        </div>
      </div>

      {/* SECTION 8 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Needs & Support</h2>

        <div className={styles.field}>
          <label>Support Needed</label>
          <textarea value={supportNeeded} onChange={(e) => setSupportNeeded(e.target.value)} rows={3} placeholder="What help do you need from volunteers/students/mentors?" />
        </div>

        <div className={styles.field}>
          <label>Resources Available</label>
          <textarea value={resourcesAvailable} onChange={(e) => setResourcesAvailable(e.target.value)} rows={3} placeholder="What resources can you provide?" />
        </div>

        <div className={styles.field}>
          <label>Tools Used</label>
          <input value={toolsUsed} onChange={(e) => setToolsUsed(e.target.value)} placeholder="e.g., Google Drive, Notion, Slack" />
        </div>

        <div className={styles.field}>
          <label>Partnerships</label>
          <input value={partnerships} onChange={(e) => setPartnerships(e.target.value)} placeholder="Key partners or funders (optional)" />
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}