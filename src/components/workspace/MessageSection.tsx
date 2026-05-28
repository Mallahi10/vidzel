'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
import styles from './workspace.module.css';
import { MessageSquare, Send } from 'lucide-react';

type Message = {
  id: string;
  workspace_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { email: string; role: string } | null;
};

/* ── Helper: extract initials from email ── */
function getInitials(email: string): string {
  return (email?.split('@')[0]?.[0] ?? '?').toUpperCase();
}

/* ── Helper: format timestamp ── */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function MessageSection({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');

  /* Load messages + realtime (logique inchangée) */
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(email, role)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) { console.error('[MessageSection] fetch error:', error.message); return; }
      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${workspaceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `workspace_id=eq.${workspaceId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(email, role)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  /* Send message (logique inchangée) */
  const sendMessage = async () => {
    if (!user || !content.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({ workspace_id: workspaceId, author_id: user.id, content: content.trim() })
      .select('*, profiles(email, role)')
      .single();

    if (error) { console.error('[MessageSection] insert error:', error.message); return; }
    setMessages((prev) => [...prev, data]);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage();
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <MessageSquare size={17} className={styles.sectionTitleIconMsg} />
        Conversation
        {messages.length > 0 && (
          <span className={styles.countBadge}>{messages.length}</span>
        )}
      </h2>

      {/* Message list — NEW: avatar + bubble structure */}
      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <p className={styles.emptyText}>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const authorEmail = msg.profiles?.email ?? msg.author_id;
            const isOwn = msg.author_id === user?.id;

            return (
              /* OLD STYLE BACKUP: <div key={msg.id} className={styles.message}> with flat structure */
              /* NEW MODERN UI UPDATE: avatar + bubble layout */
              <div key={msg.id} className={styles.message}>
                {/* NEW: letter avatar */}
                <div className={styles.messageAvatar} title={authorEmail}>
                  {getInitials(authorEmail)}
                </div>

                {/* NEW: bubble wrapper */}
                <div className={styles.messageBubble}>
                  <div className={styles.messageAuthor}>
                    {authorEmail}
                    {msg.profiles?.role && (
                      <span className={styles.messageRoleBadge}>{msg.profiles.role}</span>
                    )}
                    {/* NEW: timestamp */}
                    <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                  </div>
                  <p className={styles.messageContent}>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input row (logique inchangée) */}
      <div className={styles.messageInputRow}>
        <textarea
          placeholder="Write a message… (Ctrl+Enter to send)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.formTextarea}
        />
        <Button onClick={sendMessage}>
          <Send size={15} />
          Send
        </Button>
      </div>
    </section>
  );
}
