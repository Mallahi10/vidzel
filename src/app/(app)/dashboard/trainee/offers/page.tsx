"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./offers.module.css";
import {
  getInternshipOffers,
  getBookmarkedOffers,
  getAppliedOfferIds,
  getBookmarkedOfferIds,
  toggleBookmark,
  applyToOffer,
  getTraineeProfile,
  calculateSkillMatch,
  type InternshipOffer,
} from "@/lib/traineeService";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Building2,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Rocket,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import Button from "@/components/Button";

const DOMAINS = [
  "Technologie", "Marketing", "Design", "Data",
  "Finance", "RH", "Communication", "Commerce",
];

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "on-site", label: "Sur site" },
  { value: "hybrid", label: "Hybride" },
];

type OfferTab = "all" | "saved";

export default function TraineeOffersPage() {
  const { user, loading } = useAuth();

  const [offers, setOffers]           = useState<InternshipOffer[]>([]);
  const [savedOffers, setSavedOffers] = useState<InternshipOffer[]>([]);
  const [appliedIds, setAppliedIds]   = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [traineeSkills, setTraineeSkills] = useState<string[]>([]);

  const [activeTab, setActiveTab]       = useState<OfferTab>("all");
  const [search, setSearch]             = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterLoc, setFilterLoc]       = useState("");
  const [fetching, setFetching]         = useState(true);

  /* Apply modal */
  const [modalOffer, setModalOffer]   = useState<InternshipOffer | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying]       = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  /* Load all data */
  const loadData = useCallback(async () => {
    if (!user) return;
    setFetching(true);

    const [offersData, savedData, appliedData, bookmarkedData, profile] =
      await Promise.all([
        getInternshipOffers({ domain: filterDomain, location_type: filterLoc, search }),
        getBookmarkedOffers(user.id),
        getAppliedOfferIds(user.id),
        getBookmarkedOfferIds(user.id),
        getTraineeProfile(user.id),
      ]);

    setOffers(offersData);
    setSavedOffers(savedData);
    setAppliedIds(appliedData);
    setBookmarkedIds(bookmarkedData);
    setTraineeSkills(profile?.skills ?? []);
    setFetching(false);
  }, [user?.id, filterDomain, filterLoc, search]);

  useEffect(() => {
    if (!user || user.role !== "trainee") return;
    loadData();
  }, [loadData]);

  if (loading) return null;
  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;
  if (user.role !== "trainee") return <div style={{ padding: "3rem" }}>Access denied.</div>;

  const displayedOffers = activeTab === "saved" ? savedOffers : offers;

  const handleToggleBookmark = async (offerId: string) => {
    const isBookmarked = bookmarkedIds.includes(offerId);
    const ok = await toggleBookmark(user.id, offerId, isBookmarked);
    if (ok) {
      setBookmarkedIds((prev) =>
        isBookmarked ? prev.filter((id) => id !== offerId) : [...prev, offerId]
      );
      // Refresh saved offers list
      const saved = await getBookmarkedOffers(user.id);
      setSavedOffers(saved);
    }
  };

  const openApplyModal = (offer: InternshipOffer) => {
    setCoverLetter("");
    setApplySuccess(false);
    setModalOffer(offer);
  };

  const handleApply = async () => {
    if (!modalOffer || !user) return;
    setApplying(true);
    const ok = await applyToOffer(modalOffer.id, user.id, coverLetter, null);
    setApplying(false);
    if (ok) {
      setAppliedIds((prev) => [...prev, modalOffer.id]);
      setApplySuccess(true);
    }
  };

  const closeModal = () => {
    setModalOffer(null);
    setApplySuccess(false);
  };

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Explorer les offres de stage</h1>
          <p>Découvrez les opportunités publiées par les organisations.</p>
        </div>
        {offers.length > 0 && (
          <span className={styles.count}>
            {offers.length} offre{offers.length !== 1 ? "s" : ""} disponible{offers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── TABS ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Toutes les offres
          {offers.length > 0 && <span className={styles.tabCount}>{offers.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "saved" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          <BookmarkCheck size={15} /> Sauvegardées
          {bookmarkedIds.length > 0 && <span className={styles.tabCount}>{bookmarkedIds.length}</span>}
        </button>
      </div>

      {/* ── FILTERS ── */}
      {activeTab === "all" && (
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Rechercher une offre ou entreprise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
            />
          </div>

          <div className={styles.filters}>
            <SlidersHorizontal size={15} style={{ color: "#94A3B8", flexShrink: 0 }} />
            <select
              className={styles.select}
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
            >
              <option value="">Tous les domaines</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              className={styles.select}
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
            >
              <option value="">Tous lieux</option>
              {LOCATION_TYPES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            {(filterDomain || filterLoc || search) && (
              <button
                className={styles.clearBtn}
                onClick={() => { setFilterDomain(""); setFilterLoc(""); setSearch(""); }}
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── OFFERS GRID ── */}
      {fetching ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : displayedOffers.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {activeTab === "saved" ? <BookmarkCheck size={36} /> : <Search size={36} />}
          </div>
          <p className={styles.emptyTitle}>
            {activeTab === "saved"
              ? "Aucune offre sauvegardée"
              : "Aucune offre trouvée"}
          </p>
          <p className={styles.emptySubtitle}>
            {activeTab === "saved"
              ? "Cliquez sur le signet d'une offre pour la sauvegarder."
              : "Essayez de modifier vos filtres ou revenez plus tard."}
          </p>
          {activeTab === "saved" && (
            <button className={styles.emptyBtn} onClick={() => setActiveTab("all")}>
              Explorer les offres
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedOffers.map((offer) => {
            const isApplied   = appliedIds.includes(offer.id);
            const isSaved     = bookmarkedIds.includes(offer.id);
            const matchScore  = calculateSkillMatch(traineeSkills, offer.required_skills);

            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                isApplied={isApplied}
                isSaved={isSaved}
                matchScore={matchScore}
                onBookmark={() => handleToggleBookmark(offer.id)}
                onApply={() => openApplyModal(offer)}
              />
            );
          })}
        </div>
      )}

      {/* ── APPLY MODAL ── */}
      {modalOffer && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{modalOffer.title}</h2>
                <p className={styles.modalOrg}>{modalOffer.org_name}</p>
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            {applySuccess ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}><Check size={28} /></div>
                <h3>Candidature envoyée ! 🚀</h3>
                <p>
                  Votre candidature chez <strong>{modalOffer.org_name}</strong> a bien été soumise.
                  Suivez son avancement dans &quot;Mes candidatures&quot;.
                </p>
                <Button onClick={closeModal}>Fermer</Button>
              </div>
            ) : (
              <>
                <div className={styles.modalBody}>
                  <div className={styles.offerMeta}>
                    <span><Clock size={14} /> {modalOffer.duration}</span>
                    <span><MapPin size={14} /> {modalOffer.location_type}</span>
                    {modalOffer.domain && <span>{modalOffer.domain}</span>}
                  </div>

                  <label className={styles.modalLabel}>
                    Lettre de motivation (optionnel)
                  </label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={5}
                    placeholder="Expliquez pourquoi vous souhaitez rejoindre cette organisation…"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />

                  <p className={styles.modalCvNote}>
                    Votre CV enregistré dans votre profil sera joint automatiquement.
                  </p>
                </div>

                <div className={styles.modalActions}>
                  <Button variant="outline" onClick={closeModal}>Annuler</Button>
                  <Button onClick={handleApply} disabled={applying}>
                    <Rocket size={16} />
                    {applying ? "Envoi…" : "Envoyer ma candidature"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   OFFER CARD
============================================================ */

function OfferCard({
  offer,
  isApplied,
  isSaved,
  matchScore,
  onBookmark,
  onApply,
}: {
  offer: InternshipOffer;
  isApplied: boolean;
  isSaved: boolean;
  matchScore: number;
  onBookmark: () => void;
  onApply: () => void;
}) {
  const locLabel: Record<string, string> = {
    "remote": "Remote",
    "on-site": "Sur site",
    "hybrid": "Hybride",
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        {/* Org avatar */}
        <div className={styles.orgAvatar}>
          {offer.org_logo_url ? (
            <img src={offer.org_logo_url} alt={offer.org_name} />
          ) : (
            <Building2 size={18} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className={styles.orgName}>{offer.org_name}</p>
          <h3 className={styles.offerTitle}>{offer.title}</h3>
        </div>

        {/* Bookmark */}
        <button
          className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkActive : ""}`}
          onClick={onBookmark}
          aria-label={isSaved ? "Retirer des favoris" : "Sauvegarder"}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {/* Badges row */}
      <div className={styles.badges}>
        <span className={`${styles.badge} ${styles.badgeLoc}`}>
          <MapPin size={11} /> {locLabel[offer.location_type] ?? offer.location_type}
        </span>
        <span className={`${styles.badge} ${styles.badgeDur}`}>
          <Clock size={11} /> {offer.duration}
        </span>
        {offer.domain && (
          <span className={`${styles.badge} ${styles.badgeDomain}`}>{offer.domain}</span>
        )}
        {matchScore > 0 && (
          <span className={`${styles.badge} ${styles.badgeMatch}`}>
            {matchScore}% match
          </span>
        )}
      </div>

      {/* Description */}
      {offer.description && (
        <p className={styles.desc}>{offer.description}</p>
      )}

      {/* Required skills preview */}
      {offer.required_skills?.length > 0 && (
        <div className={styles.skillTags}>
          {offer.required_skills.slice(0, 4).map((s) => (
            <span key={s} className={styles.skillTag}>{s}</span>
          ))}
          {offer.required_skills.length > 4 && (
            <span className={styles.skillTagMore}>+{offer.required_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Publication date */}
      <p className={styles.pubDate}>
        Publié le {new Date(offer.created_at).toLocaleDateString("fr-FR")}
      </p>

      {/* Actions */}
      <div className={styles.cardActions}>
        {isApplied ? (
          <span className={styles.appliedBadge}>
            <Check size={14} /> Candidature envoyée
          </span>
        ) : (
          <button className={styles.applyBtn} onClick={onApply}>
            <Rocket size={15} /> Postuler
          </button>
        )}
      </div>
    </div>
  );
}
