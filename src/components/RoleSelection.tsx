"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "../app/page.module.css";
import { Shield, GraduationCap, Heart, Users } from "lucide-react";
import { Sora } from "next/font/google";

/* ================= TYPES ================= */

type UserRole = "organization" | "student" | "volunteer" | "mentor";

/* ================= FONT ================= */

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600"],
});

/* ================= COMPONENT ================= */

export default function RoleSelection() {
  const router = useRouter();

  const handleSelect = (role: UserRole) => {
    router.push(`/login?role=${role}`);
  };

  const roles: {
    id: UserRole;
    label: string;
    icon: React.ElementType;
    desc: string;
  }[] = [
    {
      id: "organization",
      label: "Organization",
      icon: Shield,
      desc: "Setup projects & enable impact.",
    },
    {
      id: "student",
      label: "Student",
      icon: GraduationCap,
      desc: "Find verifiable project work.",
    },
    {
      id: "volunteer",
      label: "Volunteer",
      icon: Heart,
      desc: "Contribute skills meaningfully.",
    },
    {
      id: "mentor",
      label: "Mentor",
      icon: Users,
      desc: "Share expertise & guide teams.",
    },
  ];

  return (
    <div className={styles.rolesGrid}>
      {roles.map((item) => (
        <div
          key={item.id}
          className={`${styles.roleCard} glass-card`}
          onClick={() => handleSelect(item.id)}
        >
          {/* Icon + Title */}
          <div className={styles.roleHeader}>
            <item.icon size={28} className={styles.roleIcon} />

            <h3
              className={styles.roleTitle}
              style={{
                fontFamily: sora.style.fontFamily,
                fontWeight: 600,
              }}
            >
              {item.label}
            </h3>
          </div>

          {/* Description */}
          <p
            className={styles.roleDesc}
            style={{
              fontFamily: sora.style.fontFamily,
              fontWeight: 400,
            }}
          >
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}