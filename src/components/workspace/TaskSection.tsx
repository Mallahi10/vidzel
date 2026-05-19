'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
// AJOUTÉ [Étape 2] : client Supabase pour remplacer localStorage
import { supabase } from '@/lib/supabaseClient';

/* =========================
   TYPES
========================= */
// MODIFIÉ [Étape 2] : champs renommés pour correspondre aux colonnes Supabase
type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  completed: boolean;
};

/* =========================
   COMPONENT
========================= */
export default function TaskSection({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  /* =========================
     LOAD TASKS
  ========================= */
  // MODIFIÉ [Étape 2] : lecture depuis Supabase (remplace localStorage)
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[TaskSection] fetch error:', error.message);
        return;
      }

      setTasks(data || []);
    };

    fetchTasks();
  }, [workspaceId]);

  /* =========================
     CREATE TASK (ORG ONLY)
  ========================= */
  // MODIFIÉ [Étape 2] : INSERT dans Supabase (remplace localStorage)
  // created_by utilise user.id (UUID) et non user.email — requis par la FK profiles
  const createTask = async () => {
    if (!user || user.role !== 'organization') return;
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim() || null,
        created_by: user.id,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[TaskSection] insert error:', error.message);
      return;
    }

    setTasks((prev) => [...prev, data]);
    setTitle('');
    setDescription('');
  };

  // AJOUTÉ [Task completion] : UPDATE completed dans Supabase
  // Accessible par l'org et les membres (RLS "Org and members can update tasks")
  const toggleTask = async (task: Task) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      console.error('[TaskSection] toggle error:', error.message);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Tasks</h2>

      {/* Organization-only task creation */}
      {user?.role === 'organization' && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              width: '100%',
            }}
          />

          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              display: 'block',
              marginBottom: '0.75rem',
              width: '100%',
            }}
          />

          <Button onClick={createTask}>
            Create Task
          </Button>
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 && (
        <p>No tasks yet.</p>
      )}

      {/* MODIFIÉ [Task completion] : affichage statut + bouton toggle */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: '0.75rem 0',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div>
            <strong style={{
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#94a3b8' : 'inherit',
            }}>
              {task.title}
            </strong>
            {task.description && (
              <p style={{ margin: '0.25rem 0 0', color: task.completed ? '#94a3b8' : 'inherit' }}>
                {task.description}
              </p>
            )}
          </div>

          <button
            onClick={() => toggleTask(task)}
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: task.completed ? '#f1f5f9' : '#dcfce7',
              color: task.completed ? '#64748b' : '#166534',
            }}
          >
            {task.completed ? '↩ Undo' : '✅ Done'}
          </button>
        </div>
      ))}
    </section>
  );
}
