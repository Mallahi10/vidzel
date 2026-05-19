'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
// AJOUTÉ [Étape 2] : client Supabase pour remplacer localStorage
import { supabase } from '@/lib/supabaseClient';

/* =========================
   TYPES
========================= */
// MODIFIÉ [Étape 2] : champs renommés pour Supabase + join profiles pour nom/rôle auteur
type Message = {
  id: string;
  workspace_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: {
    email: string;
    role: string;
  } | null;
};

/* =========================
   COMPONENT
========================= */
export default function MessageSection({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');

  /* =========================
     LOAD MESSAGES
  ========================= */
  // MODIFIÉ [Étape 2] : lecture depuis Supabase avec join profiles (remplace localStorage)
  // AJOUTÉ [Realtime] : abonnement Supabase Realtime pour messages instantanés
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(email, role)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[MessageSection] fetch error:', error.message);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Abonnement aux nouveaux messages en temps réel
    const channel = supabase
      .channel(`messages:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          // Récupérer le message complet avec join profiles
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(email, role)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Eviter les doublons — sendMessage() a déjà ajouté notre propre message
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    // Désabonnement au démontage du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  /* =========================
     SEND MESSAGE
  ========================= */
  // MODIFIÉ [Étape 2] : INSERT dans Supabase (remplace localStorage)
  // author_id utilise user.id (UUID) — requis par la FK profiles
  const sendMessage = async () => {
    if (!user || !content.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        author_id: user.id,
        content: content.trim(),
      })
      .select('*, profiles(email, role)')
      .single();

    if (error) {
      console.error('[MessageSection] insert error:', error.message);
      return;
    }

    setMessages((prev) => [...prev, data]);
    setContent('');
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Conversation</h2>

      {/* Messages list */}
      <div style={{ marginBottom: '1rem' }}>
        {messages.length === 0 && (
          <p>No messages yet.</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #eee',
            }}
          >
            {/* MODIFIÉ [Étape 2] : nom/rôle lus depuis profiles (join Supabase) */}
            <strong>
              {msg.profiles?.email ?? msg.author_id} ({msg.profiles?.role ?? ""})
            </strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Message input */}
      <textarea
        placeholder="Write a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          display: 'block',
          width: '100%',
          marginBottom: '0.75rem',
        }}
      />

      <Button onClick={sendMessage}>
        Send
      </Button>
    </section>
  );
}