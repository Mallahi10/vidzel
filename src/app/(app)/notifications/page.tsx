'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserNotifications,
  markNotificationRead,
  Notification,
} from '@/lib/notifications';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    setNotifications(getUserNotifications(user.id));
  }, [user]);

  if (!user) {
    return <div style={{ padding: '3rem' }}>Please log in.</div>;
  }

  const handleOpen = (n: Notification) => {
    if (!n.isRead) {
      markNotificationRead(n.id);
      setNotifications(getUserNotifications(user.id));
    }

    if (n.workspaceId) {
      window.location.href = `/workspace/${n.workspaceId}`;
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Notifications</h1>

      {notifications.length === 0 && (
        <p style={{ color: '#64748b' }}>
          You have no notifications.
        </p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => handleOpen(n)}
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            cursor: 'pointer',
            background: n.isRead ? 'white' : '#eff6ff',
          }}
        >
          <div
            style={{
              fontWeight: n.isRead ? 500 : 600,
              marginBottom: '0.25rem',
            }}
          >
            {n.title}
          </div>

          <div
            style={{
              fontSize: '0.9rem',
              color: '#475569',
            }}
          >
            {n.message}
          </div>

          <div
            style={{
              marginTop: '0.4rem',
              fontSize: '0.75rem',
              color: '#94a3b8',
            }}
          >
            {new Date(n.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
