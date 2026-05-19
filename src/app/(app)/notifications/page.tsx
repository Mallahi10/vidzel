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

  // MODIFIÉ [Notifications Supabase] : getUserNotifications est maintenant async
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const data = await getUserNotifications(user.id);
      setNotifications(data);
    };

    fetchNotifications();
  }, [user?.id]);

  if (!user) {
    return <div style={{ padding: '3rem' }}>Please log in.</div>;
  }

  // MODIFIÉ [Notifications Supabase] : async + champs is_read/workspace_id + redirect invitations
  const handleOpen = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      const data = await getUserNotifications(user.id);
      setNotifications(data);
    }

    if (n.type === "invitation") {
      window.location.href = "/dashboard/invitations";
    } else if (n.workspace_id) {
      window.location.href = `/dashboard/workspaces/${n.workspace_id}`;
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
            background: n.is_read ? 'white' : '#eff6ff',
          }}
        >
          <div
            style={{
              fontWeight: n.is_read ? 500 : 600,
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
            {/* MODIFIÉ [Notifications Supabase] : createdAt → created_at */}
            {new Date(n.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
