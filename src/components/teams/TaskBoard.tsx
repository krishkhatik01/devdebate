'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Sparkles } from 'lucide-react';
import type { Task, TaskStatus, TeamUser } from '@/lib/teams/types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: TeamUser;
  members: TeamUser[];
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onAIAutoCreate?: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

export default function TaskBoard({
  tasks,
  currentUser,
  members,
  onTaskCreate,
  onTaskDelete,
  onTaskMove,
  onAIAutoCreate,
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const task = tasks.find((t) => t.id === active.id);
      const newStatus = over.id as TaskStatus;

      if (task && COLUMNS.some((c) => c.id === newStatus)) {
        onTaskMove(task.id, newStatus);
      }
    }

    setActiveId(null);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    onTaskCreate({
      title: newTaskTitle,
      status: 'todo',
      createdBy: currentUser.userId,
    });

    setNewTaskTitle('');
    setIsCreating(false);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Task Board</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {tasks.length} tasks • {tasks.filter((t) => t.status === 'done').length} completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAIAutoCreate}
            className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Auto-Create
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* New Task Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Create New Task
            </h3>

            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              placeholder="Task title..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 transition-all"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-6 min-w-max">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);

              return (
                <div
                  key={column.id}
                  className="w-80 flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {column.title}
                      </h3>
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 p-3 space-y-2 min-h-[200px]">
                    <SortableContext
                      items={columnTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          members={members}
                          currentUser={currentUser}
                          onDelete={() => onTaskDelete(task.id)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              members={members}
              currentUser={currentUser}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
