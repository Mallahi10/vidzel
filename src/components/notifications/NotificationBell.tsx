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

  useEffect(() => {
    if (!user) return;
    setNotifications(getUserNotifications(user.id));
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Link href="/notifications" className={className}>
      Notifications{unreadCount > 0 && ` (${unreadCount})`}
    </Link>
  );
}
