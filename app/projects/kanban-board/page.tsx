"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useEffect, useRef, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  column: "todo" | "inprogress" | "done";
}

type ColumnId = Task["column"];

const COLUMNS: { id: ColumnId; label: string; color: string; bg: string; border: string }[] = [
  { id: "todo", label: "To Do", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40" },
  { id: "inprogress", label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40" },
  { id: "done", label: "Done", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/40" },
];

const STORAGE_KEY = "rnrvibe-kanban-tasks";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: generateId(), title: "Design landing page", description: "Create wireframes and mockups", column: "todo" },
    { id: generateId(), title: "Set up project repo", description: "", column: "todo" },
    { id: generateId(), title: "Build auth flow", description: "OAuth + email/password", column: "inprogress" },
    { id: generateId(), title: "Write API docs", description: "Document all endpoints", column: "done" },
  ];
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

/* ── Inline-editable text ─────────────────────────────────── */
function EditableText({
  value,
  onChange,
  placeholder,
  className,
  isTitle,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  isTitle?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`cursor-pointer rounded px-1 -mx-1 hover:bg-neutral-700/50 transition ${className ?? ""}`}
      >
        {value || <span className="text-neutral-600 italic">{placeholder}</span>}
      </div>
    );
  }

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (isTitle && !trimmed) return; // title cannot be empty
    onChange(trimmed);
  };

  if (isTitle) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-full bg-neutral-800 border border-neutral-600 rounded px-1 -mx-1 outline-none focus:border-purple-500 ${className ?? ""}`}
      />
    );
  }

  return (
    <textarea
      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false);
      }}
      rows={2}
      className={`w-full bg-neutral-800 border border-neutral-600 rounded px-1 -mx-1 outline-none resize-none focus:border-purple-500 ${className ?? ""}`}
    />
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function KanbanBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<ColumnId | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTask = (column: ColumnId) => {
    const title = newTitle.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: generateId(), title, description: newDesc.trim(), column }]);
    setNewTitle("");
    setNewDesc("");
    setAddingTo(null);
  };

  /* drag handlers */
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Make the ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDragId(null);
    setDropTarget(null);
  };

  const onDragOver = (e: React.DragEvent, column: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(column);
  };

  const onDragLeave = (e: React.DragEvent, column: ColumnId) => {
    // Only clear if actually leaving the column area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDropTarget(null);
    }
  };

  const onDrop = (e: React.DragEvent, column: ColumnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      updateTask(id, { column });
    }
    setDropTarget(null);
    setDragId(null);
  };

  const tasksFor = (col: ColumnId) => tasks.filter((t) => t.column === col);

  const prompt = `Build a Kanban Board in React with:
- Three columns: To Do, In Progress, Done
- Add tasks with title and optional description
- Drag and drop tasks between columns (HTML5 API, no libs)
- Edit task title/description inline by clicking
- Delete tasks with a button
- Task count per column
- Color-coded column headers (purple, yellow, green)
- All data persisted in localStorage
- Dark theme with smooth drag animations`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Kanban Board</h1>
        <p className="mb-8 text-neutral-400">A drag-and-drop task board built with vibecoding in ~12 minutes.</p>

        {/* Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {COLUMNS.map((col) => {
            const colTasks = tasksFor(col.id);
            const isOver = dropTarget === col.id && dragId !== null;
            return (
              <div
                key={col.id}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={(e) => onDragLeave(e, col.id)}
                onDrop={(e) => onDrop(e, col.id)}
                className={`rounded-2xl border bg-neutral-900 p-4 flex flex-col transition-all duration-200 ${
                  isOver ? `${col.border} bg-neutral-800/60 scale-[1.01]` : "border-neutral-800"
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${col.bg} border ${col.border}`} />
                    <h2 className={`font-semibold ${col.color}`}>{col.label}</h2>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-2 min-h-[120px]">
                  {mounted &&
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onDragEnd={onDragEnd}
                        className={`group rounded-xl border border-neutral-700 bg-neutral-800 p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-neutral-600 ${
                          dragId === task.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <EditableText
                            value={task.title}
                            onChange={(v) => updateTask(task.id, { title: v })}
                            placeholder="Task title"
                            className="text-sm font-medium text-neutral-100 flex-1"
                            isTitle
                          />
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all text-sm leading-none mt-0.5 shrink-0"
                            title="Delete task"
                          >
                            &times;
                          </button>
                        </div>
                        <EditableText
                          value={task.description}
                          onChange={(v) => updateTask(task.id, { description: v })}
                          placeholder="Add description..."
                          className="text-xs text-neutral-400 mt-1"
                        />
                      </div>
                    ))}

                  {/* Drop zone hint */}
                  {isOver && (
                    <div className={`rounded-xl border-2 border-dashed ${col.border} p-3 text-center text-xs ${col.color} opacity-60`}>
                      Drop here
                    </div>
                  )}
                </div>

                {/* Add task */}
                {addingTo === col.id ? (
                  <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-800 p-3 space-y-2">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask(col.id);
                        if (e.key === "Escape") {
                          setAddingTo(null);
                          setNewTitle("");
                          setNewDesc("");
                        }
                      }}
                      placeholder="Task title"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-500 placeholder-neutral-600"
                    />
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-500 placeholder-neutral-600 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addTask(col.id)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddingTo(null);
                          setNewTitle("");
                          setNewDesc("");
                        }}
                        className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingTo(col.id);
                      setNewTitle("");
                      setNewDesc("");
                    }}
                    className="mt-3 w-full rounded-xl border border-dashed border-neutral-700 hover:border-neutral-500 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition"
                  >
                    + Add task
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Prompt */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">{prompt}</pre>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Copy prompt
            </button>
            <a href="/tools/project-starter" className="text-sm text-neutral-500 hover:text-white transition">
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
