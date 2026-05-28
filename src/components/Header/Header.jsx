'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
// NEW MODERN UI UPDATE — Lucide icons for hamburger button
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

/* OLD STYLE BACKUP — original Header had no mobile menu, no hamburger state,
   and a single flat flex row with text-decoration underline on hover.
   The new version wraps content in .headerBar and adds a .mobileNav panel. */

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // NEW MODERN UI UPDATE — mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // NEW MODERN UI UPDATE — close mobile menu on any nav click
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.header}>

      {/* NEW MODERN UI UPDATE — inner bar (brand + desktop nav + hamburger) */}
      <div className={styles.headerBar}>

        {/* Left side — Brand */}
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <div className={styles.logo}>V</div>
          <div>
            <div className={styles.name}>Vidzel</div>
            <div className={styles.tagline}>
              Virtual Impact & Development Zone for Engaged Leaders
            </div>
          </div>
        </Link>

        {/* Right side — Desktop navigation (hidden on mobile) */}
        <nav className={styles.nav}>
          <Link href="/about" className={styles.navItem}>
            About
          </Link>

          {user && (
            <>
              <Link href="/dashboard" className={styles.navItem}>
                Dashboard
              </Link>

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

        {/* NEW MODERN UI UPDATE — hamburger button (visible on mobile only) */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      {/* NEW MODERN UI UPDATE — mobile nav panel, shown when menuOpen is true */}
      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          <Link href="/about" className={styles.mobileNavItem} onClick={closeMenu}>
            About
          </Link>

          {user && (
            <>
              <Link href="/dashboard" className={styles.mobileNavItem} onClick={closeMenu}>
                Dashboard
              </Link>

              <div className={styles.mobileNavItem}>
                <NotificationBell />
              </div>

              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className={styles.mobileLogout}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      )}

    </header>
  );
}
