'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/context/AuthContext';
import styles from '../app/page.module.css';
import { Shield, GraduationCap, Heart, Users } from 'lucide-react';
import { Sora } from 'next/font/google';

/* Load Sora locally for role cards */
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600'],
});

export default function RoleSelection() {
  const router = useRouter();

  const handleSelect = (role: UserRole) => {
    router.push(`/login?role=${role.toLowerCase()}`);
  };

  const roles = [
    { id: 'ORGANIZATION', label: 'Organization', icon: Shield, desc: 'Setup projects & enable impact.' },
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, desc: 'Find verifiable project work.' },
    { id: 'VOLUNTEER', label: 'Volunteer', icon: Heart, desc: 'Contribute skills meaningfully.' },
    { id: 'MENTOR', label: 'Mentor', icon: Users, desc: 'Share expertise & guide teams.' },
  ];

  return (
    <div className={styles.rolesGrid}>
      {roles.map((item) => (
        <div
          key={item.id}
          className={`${styles.roleCard} glass-card`}
          onClick={() => handleSelect(item.id as UserRole)}
        >
          {/* 🔹 Icon + Title aligned horizontally */}
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