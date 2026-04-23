"use client";

import BlogNav from "@/components/BlogNav";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
}

const STORAGE_KEY = "rnrvibe-mind-map";
const CANVAS_W = 1200;
const CANVAS_H = 700;
const NODE_W = 140;
const NODE_H = 48;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultNodes(): Node[] {
  const root: Node = { id: generateId(), text: "Central idea", x: CANVAS_W / 2, y: CANVAS_H / 2, parentId: null };
  const a: Node = { id: generateId(), text: "Branch A", x: root.x - 280, y: root.y - 80, parentId: root.id };
  const b: Node = { id: generateId(), text: "Branch B", x: root.x + 280, y: root.y - 80, parentId: root.id };
  const c: Node = { id: generateId(), text: "Branch C", x: root.x, y: root.y + 180, parentId: root.id };
  return [root, a, b, c];
}

export default function MindMapPage() {
  const [nodes, setNodes, mounted] = useLocalStorageState<Node[]>(STORAGE_KEY, defaultNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number; moved: boolean } | null>(null);

  const nodeById = useMemo(() => {
    const m = new Map<string, Node>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const svgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  }, []);

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
    if (editingId) return;
    e.stopPropagation();
    const n = nodeById.get(id);
    if (!n) return;
    const { x, y } = svgPoint(e.clientX, e.clientY);
    dragState.current = { id, offsetX: x - n.x, offsetY: y - n.y, moved: false };
    setSelectedId(id);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const nx = Math.min(CANVAS_W - NODE_W / 2, Math.max(NODE_W / 2, x - ds.offsetX));
      const ny = Math.min(CANVAS_H - NODE_H / 2, Math.max(NODE_H / 2, y - ds.offsetY));
      setNodes((prev) => prev.map((n) => (n.id === ds.id ? { ...n, x: nx, y: ny } : n)));
      ds.moved = true;
    };
    const onUp = () => {
      dragState.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [svgPoint, setNodes]);

  const addChild = (parentId: string) => {
    const parent = nodeById.get(parentId);
    if (!parent) return;
    const siblings = nodes.filter((n) => n.parentId === parentId);
    const angle = (siblings.length * 2 * Math.PI) / 6;
    const distance = 180;
    const nx = Math.min(CANVAS_W - NODE_W / 2, Math.max(NODE_W / 2, parent.x + Math.cos(angle) * distance));
    const ny = Math.min(CANVAS_H - NODE_H / 2, Math.max(NODE_H / 2, parent.y + Math.sin(angle) * distance));
    const newNode: Node = { id: generateId(), text: "New node", x: nx, y: ny, parentId };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
    setEditingId(newNode.id);
    setDraftText(newNode.text);
  };

  const deleteNode = (id: string) => {
    const target = nodeById.get(id);
    if (!target) return;
    if (target.parentId === null) return; // cannot delete root
    const doomed = new Set<string>();
    const walk = (nid: string) => {
      doomed.add(nid);
      for (const n of nodes) if (n.parentId === nid) walk(n.id);
    };
    walk(id);
    setNodes((prev) => prev.filter((n) => !doomed.has(n.id)));
    setSelectedId(null);
  };

  const startEdit = (id: string) => {
    const n = nodeById.get(id);
    if (!n) return;
    setSelectedId(id);
    setEditingId(id);
    setDraftText(n.text);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = draftText.trim() || "Untitled";
    setNodes((prev) => prev.map((n) => (n.id === editingId ? { ...n, text: trimmed } : n)));
    setEditingId(null);
  };

  const resetMap = () => {
    if (!confirm("Reset the mind map to the default starter tree?")) return;
    setNodes(defaultNodes());
    setSelectedId(null);
    setEditingId(null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mind-map.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSvgClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setSelectedId(null);
    }
  };

  const prompt = `Build a Mind Map in React with:
- SVG-based canvas with a root node and branching children
- Nodes are draggable via mousedown/mousemove with the svg's coordinate system, clamped to the canvas bounds
- Click a node to select it; buttons appear to add a child or delete the node (except root)
- Double-click to rename a node inline; Enter or blur commits, Escape cancels
- Curved SVG paths connect each node to its parent
- Selection highlights the node with a purple ring
- Persist the node tree to localStorage on every change
- Export the tree as a pretty-printed JSON file via a Blob download
- Reset button restores a default starter tree
- Dark theme with purple accents`;

  const connections = nodes.filter((n) => n.parentId && nodeById.has(n.parentId));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Mind Map</h1>
        <p className="mb-6 text-neutral-400">
          Interactive SVG node graph with drag, branch, and rename. Built with vibecoding in ~15 minutes.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={exportJson}
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:border-neutral-500 transition"
          >
            Export JSON
          </button>
          <button
            onClick={resetMap}
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:border-red-500/60 hover:text-red-300 transition"
          >
            Reset map
          </button>
          <div className="ml-auto text-xs text-neutral-500 self-center">
            Click a node to select · Drag to reposition · Double-click to rename
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-[600px] block cursor-default"
            onClick={onSvgClick}
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Connections */}
            {connections.map((n) => {
              const parent = nodeById.get(n.parentId!)!;
              const midX = (parent.x + n.x) / 2;
              const d = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${n.y}, ${n.x} ${n.y}`;
              return <path key={`edge-${n.id}`} d={d} stroke="#6b21a8" strokeWidth={2} fill="none" opacity={0.7} />;
            })}

            {/* Nodes */}
            {mounted &&
              nodes.map((n) => {
                const isSelected = selectedId === n.id;
                const isRoot = n.parentId === null;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x - NODE_W / 2}, ${n.y - NODE_H / 2})`}
                    onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const ds = dragState.current;
                      if (ds && ds.moved) return;
                      setSelectedId(n.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEdit(n.id);
                    }}
                    style={{ cursor: editingId === n.id ? "text" : "grab" }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={isRoot ? "#581c87" : "#1f1f1f"}
                      stroke={isSelected ? "#a855f7" : isRoot ? "#a855f7" : "#3f3f3f"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {editingId === n.id ? (
                      <foreignObject x={4} y={4} width={NODE_W - 8} height={NODE_H - 8}>
                        <input
                          autoFocus
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full h-full bg-transparent text-white text-sm text-center outline-none border border-purple-500 rounded"
                        />
                      </foreignObject>
                    ) : (
                      <text
                        x={NODE_W / 2}
                        y={NODE_H / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={13}
                        fontWeight={isRoot ? 600 : 500}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {n.text.length > 18 ? `${n.text.slice(0, 17)}…` : n.text}
                      </text>
                    )}

                    {isSelected && editingId !== n.id && (
                      <g transform={`translate(${NODE_W + 6}, 0)`}>
                        <g
                          onClick={(e) => {
                            e.stopPropagation();
                            addChild(n.id);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <rect width={22} height={22} rx={11} fill="#7e22ce" />
                          <text
                            x={11}
                            y={11}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fff"
                            fontSize={16}
                            fontWeight={600}
                            style={{ pointerEvents: "none", userSelect: "none" }}
                          >
                            +
                          </text>
                        </g>
                        {!isRoot && (
                          <g
                            transform="translate(0, 26)"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNode(n.id);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <rect width={22} height={22} rx={11} fill="#b91c1c" />
                            <text
                              x={11}
                              y={11}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#fff"
                              fontSize={14}
                              fontWeight={600}
                              style={{ pointerEvents: "none", userSelect: "none" }}
                            >
                              ×
                            </text>
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
          </svg>
        </div>

        {/* Prompt */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">
            {prompt}
          </pre>
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
