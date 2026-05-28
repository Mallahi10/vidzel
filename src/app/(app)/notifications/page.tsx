'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, markNotificationRead, Notification } from '@/lib/notifications';
import { Bell, Mail, LayoutGrid, CheckCheck } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const typeMap: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  invitation:    { icon: <Mail size={17} />,       bg: '#ede9fe', color: '#7c3aed' },
  workspace:     { icon: <LayoutGrid size={17} />, bg: '#e0f2fe', color: '#0369a1' },
  // NEW ANNOUNCEMENT SYSTEM
  announcement:  { icon: <Bell size={17} />,       bg: '#fef9c3', color: '#854d0e' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingAll, setMarkingAll]       = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.id).then(setNotifications);
  }, [user?.id]);

  if (!user) return <div style={{ padding: '3rem' }}>Please log in.</div>;

  const handleOpen = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }

    // SEPARATION RULE: invitations → invitations page (accept/decline flow)
    //                  announcements → project detail page (discover + apply flow)
    //                  workspace → workspace page
    if (n.type === 'invitation') {
      // INVITATION FLOW — redirect to invitations page, never to project apply
      window.location.href = '/dashboard/invitations';
    } else if (n.type === 'announcement' && n.project_id) {
      // ANNOUNCEMENT FLOW — redirect to project detail page for discover + apply
      window.location.href = `/dashboard/projects/${n.project_id}`;
    } else if (n.workspace_id) {
      window.location.href = `/dashboard/workspaces/${n.workspace_id}`;
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await Promise.all(notifications.filter(n => !n.is_read).map(n => markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem' }}>
            Notifications
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', background: 'white',
              color: '#475569', fontSize: '0.85rem', fontWeight: 600,
              cursor: markingAll ? 'wait' : 'pointer',
              opacity: markingAll ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'white', borderRadius: '20px',
          border: '1px dashed #e2e8f0',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Bell size={26} color="#94a3b8" />
          </div>
          <p style={{ color: '#334155', fontWeight: 600, margin: '0 0 0.25rem' }}>No notifications yet</p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            We'll notify you when something happens.
          </p>
        </div>
      )}

      {/* Notification list */}
      {notifications.map((n) => {
        const meta = typeMap[n.type] ?? { icon: <Bell size={17} />, bg: '#f0f9ff', color: '#0284c7' };
        return (
          <div
            key={n.id}
            onClick={() => handleOpen(n)}
            style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              padding: '1rem 1.25rem', marginBottom: '0.625rem',
              borderRadius: '16px', cursor: 'pointer',
              background: n.is_read ? 'white' : '#f0f7ff',
              border: `1px solid ${n.is_read ? '#f1f5f9' : '#bfdbfe'}`,
              borderLeft: `4px solid ${n.is_read ? '#e2e8f0' : '#3b82f6'}`,
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              transition: 'box-shadow 0.15s ease',
            }}
          >
            {/* Type icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: meta.bg, color: meta.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {meta.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <p style={{
                  fontWeight: n.is_read ? 500 : 700, fontSize: '0.925rem',
                  color: '#0f172a', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.title}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {timeAgo(n.created_at)}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {n.message}
              </p>
            </div>

            {/* Unread dot */}
            {!n.is_read && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#3b82f6', flexShrink: 0, marginTop: 7,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
