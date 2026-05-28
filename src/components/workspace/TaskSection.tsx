'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
// NEW MODERN UI UPDATE — CSS module replaces inline styles
import styles from './workspace.module.css';
import { ListTodo, Check, RotateCcw, Plus } from 'lucide-react';

/* =========================
   TYPES (inchangés)
========================= */
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
   COMPONENT — business logic entirely unchanged
========================= */
export default function TaskSection({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  /* Load tasks + realtime sync */
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) { console.error('[TaskSection] fetch error:', error.message); return; }
      setTasks(data || []);
    };
    fetchTasks();

    const channel = supabase
      .channel(`tasks:${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => prev.some((t) => t.id === payload.new.id) ? prev : [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) => prev.map((t) => t.id === payload.new.id ? payload.new as Task : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  /* Create task (inchangé) */
  const createTask = async () => {
    if (!user || user.role !== 'organization') return;
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ workspace_id: workspaceId, title: title.trim(), description: description.trim() || null, created_by: user.id, completed: false })
      .select()
      .single();

    if (error) { console.error('[TaskSection] insert error:', error.message); return; }
    setTasks((prev) => [...prev, data]);
    setTitle('');
    setDescription('');
  };

  /* Toggle task (inchangé) */
  const toggleTask = async (task: Task) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select()
      .single();

    if (error) { console.error('[TaskSection] toggle error:', error.message); return; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
  };

  /* =========================
     RENDER
  ========================= */
  return (
    // OLD STYLE BACKUP: <section style={{ marginTop: '2rem' }}>
    <section className={styles.section}>
      {/* OLD STYLE BACKUP: <h2>Tasks</h2> */}
      <h2 className={styles.sectionTitle}>
        <ListTodo size={18} className={styles.sectionTitleIcon} />
        Tasks
      </h2>

      {/* Organization-only task creation */}
      {user?.role === 'organization' && (
        // OLD STYLE BACKUP: <div style={{ marginBottom: '1rem' }}>
        <div className={styles.form}>
          {/* OLD STYLE BACKUP: <input style={{ display:'block', marginBottom:'0.5rem', width:'100%' }} /> */}
          <div className={styles.formField}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formField}>
            <textarea
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.formTextarea}
            />
          </div>

          <Button onClick={createTask}>
            <Plus size={15} />
            Create Task
          </Button>
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        // OLD STYLE BACKUP: <p>No tasks yet.</p>
        <p className={styles.emptyText}>No tasks yet.</p>
      ) : (
        // OLD STYLE BACKUP: tasks.map key with inline styles
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskItem} ${task.completed ? styles.taskItemCompleted : ''}`}
            >
              <div className={styles.taskContent}>
                {/* OLD STYLE BACKUP: <strong style={{ textDecoration: task.completed ? 'line-through' : 'none' }}> */}
                <p className={`${styles.taskTitle} ${task.completed ? styles.taskTitleDone : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`${styles.taskDesc} ${task.completed ? styles.taskDescDone : ''}`}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* OLD STYLE BACKUP: <button style={{ padding:'4px 10px', borderRadius:'8px', background: conditional }}>✅ Done / ↩ Undo</button> */}
              <button
                onClick={() => toggleTask(task)}
                className={`${styles.taskToggle} ${task.completed ? styles.taskToggleUndo : styles.taskToggleDone}`}
              >
                {task.completed ? <RotateCcw size={12} /> : <Check size={12} />}
                {task.completed ? 'Undo' : 'Done'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
