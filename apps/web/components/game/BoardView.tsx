"use client";

import type { BoardGraph, GameState } from "@hunter-party/game-engine";
import { LABEL_COLOR_HEX } from "@hunter-party/game-engine";

const BOARD_W = 1821;
const BOARD_H = 2354;

export default function BoardView({
  graph,
  game,
}: {
  graph: BoardGraph;
  game: GameState;
}) {
  const playerByNode = new Map(game.players.map((p) => [p.nodeId, p]));

  return (
    <div className="relative h-full w-full bg-black">
      <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <image href="/board-sketch.png" width={BOARD_W} height={BOARD_H} />
        {graph.edges.map((edge) => {
          const a = graph.nodes.find((n) => n.id === edge.from);
          const b = graph.nodes.find((n) => n.id === edge.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={a.x * BOARD_W}
              y1={a.y * BOARD_H}
              x2={b.x * BOARD_W}
              y2={b.y * BOARD_H}
              stroke="#fbbf24"
              strokeWidth={3}
              opacity={0.7}
            />
          );
        })}
        {graph.nodes.map((node) => {
          const px = node.x * BOARD_W;
          const py = node.y * BOARD_H;
          const size = (node.tileSize ?? 36 / BOARD_W) * BOARD_W;
          const half = size / 2;
          const occupant = playerByNode.get(node.id);
          return (
            <g key={node.id}>
              <rect
                x={px - half}
                y={py - half}
                width={size}
                height={size}
                fill={LABEL_COLOR_HEX[node.labelColor]}
                fillOpacity={0.85}
                stroke="#111"
                strokeWidth={1.5}
                rx={2}
              />
              <text
                x={px}
                y={py}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
                fill="#111"
              >
                {node.tileType}
              </text>
              {occupant && (
                <circle cx={px} cy={py + half + 8} r={6} fill={occupant.color} stroke="#fff" strokeWidth={1} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
