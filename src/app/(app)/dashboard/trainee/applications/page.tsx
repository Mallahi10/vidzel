"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./applications.module.css";
import {
  getMyApplications,
  type TraineeApplication,
  type ApplicationStatus,
} from "@/lib/traineeService";
import {
  Building2,
  Clock,
  MapPin,
  Search,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

type TabFilter = "all" | ApplicationStatus;

const TABS: { key: TabFilter; label: string }[] = [
  { key: "all",       label: "Toutes" },
  { key: "pending",   label: "En attente" },
  { key: "reviewed",  label: "Examinées" },
  { key: "interview", label: "Entretien" },
  { key: "accepted",  label: "Acceptées" },
  { key: "rejected",  label: "Refusées" },
];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; cls: string }
> = {
  pending:   { label: "En attente",  cls: "statusPending" },
  reviewed:  { label: "Examinée",    cls: "statusReviewed" },
  interview: { label: "Entretien",   cls: "statusInterview" },
  accepted:  { label: "Acceptée",    cls: "statusAccepted" },
  rejected:  { label: "Refusée",     cls: "statusRejected" },
};

export default function TraineeApplicationsPage() {
  const { user, loading } = useAuth();

  const [applications, setApplications] = useState<TraineeApplication[]>([]);
  const [fetching, setFetching]         = useState(true);
  const [activeTab, setActiveTab]       = useState<TabFilter>("all");

  useEffect(() => {
    if (!user || user.role !== "trainee") return;

    getMyApplications(user.id).then((data) => {
      setApplications(data);
      setFetching(false);
    });
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;
  if (user.role !== "trainee")
    return <div style={{ padding: "3rem" }}>Access denied.</div>;

  const filtered =
    activeTab === "all"
      ? applications
      : applications.filter((a) => a.status === activeTab);

  /* counts per status for tab badges */
  const countByStatus = (s: ApplicationStatus) =>
    applications.filter((a) => a.status === s).length;

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Mes candidatures</h1>
          <p>Suivez l&apos;avancement de toutes vos candidatures de stage.</p>
        </div>
        <Link href="/dashboard/trainee/offers" className={styles.exploreBtn}>
          <Search size={16} /> Explorer les offres
        </Link>
      </div>

      {/* ── SUMMARY CARDS ── */}
      {!fetching && (
        <div className={styles.summaryGrid}>
          <SummaryCard
            label="Total"
            value={applications.length}
            accent="#0EA5E9"
          />
          <SummaryCard
            label="En attente"
            value={countByStatus("pending")}
            accent="#F59E0B"
          />
          <SummaryCard
            label="Entretiens"
            value={countByStatus("interview")}
            accent="#0284C7"
          />
          <SummaryCard
            label="Acceptées"
            value={countByStatus("accepted")}
            accent="#10B981"
          />
        </div>
      )}

      {/* ── TABS ── */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => {
          const cnt = tab.key === "all"
            ? applications.length
            : countByStatus(tab.key as ApplicationStatus);

          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {cnt > 0 && (
                <span className={styles.tabBadge}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── LIST ── */}
      {fetching ? (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><ClipboardList size={36} /></div>
          <p className={styles.emptyTitle}>
            {activeTab === "all"
              ? "Aucune candidature envoyée"
              : `Aucune candidature "${TABS.find((t) => t.key === activeTab)?.label}"`}
          </p>
          <p className={styles.emptySubtitle}>
            {activeTab === "all"
              ? "Explorez les offres et postulez à votre premier stage !"
              : "Changez de filtre pour voir d'autres candidatures."}
          </p>
          {activeTab === "all" && (
            <Link href="/dashboard/trainee/offers" className={styles.emptyBtn}>
              Explorer les offres →
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((app) => (
            <ApplicationRow key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className={styles.summaryCard}
      style={{ borderTopColor: accent } as React.CSSProperties}
    >
      <div className={styles.summaryValue} style={{ color: accent }}>
        {value}
      </div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}

/* ============================================================
   APPLICATION ROW
============================================================ */

function ApplicationRow({ application }: { application: TraineeApplication }) {
  const offer = application.internship_offers;
  const cfg   = STATUS_CONFIG[application.status];

  return (
    <div className={styles.row}>
      {/* Org Avatar */}
      <div className={styles.orgAvatar}>
        <Building2 size={18} />
      </div>

      {/* Main info */}
      <div className={styles.rowMain}>
        <p className={styles.rowOrgName}>{offer?.org_name ?? "—"}</p>
        <h3 className={styles.rowTitle}>{offer?.title ?? "—"}</h3>

        <div className={styles.rowMeta}>
          {offer?.duration && (
            <span><Clock size={12} /> {offer.duration}</span>
          )}
          {offer?.location_type && (
            <span>
              <MapPin size={12} />
              {{ remote: "Remote", "on-site": "Sur site", hybrid: "Hybride" }[offer.location_type]}
            </span>
          )}
          <span>
            Postuléle {new Date(application.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>

        {/* Cover letter excerpt */}
        {application.cover_letter && (
          <p className={styles.coverExcerpt}>
            &ldquo;{application.cover_letter.slice(0, 120)}
            {application.cover_letter.length > 120 ? "…" : ""}&rdquo;
          </p>
        )}

        {/* Interview date */}
        {application.status === "interview" && application.interview_date && (
          <div className={styles.interviewBadge}>
            Entretien prévu le{" "}
            {new Date(application.interview_date).toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className={styles.rowRight}>
        <span className={`${styles.status} ${styles[cfg.cls]}`}>
          {cfg.label}
        </span>
        {application.updated_at !== application.created_at && (
          <span className={styles.updatedAt}>
            Mis à jour le{" "}
            {new Date(application.updated_at).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
