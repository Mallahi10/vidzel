'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';

/* =========================
   TYPES
========================= */
type Message = {
  id: string;
  workspaceId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
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
  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem('vidzel_messages') || '[]'
    );

    const workspaceMessages = stored.filter(
      (msg: Message) => msg.workspaceId === workspaceId
    );

    setMessages(workspaceMessages);
  }, [workspaceId]);

  /* =========================
     SEND MESSAGE
  ========================= */
  const sendMessage = () => {
    if (!user || !content.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      workspaceId,
      authorName: user.name,
      authorRole: user.role,
      content,
      createdAt: new Date().toISOString(),
    };

    const allMessages = JSON.parse(
      localStorage.getItem('vidzel_messages') || '[]'
    );

    const updatedMessages = [...allMessages, newMessage];

    localStorage.setItem(
      'vidzel_messages',
      JSON.stringify(updatedMessages)
    );

    setMessages(
      updatedMessages.filter(
        (msg: Message) => msg.workspaceId === workspaceId
      )
    );

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
            <strong>
              {msg.authorName} ({msg.authorRole})
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
