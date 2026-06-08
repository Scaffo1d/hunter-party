#!/usr/bin/env python3
"""Copy and normalize art assets into apps/web/public/assets."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "AI Generated Art"
DEST = ROOT / "apps/web/public/assets"

RENAME_MAP = {
    "Cloviss": "Clovis",
    "Turin's Desciple": "Turin's Disciple",
    "Silver Discount .jpg": "Silver Discount.jpg",
}

SKIP_DIRS = {"Card Backs"}


def main() -> None:
    if not SRC.exists():
        print(f"Art source not found: {SRC}")
        return

    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    count = 0
    for path in SRC.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue

        rel = path.relative_to(SRC)
        name = str(rel.name)
        for old, new in RENAME_MAP.items():
            name = name.replace(old, new)
        out = DEST / rel.parent / name
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, out)
        count += 1

    print(f"Copied {count} assets to {DEST}")


if __name__ == "__main__":
    main()
