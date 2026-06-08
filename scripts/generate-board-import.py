#!/usr/bin/env python3
"""Generate board-sketch-import.json from Board.pdf (square tiles with embedded labels)."""

from __future__ import annotations

import json
import re
import shutil
from math import hypot
from pathlib import Path

import cv2
import fitz
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Board.pdf"
RENDER_4X = ROOT / "board_sketch_render_4x.png"
PUBLIC_SKETCH = ROOT / "apps/web/public/board-sketch.png"
OUT_JSON = ROOT / "apps/web/public/board-sketch-import.json"
BOARD_GRAPH = ROOT / "packages/game-engine/data/board.graph.json"
PREVIEW = ROOT / "board_import_preview.png"
LABELED_PREVIEW = ROOT / "board_tiles_labeled_preview.png"

BOARD_W = 1821
BOARD_H = 2354
DEFAULT_TILE_PX = 36

TILE_PATTERN = re.compile(
    r"^(O|B|R|MD|TP|H|E|C|CA|GA|KF|T|L|S[1-4])$",
    re.IGNORECASE,
)

START_ANCHORS: dict[str, tuple[float, float]] = {
    "S1": (0.454, 0.122),
    "S2": (0.225, 0.454),
    "S3": (0.536, 0.828),
    "S4": (0.722, 0.483),
}


def render_pdf() -> tuple[int, int]:
    if not PDF.exists():
        raise FileNotFoundError(PDF)
    doc = fitz.open(PDF)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(4, 4))
    pix.save(str(RENDER_4X))
    shutil.copy(RENDER_4X, PUBLIC_SKETCH)
    print(f"Rendered {RENDER_4X} ({pix.width}x{pix.height})")
    return pix.width, pix.height


def pdf_rgb_to_label_color(r: int, g: int, b: int, tile_type: str) -> str:
    if tile_type in ("S1", "S2", "S3", "S4"):
        return "blue"
    if tile_type == "O":
        return "green"
    if tile_type == "MD":
        return "pink"
    if tile_type in ("E", "C", "L"):
        return "red"
    if tile_type in ("GA", "KF"):
        return "orange"
    if tile_type == "R":
        return "yellow"
    if tile_type in ("TP", "H"):
        return "blue"
    if tile_type == "CA":
        return "green"
    if tile_type == "T":
        return "white"

    # Boss tiles — color encodes rarity in the sketch
    if tile_type == "B":
        if r > 200 and g > 180 and b > 180:
            return "red"
        if b > 180 and r > 150:
            return "blue"
        return "grey"

    if g > 180 and r < 100 and b < 100:
        return "green"
    if r > 200 and g < 120:
        return "red"
    if b > 200:
        return "blue"
    if g > 150 and r > 150 and b < 120:
        return "orange"
    if r > 200 and g > 180 and b > 200:
        return "pink"
    return "white"


def boss_rarity_for(tile_type: str, label_color: str) -> str | None:
    if tile_type != "B":
        return None
    if label_color == "red":
        return "epic"
    if label_color == "blue":
        return "rare"
    return "common"


def extract_tiles_from_pdf() -> list[dict]:
    doc = fitz.open(PDF)
    page = doc[0]
    pw, ph = page.rect.width, page.rect.height

    raw: list[dict] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip().upper()
                if not TILE_PATTERN.match(text):
                    continue
                x0, y0, x1, y1 = span["bbox"]
                cx = (x0 + x1) / 2 / pw
                cy = (y0 + y1) / 2 / ph
                color_int = span.get("color", 0)
                r = (color_int >> 16) & 255
                g = (color_int >> 8) & 255
                b = color_int & 255
                tile_type = text
                label_color = pdf_rgb_to_label_color(r, g, b, tile_type)
                raw.append({
                    "tileType": tile_type,
                    "x": cx,
                    "y": cy,
                    "labelColor": label_color,
                    "bossRarity": boss_rarity_for(tile_type, label_color),
                    "bbox_w": (x1 - x0) / pw,
                    "bbox_h": (y1 - y0) / ph,
                })

    # Drop duplicates at same position (keep first)
    merged: list[dict] = []
    for item in sorted(raw, key=lambda t: (t["y"], t["x"])):
        for m in merged:
            if (
                hypot(item["x"] - m["x"], item["y"] - m["y"]) < 0.02
                and item["tileType"] == m["tileType"]
            ):
                break
        else:
            merged.append(item)

    return merged


