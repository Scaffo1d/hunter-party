"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BoardEdge,
  type BoardGraph,
  type BoardNode,
  type BossRarity,
  type LabelColor,
  type PathLayer,
  type StartingSeat,
  type ThemeQuadrant,
  type TileType,
  type TraceMode,
  createEmptyBoardGraph,
  defaultLabelColor,
  LABEL_COLOR_HEX,
  TILE_TYPE_CONFIGS,
  validateBoardGraph,
} from "@hunter-party/game-engine";

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `n${nodeCounter}`;
}

const THEMES: { value: ThemeQuadrant; label: string }[] = [
  { value: "tundra", label: "Frozen Tundra" },
  { value: "volcano", label: "Fiery Volcano" },
  { value: "ocean", label: "Ocean" },
  { value: "mountains", label: "Rocky Mountains" },
];

const BOARD_W = 1821;
const BOARD_H = 2354;
const DEFAULT_TILE_PX = 36;

function clientToNormalized(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const { x, y } = pt.matrixTransform(ctm.inverse());
  return {
    x: Math.min(1, Math.max(0, x / BOARD_W)),
    y: Math.min(1, Math.max(0, y / BOARD_H)),
  };
}

function tilePixelSize(node: BoardNode): number {
  return (node.tileSize ?? DEFAULT_TILE_PX / BOARD_W) * BOARD_W;
}

