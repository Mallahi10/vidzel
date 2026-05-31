"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./RoleSelection.module.css";
import { Shield, GraduationCap, Heart, Users, Briefcase } from "lucide-react";
import { Sora } from "next/font/google";

type UserRole = "organization" | "student" | "volunteer" | "mentor" | "trainee";

const sora = Sora({ subsets: ["latin"], weight: ["400", "600"] });

export default function RoleSelection() {
  const router = useRouter();

  const handleSelect = (role: UserRole) => {
    router.push(`/login?role=${role}`);
  };

  const roles = [
    {
      id: "organization",
      label: "Organization",
      icon: Shield,
      desc: "Setup projects & enable impact.",
      tag: "For NGOs & companies",
    },
    {
      id: "student",
      label: "Student",
      icon: GraduationCap,
      desc: "Find verifiable project work.",
      tag: "Build your portfolio",
    },
    {
      id: "volunteer",
      label: "Volunteer",
      icon: Heart,
      desc: "Contribute skills meaningfully.",
      tag: "Make a difference",
    },
    {
      id: "mentor",
      label: "Mentor",
      icon: Users,
      desc: "Share expertise & guide teams.",
      tag: "Lead & inspire",
    },
    {
      id: "trainee",
      label: "Trainee",
      icon: Briefcase,
      desc: "Find internships & grow your career.",
      tag: "Launch your journey",
    },
  ] as const;

  return (
    <div className={styles.rolesGrid}>
      {roles.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          className={styles.roleCard}
          onClick={() => handleSelect(item.id)}
        >
          {/* Decorative rings */}
          <div className={styles.cardRing} aria-hidden="true" />
          {/* Step number */}
          <span className={styles.cardNumber} aria-hidden="true">
            {String(idx + 1).padStart(2, "0")}
          </span>

          <div className={styles.iconWrap}>
            <item.icon size={24} />
          </div>

          <h3 className={styles.roleTitle} style={{ fontFamily: sora.style.fontFamily }}>
            {item.label}
          </h3>
          <span className={styles.roleTag}>{item.tag}</span>
          <p className={styles.roleDesc} style={{ fontFamily: sora.style.fontFamily }}>
            {item.desc}
          </p>
          <span className={styles.cardCta}>
            Get started <span className={styles.ctaArrow}>→</span>
          </span>
        </button>
      ))}
    </div>
  );
}