def fix_start_seats(tiles: list[dict]) -> None:
    """PDF may label S4 as S3 — reassign the four starts by anchor proximity."""
    seat_tiles: list[int] = []
    for i, t in enumerate(tiles):
        if t["tileType"] in ("S1", "S2", "S3", "S4"):
            seat_tiles.append(i)

    if len(seat_tiles) >= 4:
        used: set[int] = set()
        for seat, (ax, ay) in START_ANCHORS.items():
            best_i = -1
            best_d = 1e9
            for i in seat_tiles:
                if i in used:
                    continue
                d = hypot(tiles[i]["x"] - ax, tiles[i]["y"] - ay)
                if d < best_d:
                    best_d = d
                    best_i = i
            if best_i >= 0:
                used.add(best_i)
                tiles[best_i]["tileType"] = seat
                tiles[best_i]["labelColor"] = "blue"
                tiles[best_i]["bossRarity"] = None
                tiles[best_i]["isStarting"] = seat
        return

    used: set[int] = set()
    for seat, (ax, ay) in START_ANCHORS.items():
        best_i = -1
        best_d = 1e9
        for i, t in enumerate(tiles):
            if i in used:
                continue
            d = hypot(t["x"] - ax, t["y"] - ay)
            if d < best_d:
                best_d = d
                best_i = i
        if best_i >= 0:
            used.add(best_i)
            tiles[best_i]["tileType"] = seat
            tiles[best_i]["labelColor"] = "blue"
            tiles[best_i]["bossRarity"] = None
            tiles[best_i]["isStarting"] = seat