export default function BoardTraceTool() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph, setGraph] = useState<BoardGraph>(createEmptyBoardGraph);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const pendingPointerRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
  } | null>(null);
  const didDragRef = useRef(false);
  const connectFromRef = useRef<string | null>(null);
  const [mode, setMode] = useState<TraceMode>("place");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [sequence, setSequence] = useState(1);

  const [tileType, setTileType] = useState<TileType>("O");
  const [bossRarity, setBossRarity] = useState<BossRarity>("common");
  const [pathLayer, setPathLayer] = useState<PathLayer>("outer");
  const [theme, setTheme] = useState<ThemeQuadrant>("tundra");
  const [labelColor, setLabelColor] = useState<LabelColor>("green");
  const [isCrossroad, setIsCrossroad] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const validation = useMemo(() => validateBoardGraph(graph), [graph]);
  const selectedNode = graph.nodes.find((n) => n.id === selectedId) ?? null;

  const updateTileType = (t: TileType) => {
    setTileType(t);
    setLabelColor(defaultLabelColor(t, t === "B" ? bossRarity : null));
  };

  const updateBossRarity = (r: BossRarity) => {
    setBossRarity(r);
    if (tileType === "B") setLabelColor(defaultLabelColor("B", r));
  };

  const placeNode = useCallback(
    (x: number, y: number) => {
      const isStart = ["S1", "S2", "S3", "S4"].includes(tileType);
      const node: BoardNode = {
        id: nextNodeId(),
        tileType,
        bossRarity: tileType === "B" ? bossRarity : null,
        pathLayer,
        theme,
        labelColor: tileType === "B" ? defaultLabelColor("B", bossRarity) : labelColor,
        isCrossroad,
        isStarting: isStart ? (tileType as StartingSeat) : null,
        x,
        y,
        sequence,
        tileSize: DEFAULT_TILE_PX / BOARD_W,
      };
      setGraph((g) => ({ ...g, nodes: [...g.nodes, node] }));
      setSequence((s) => s + 1);
      setSelectedId(node.id);
    },
    [tileType, bossRarity, pathLayer, theme, labelColor, isCrossroad, sequence],
  );

  const moveNode = useCallback((nodeId: string, x: number, y: number) => {
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));
  }, []);

  const handleConnectClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const from = connectFromRef.current;
    if (!from) {
      connectFromRef.current = nodeId;
      setConnectFrom(nodeId);
      setSelectedId(nodeId);
      return;
    }
    if (from === nodeId) {
      connectFromRef.current = null;
      setConnectFrom(null);
      return;
    }
    setGraph((g) => {
      const exists = g.edges.some(
        (edge) =>
          (edge.from === from && edge.to === nodeId) ||
          (edge.from === nodeId && edge.to === from),
      );
      if (exists) return g;
      return {
        ...g,
        edges: [...g.edges, { from, to: nodeId, bidirectional: true }],
      };
    });
    connectFromRef.current = null;
    setConnectFrom(null);
    setSelectedId(nodeId);
  };

  useEffect(() => {
    if (mode === "connect") return;

    const DRAG_THRESHOLD_PX = 5;

    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingPointerRef.current;
      if (!pending && !draggingNodeId) return;

      if (pending && !draggingNodeId) {
        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
        if (dist >= DRAG_THRESHOLD_PX) {
          didDragRef.current = true;
          setDraggingNodeId(pending.nodeId);
        }
        return;
      }

      if (draggingNodeId) {
        const svg = svgRef.current;
        if (!svg) return;
        const { x, y } = clientToNormalized(svg, e.clientX, e.clientY);
        moveNode(draggingNodeId, x, y);
      }
    };

    const onPointerUp = () => {
      const pending = pendingPointerRef.current;
      if (pending && !didDragRef.current && mode === "select") {
        setSelectedId(pending.nodeId);
      }
      pendingPointerRef.current = null;
      didDragRef.current = false;
      setDraggingNodeId(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingNodeId, moveNode, mode]);

  const startNodePointer = (e: React.PointerEvent, nodeId: string) => {
    if (mode === "connect") return;
    e.stopPropagation();
    pendingPointerRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
    };
    didDragRef.current = false;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setSelectedId(nodeId);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId || didDragRef.current) return;

    const svg = e.currentTarget;
    const { x, y } = clientToNormalized(svg, e.clientX, e.clientY);

    if (mode === "place") {
      placeNode(x, y);
    }
  };

  const updateSelectedNode = (patch: Partial<BoardNode>) => {
    if (!selectedId) return;
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)),
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.filter((n) => n.id !== selectedId),
      edges: g.edges.filter((e) => e.from !== selectedId && e.to !== selectedId),
    }));
    setSelectedId(null);
    setConnectFrom(null);
  };

  const deleteEdge = (from: string, to: string) => {
    setGraph((g) => ({
      ...g,
      edges: g.edges.filter((e) => !(e.from === from && e.to === to)),
    }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "board.graph.json";
    a.click();
    URL.revokeObjectURL(url);
  };


  const importFromSketch = async () => {
    if (graph.nodes.length > 0 && !confirm("Replace current board with sketch import?")) return;
    try {
      const res = await fetch("/board-sketch-import.json");
      if (!res.ok) throw new Error("missing import file");
      const data = (await res.json()) as BoardGraph;
      if (!data.nodes?.length) {
        alert(
          "board-sketch-import.json is empty. Run: npm run generate:board-import",
        );
        return;
      }
      setGraph(data);
      const maxSeq = Math.max(0, ...data.nodes.map((n) => n.sequence));
      setSequence(maxSeq + 1);
      nodeCounter = data.nodes.length;
      connectFromRef.current = null;
      setConnectFrom(null);
      setSelectedId(null);
      setMode("select");
      const needsLabel = data.meta.needsLabelCount ?? 0;
      setImportStatus(
        `Imported ${data.nodes.length} tiles, ${data.edges.length} edges` +
          (needsLabel ? ` (${needsLabel} may need label fixes)` : ""),
      );
    } catch {
      alert("Could not load board-sketch-import.json. Run: npm run generate:board-import");
    }
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BoardGraph;
        setGraph(data);
        const maxSeq = Math.max(0, ...data.nodes.map((n) => n.sequence));
        setSequence(maxSeq + 1);
        nodeCounter = data.nodes.length;
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-zinc-800 p-3 text-sm">
        <h1 className="text-lg font-bold">Board Trace Tool</h1>
        <p className="text-xs text-zinc-400">Import square tiles from sketch, fix any misread labels, drag to adjust. Connect mode fixes missing edges.</p>
        {importStatus && (
          <p className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-300">{importStatus}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {(["place", "connect", "select"] as TraceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); connectFromRef.current = null; setConnectFrom(null); }}
              className={`rounded px-2 py-1 capitalize ${mode === m ? "bg-blue-600" : "bg-zinc-800"}`}
            >
              {m}
            </button>
          ))}
        </div>

        {connectFrom && (
          <p className="rounded bg-amber-900/50 px-2 py-1 text-xs">Connecting from {connectFrom} — click target node</p>
        )}

        <div>
          <p className="mb-1 font-semibold">Tile type</p>
          <div className="flex flex-wrap gap-1">
            {TILE_TYPE_CONFIGS.map((c) => (
              <button
                key={c.tileType}
                type="button"
                title={c.description}
                onClick={() => updateTileType(c.tileType)}
                className={`rounded px-1.5 py-0.5 text-xs font-mono ${tileType === c.tileType ? "ring-2 ring-white" : ""}`}
                style={{ backgroundColor: LABEL_COLOR_HEX[c.labelColor], color: c.labelColor === "white" ? "#111" : "#111" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {tileType === "B" && (
          <div>
            <p className="mb-1 font-semibold">Boss rarity</p>
            <select
              className="w-full rounded bg-zinc-800 p-1"
              value={bossRarity}
              onChange={(e) => updateBossRarity(e.target.value as BossRarity)}
            >
              <option value="common">Common (grey)</option>
              <option value="rare">Rare (blue)</option>
              <option value="epic">Epic (red)</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400">Path layer</span>
            <select className="rounded bg-zinc-800 p-1" value={pathLayer} onChange={(e) => setPathLayer(e.target.value as PathLayer)}>
              <option value="outer">Outer</option>
              <option value="inner">Inner</option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400">Theme</span>
            <select className="rounded bg-zinc-800 p-1" value={theme} onChange={(e) => setTheme(e.target.value as ThemeQuadrant)}>
              {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isCrossroad} onChange={(e) => setIsCrossroad(e.target.checked)} />
          <span>Crossroad</span>
        </label>

        {selectedNode && (
          <div className="rounded border border-zinc-700 p-2">
            <p className="font-semibold">Selected: {selectedNode.id}</p>
            <p className="text-xs text-zinc-400">{selectedNode.tileType} · seq {selectedNode.sequence}</p>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selectedNode.isCrossroad}
                onChange={(e) => updateSelectedNode({ isCrossroad: e.target.checked })}
              />
              Crossroad
            </label>
            <button type="button" onClick={deleteSelected} className="mt-2 w-full rounded bg-red-800 py-1 text-xs">Delete node</button>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-zinc-800 pt-3">
          <button type="button" onClick={importFromSketch} className="rounded bg-blue-700 py-2 font-semibold">Import tiles from sketch</button>
          <button type="button" onClick={exportJson} className="rounded bg-green-700 py-2 font-semibold">Export JSON</button>
          <label className="cursor-pointer rounded bg-zinc-800 py-2 text-center">
            Import JSON
            <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <button
            type="button"
            onClick={() => { if (confirm("Clear all nodes and edges?")) { setGraph(createEmptyBoardGraph()); setSelectedId(null); connectFromRef.current = null; setConnectFrom(null); setSequence(1); }}}
            className="rounded bg-zinc-800 py-1 text-xs text-zinc-400"
          >
            Clear all
          </button>
        </div>
      </aside>

      <main ref={containerRef} className="relative min-w-0 flex-1 bg-black">
        <svg
          ref={svgRef}
          className={`h-full w-full ${draggingNodeId ? "cursor-grabbing" : mode === "place" ? "cursor-crosshair" : "cursor-default"}`}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleCanvasClick}
        >
          <image href="/board-sketch.png" x="0" y="0" width={BOARD_W} height={BOARD_H} />
          {graph.edges.map((edge) => {
            const a = graph.nodes.find((n) => n.id === edge.from);
            const b = graph.nodes.find((n) => n.id === edge.to);
            if (!a || !b) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={a.x * BOARD_W} y1={a.y * BOARD_H} x2={b.x * BOARD_W} y2={b.y * BOARD_H}
                stroke="#fbbf24" strokeWidth={4} strokeOpacity={0.9}
              />
            );
          })}
          {graph.nodes.map((node) => {
            const hex = LABEL_COLOR_HEX[node.labelColor];
            const isSel = node.id === selectedId || node.id === connectFrom;
            const label = node.tileType.length <= 2 ? node.tileType : node.tileType;
            const isDragging = draggingNodeId === node.id;
            const px = node.x * BOARD_W;
            const py = node.y * BOARD_H;
            const size = tilePixelSize(node);
            const half = size / 2;
            const textFill = node.labelColor === "white" ? "#111" : "#111";
            return (
              <g key={node.id}>
                <rect
                  x={px - half} y={py - half}
                  width={size} height={size}
                  fill="transparent"
                  className={mode === "connect" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
                  onPointerDown={(e) => startNodePointer(e, node.id)}
                  onClick={(e) => {
                    if (mode === "connect") handleConnectClick(e, node.id);
                    else if (mode === "select") {
                      e.stopPropagation();
                      setSelectedId(node.id);
                    }
                  }}
                />
                <rect
                  x={px - half} y={py - half}
                  width={size} height={size}
                  fill={hex}
                  fillOpacity={isSel || isDragging ? 0.95 : 0.82}
                  stroke={isSel || isDragging ? "#fff" : "#111"}
                  strokeWidth={isSel || isDragging ? 3 : 1.5}
                  rx={2}
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={px} y={py}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={label.length > 2 ? 11 : 14}
                  fill={textFill}
                  fontWeight="bold"
                  style={{ pointerEvents: "none", fontFamily: "monospace" }}
                >
                  {label}
                </text>
                <text
                  x={px} y={py + half + 10}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#a1a1aa"
                  style={{ pointerEvents: "none" }}
                >
                  {node.sequence}
                </text>
              </g>
            );
          })}
        </svg>
      </main>

      <aside className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto border-l border-zinc-800 p-3 text-sm">
        <h2 className="font-semibold">Validation</h2>
        {validation.warnings.length === 0 ? (
          <p className="text-xs text-green-400">No warnings</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {validation.warnings.map((w, i) => (
              <li key={i} className="text-amber-300">{w.message}</li>
            ))}
          </ul>
        )}

        <h2 className="mt-2 font-semibold">Counts</h2>
        <ul className="font-mono text-xs text-zinc-400">
          {Object.entries(validation.counts).sort().map(([k, v]) => (
            <li key={k}>{k}: {v}</li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500">Nodes: {graph.nodes.length} · Edges: {graph.edges.length}</p>

        <h2 className="mt-2 font-semibold">Edges</h2>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
          {graph.edges.map((e) => (
            <li key={`${e.from}-${e.to}`} className="flex justify-between gap-1">
              <span>{e.from} ↔ {e.to}</span>
              <button type="button" className="text-red-400" onClick={() => deleteEdge(e.from, e.to)}>×</button>
            </li>
          ))}
        </ul>

        <h2 className="mt-2 font-semibold">Nodes</h2>
        <ul className="max-h-60 space-y-0.5 overflow-y-auto font-mono text-xs">
          {graph.nodes
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full text-left ${selectedId === n.id ? "text-white" : "text-zinc-400"}`}
                  onClick={() => { setSelectedId(n.id); setMode("select"); }}
                >
                  {n.sequence}. {n.tileType} ({n.id})
                </button>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}
