'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, Notification } from '@/lib/notifications';

export default function NotificationBell({
  className,
}: {
  className?: string;
}) {
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

  if (!user) return null;

  // MODIFIÉ [Notifications Supabase] : isRead → is_read (nom colonne Supabase)
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Link href="/notifications" className={className}>
      Notifications{unreadCount > 0 && ` (${unreadCount})`}
    </Link>
  );
}
