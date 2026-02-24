"use client";

import styles from "./page.module.css";
import RoleSelection from "@/components/RoleSelection";
import { Sora } from "next/font/google";

/* Load Sora ONLY for this page */
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function Home() {
  return (
    <main className={styles.main}>
      {/* HERO */}
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Empowering Social Impact Through Structure.
        </h1>
      </div>

      {/* JOURNEY */}
      <section className={styles.journey}>
        <h2 className={styles.journeyTitle}>
          Different roles. One shared mission.
        </h2>

        <p
          className={styles.journeySubtitle}
          style={{ fontFamily: sora.style.fontFamily }}
        >
          Vidzel connects organizations, students, volunteers, and mentors
          around shared impact goals.
        </p>

        {/* ROLES */}
        <div className={styles.rolesArea}>
          <RoleSelection />
        </div>

        {/* SHARED IMPACT */}
        <div className={styles.impactArea}>
          <div className={styles.impactBadge}>
            Shared Impact
          </div>
        </div>
      </section>
    </main>
  );
}