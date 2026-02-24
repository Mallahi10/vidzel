'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      {/* Left side — Brand */}
      <Link href="/" className={styles.brand}>
        <div className={styles.logo}>V</div>

        <div>
          <div className={styles.name}>Vidzel</div>
          <div className={styles.tagline}>
            Virtual Impact & Development Zone for Engaged Leaders
          </div>
        </div>
      </Link>

      {/* Right side — Navigation */}
      <nav className={styles.nav}>
        <Link href="/about" className={styles.navItem}>
          About
        </Link>

        {user && (
          <>
            <Link href="/dashboard" className={styles.navItem}>
              Dashboard
            </Link>

            {/* Notifications (same style as links) */}
            <NotificationBell className={styles.navItem} />

            <button
              onClick={handleLogout}
              className={styles.logout}
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}