def tile_half_px(t: dict, w: int, h: int) -> float:
    return max(DEFAULT_TILE_PX // 2 + 4, max(t["bbox_w"] * w, t["bbox_h"] * h) * 1.1)


def connector_endpoint(
    ax: float, ay: float, bx: float, by: float, half: float
) -> tuple[float, float]:
    seg = hypot(bx - ax, by - ay)
    if seg < 1:
        return ax, ay
    ux, uy = (bx - ax) / seg, (by - ay) / seg
    return ax + ux * half, ay + uy * half


def connector_white_ratio(
    ax: float,
    ay: float,
    bx: float,
    by: float,
    half_a: float,
    half_b: float,
    path_mask: np.ndarray,
) -> float:
    """Fraction of white path along connector from tile A edge to tile B edge."""
    h, w = path_mask.shape
    ex1, ey1 = connector_endpoint(ax, ay, bx, by, half_a)
    ex2, ey2 = connector_endpoint(bx, by, ax, ay, half_b)
    n = max(int(hypot(ex2 - ex1, ey2 - ey1)), 1)
    ok = 0
    for s in range(n + 1):
        t = s / n
        x = int(ex1 + (ex2 - ex1) * t)
        y = int(ey1 + (ey2 - ey1) * t)
        if 0 <= x < w and 0 <= y < h and path_mask[y, x]:
            ok += 1
    return ok / n


def tile_between_centers(
    ax: float,
    ay: float,
    bx: float,
    by: float,
    centers: list[tuple[float, float]],
    skip: set[int],
    radius: float = 20,
) -> bool:
    seg = hypot(bx - ax, by - ay)
    if seg < 20:
        return False
    for j, (cx, cy) in enumerate(centers):
        if j in skip:
            continue
        t = ((cx - ax) * (bx - ax) + (cy - ay) * (by - ay)) / (seg * seg)
        if 0.08 < t < 0.92:
            if hypot(cx - (ax + t * (bx - ax)), cy - (ay + t * (by - ay))) < radius:
                return True
    return False


def infer_edges(tiles: list[dict], ids: list[str]) -> list[dict]:
    """
    One edge per white connector between two tiles.
    Samples the white path between tile edges (not through tile interiors).
    """
    img = cv2.imread(str(RENDER_4X))
    if img is None:
        return []
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, bright = cv2.threshold(gray, 195, 255, cv2.THRESH_BINARY)
    path_mask = cv2.dilate(bright, np.ones((7, 7), np.uint8), iterations=2) > 0

    centers = [(t["x"] * w, t["y"] * h) for t in tiles]
    halves = [tile_half_px(t, w, h) for t in tiles]
    n_tiles = len(tiles)

    min_dist = 45
    max_dist = 185
    min_ratio = 0.38

    edges_idx: set[tuple[int, int]] = set()

    for i in range(n_tiles):
        ax, ay = centers[i]
        for j in range(i + 1, n_tiles):
            bx, by = centers[j]
            d = hypot(ax - bx, ay - by)
            if d < min_dist or d > max_dist:
                continue
            ratio = connector_white_ratio(
                ax, ay, bx, by, halves[i], halves[j], path_mask
            )
            if ratio < min_ratio:
                continue
            if tile_between_centers(ax, ay, bx, by, centers, {i, j}):
                continue
            edges_idx.add((i, j))

    # Connect remaining orphans to nearest white-linked neighbor
    def degree(idx: int) -> int:
        return sum(1 for a, b in edges_idx if idx in (a, b))

    for pass_idx in range(6):
        for i in range(n_tiles):
            if degree(i) > 0:
                continue
            ax, ay = centers[i]
            best_j = -1
            best_d = 1e9
            min_r = 0.22 if pass_idx < 3 else 0.12
            check_between = pass_idx < 4
            for j in range(n_tiles):
                if i == j:
                    continue
                bx, by = centers[j]
                d = hypot(ax - bx, ay - by)
                if d > max_dist + 20:
                    continue
                ratio = connector_white_ratio(
                    ax, ay, bx, by, halves[i], halves[j], path_mask
                )
                if ratio < min_r:
                    continue
                if check_between and tile_between_centers(
                    ax, ay, bx, by, centers, {i, j}
                ):
                    continue
                if d < best_d:
                    best_d = d
                    best_j = j
            if best_j >= 0:
                edges_idx.add(tuple(sorted((i, best_j))))

    id_by_idx = {i: ids[i] for i in range(n_tiles)}
    return [
        {"from": id_by_idx[a], "to": id_by_idx[b], "bidirectional": True}
        for a, b in sorted(edges_idx)
    ]


def mark_crossroads(nodes: list[dict], edges: list[dict]) -> None:
    degree: dict[str, int] = {}
    for e in edges:
        degree[e["from"]] = degree.get(e["from"], 0) + 1
        degree[e["to"]] = degree.get(e["to"], 0) + 1
    for node in nodes:
        if degree.get(node["id"], 0) >= 3:
            node["isCrossroad"] = True


def theme_for(nx: float, ny: float) -> str:
    if ny < 0.5 and nx < 0.5:
        return "tundra"
    if ny < 0.5 and nx >= 0.5:
        return "volcano"
    if ny >= 0.5 and nx < 0.5:
        return "ocean"
    return "mountains"


def main() -> None:
    render_pdf()
    img = cv2.imread(str(RENDER_4X))
    if img is None:
        raise RuntimeError(f"Could not read {RENDER_4X}")
    h, w = img.shape[:2]

    tiles = extract_tiles_from_pdf()
    tiles.sort(key=lambda t: (t["y"], t["x"]))
    fix_start_seats(tiles)

    nodes: list[dict] = []
    ids: list[str] = []
    for i, t in enumerate(tiles, start=1):
        nid = f"n{i}"
        ids.append(nid)
        tile_px = max(DEFAULT_TILE_PX, int(max(t["bbox_w"] * w, t["bbox_h"] * h) * 2.2))
        is_start = t.get("isStarting")
        nodes.append({
            "id": nid,
            "x": round(t["x"], 6),
            "y": round(t["y"], 6),
            "tileType": t["tileType"],
            "bossRarity": t["bossRarity"],
            "pathLayer": "outer",
            "theme": theme_for(t["x"], t["y"]),
            "labelColor": t["labelColor"],
            "isCrossroad": False,
            "isStarting": is_start,
            "sequence": i,
            "tileSize": round(tile_px / w, 6),
        })

    edges = infer_edges(tiles, ids)
    mark_crossroads(nodes, edges)

    data = {
        "version": 1,
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "cutLine": {"from": "S1", "to": "S3"},
            "importedFromSketch": True,
            "importSource": "pdf-text-layer",
            "needsLabelCount": 0,
            "tilePixelSize": DEFAULT_TILE_PX,
        },
    }
    OUT_JSON.write_text(json.dumps(data, indent=2))
    BOARD_GRAPH.parent.mkdir(parents=True, exist_ok=True)
    BOARD_GRAPH.write_text(json.dumps(data, indent=2))

    color_map = {
        "green": (34, 197, 94),
        "grey": (156, 163, 175),
        "blue": (59, 130, 246),
        "red": (239, 68, 68),
        "pink": (217, 70, 239),
        "orange": (249, 115, 22),
        "white": (248, 250, 252),
        "yellow": (234, 179, 8),
    }

    dbg = img.copy()
    labeled = img.copy()
    for node in nodes:
        px, py = int(node["x"] * w), int(node["y"] * h)
        half = max(DEFAULT_TILE_PX // 2, int(node["tileSize"] * w / 2))
        cv2.rectangle(dbg, (px - half, py - half), (px + half, py + half), (0, 255, 0), 1)
        bgr = color_map.get(node["labelColor"], (200, 200, 200))
        cv2.rectangle(labeled, (px - half, py - half), (px + half, py + half), bgr, -1)
        cv2.rectangle(labeled, (px - half, py - half), (px + half, py + half), (0, 0, 0), 1)
        cv2.putText(
            labeled, node["tileType"],
            (px - half + 2, py + 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1, cv2.LINE_AA,
        )
    for edge in edges:
        a = next(n for n in nodes if n["id"] == edge["from"])
        b = next(n for n in nodes if n["id"] == edge["to"])
        cv2.line(
            dbg,
            (int(a["x"] * w), int(a["y"] * h)),
            (int(b["x"] * w), int(b["y"] * h)),
            (0, 255, 255), 1,
        )
    cv2.imwrite(str(PREVIEW), dbg)
    cv2.imwrite(str(LABELED_PREVIEW), labeled)

    from collections import Counter
    counts = Counter(n["tileType"] for n in nodes)
    print(f"nodes: {len(nodes)}")
    print(f"edges: {len(edges)}")
    print(f"tile counts: {dict(counts)}")
    print(f"wrote {OUT_JSON}")
    print(f"wrote {PREVIEW}")
    print(f"wrote {LABELED_PREVIEW}")


if __name__ == "__main__":
    main()
