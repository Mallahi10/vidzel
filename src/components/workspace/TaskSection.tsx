'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';

/* =========================
   TYPES
========================= */
type Task = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
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
  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem('vidzel_tasks') || '[]'
    );

    const workspaceTasks = stored.filter(
      (task: Task) => task.workspaceId === workspaceId
    );

    setTasks(workspaceTasks);
  }, [workspaceId]);

  /* =========================
     CREATE TASK (ORG ONLY)
  ========================= */
  const createTask = () => {
    if (!user || user.role !== 'organization') return;
    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      workspaceId,
      title,
      description,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    const allTasks = JSON.parse(
      localStorage.getItem('vidzel_tasks') || '[]'
    );

    const updatedTasks = [...allTasks, newTask];

    localStorage.setItem(
      'vidzel_tasks',
      JSON.stringify(updatedTasks)
    );

    setTasks(
      updatedTasks.filter(
        (task: Task) => task.workspaceId === workspaceId
      )
    );

    setTitle('');
    setDescription('');
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

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: '0.75rem 0',
            borderBottom: '1px solid #eee',
          }}
        >
          <strong>{task.title}</strong>
          {task.description && <p>{task.description}</p>}
        </div>
      ))}
    </section>
  );
}
