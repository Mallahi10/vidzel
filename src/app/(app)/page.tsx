"use client";

import styles from "./page.module.css";
import RoleSelection from "@/components/RoleSelection";
import { Sora } from "next/font/google";
import { Zap } from "lucide-react";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500"] });

export default function Home() {
  return (
    <main className={styles.main}>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.blob1} aria-hidden="true" />
        <div className={styles.blob2} aria-hidden="true" />
        <div className={styles.blob3} aria-hidden="true" />

        <div className={styles.heroContent}>
          <span className={styles.heroPill}>
            <Zap size={11} style={{ marginRight: 5, flexShrink: 0 }} />
            Social Impact Platform
          </span>

          <h1 className={styles.title}>
            Empowering Social Impact<br />Through Structure.
          </h1>

          <p className={styles.heroSubtitle} style={{ fontFamily: sora.style.fontFamily }}>
            Vidzel connects organizations, students, trainees, volunteers, and mentors
            around shared impact goals — in one unified workspace.
          </p>
        </div>
      </section>

      {/* ══════════════════════ ROLES ══════════════════════ */}
      <section id="roles" className={styles.rolesSection}>
        <p className={styles.sectionEyebrow}>WHO IT&#39;S FOR</p>
        <h2 className={styles.sectionTitle}>Different roles. One shared mission.</h2>
        <div className={styles.rolesArea}>
          <RoleSelection />
        </div>
      </section>

    </main>
  );
}
