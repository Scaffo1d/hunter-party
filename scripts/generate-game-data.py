#!/usr/bin/env python3
"""Generate game data JSON from art filenames."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "AI Generated Art" / "Bosses, Equipments, Tiles and O"
OUT = ROOT / "packages" / "game-engine" / "data"

RENAME = {
    "Cloviss": "Clovis",
    "Turin's Desciple": "Turin's Disciple",
    "Silver Discount .jpg": "Silver Discount.jpg",
}


def slug(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "item"


def normalize(name: str) -> str:
    for old, new in RENAME.items():
        name = name.replace(old, new)
    return name


def scan_folder(folder: str, tier: str, default_hp: int) -> list[dict]:
    path = ART / folder
    if not path.exists():
        return []
    items = []
    for f in sorted(path.glob("*")):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        name = normalize(f.stem)
        items.append({
            "id": slug(name),
            "name": name,
            "artFile": normalize(f.name),
            "tier": tier,
            "hp": default_hp,
            "str": 10,
            "dex": 10,
        })
    return items


def scan_equipment(folder: str, tier: str) -> list[dict]:
    path = ART / folder
    if not path.exists():
        return []
    items = []
    for f in sorted(path.glob("*")):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        name = normalize(f.stem)
        slot = "weapon"
        lower = name.lower()
        if "armor" in lower or "mail" in lower or "plate" in lower:
            slot = "armor"
        elif "boot" in lower or "shoe" in lower:
            slot = "boots"
        elif "charm" in lower or "ring" in lower or "amulet" in lower:
            slot = "charm"
        items.append({
            "id": slug(name),
            "name": name,
            "type": slot,
            "tier": tier,
            "artFile": normalize(f.name),
        })
    return items


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    bosses = {
        "common": scan_folder("Common Bosses", "common", 12),
        "rare": scan_folder("Rare Bosses", "rare", 18),
        "epic": scan_folder("Epic Bosses", "epic", 24),
        "relic": scan_folder("Relic Bosses", "relic", 30),
    }
    (OUT / "bosses.json").write_text(json.dumps(bosses, indent=2) + "\n")

    equipment = {
        "common": scan_equipment("Common Equipment", "common"),
        "rare": scan_equipment("Rare Equipment", "rare"),
        "epic": scan_equipment("Epic Equipment", "epic"),
    }
    relics = scan_equipment("Relic Equipment", "relic")
    (OUT / "equipment.json").write_text(json.dumps(equipment, indent=2) + "\n")
    (OUT / "relics.json").write_text(json.dumps(relics, indent=2) + "\n")

    tiles = {
        "O": "Draw 1 opportunity card",
        "B": "Challenge boss on tile",
        "R": "Challenge relic boss",
        "MD": "Gain Magic Dice counter",
        "TP": "Teleport to chosen tile",
        "H": "Heal 3 HP",
        "E": "Exchange currencies",
        "C": "Cave exploration",
        "CA": "Casino bet",
        "GA": "Grand Auction",
        "KF": "King's Favor (+1 MD)",
        "T": "Pay tax (up to 2G)",
        "L": "Loot +1G",
    }
    (OUT / "tiles.json").write_text(json.dumps(tiles, indent=2) + "\n")

    opportunity = [
        {"id": "copper-discount", "name": "Shop Coupon (Copper)", "effect": "shop_discount_copper"},
        {"id": "silver-discount", "name": "Shop Coupon (Silver)", "effect": "shop_discount_silver"},
        {"id": "lapis-discount", "name": "Shop Coupon (Lapis Lazuli)", "effect": "shop_discount_ll"},
        {"id": "freeze", "name": "Freeze", "effect": "freeze_opponent"},
        {"id": "hired-thief", "name": "Hired Thief", "effect": "steal_oc"},
        {"id": "locker-room", "name": "Locker Room Chaos", "effect": "swap_equipment"},
        {"id": "grand-auction-oc", "name": "Grand Auction", "effect": "auction"},
        {"id": "teleport-magician", "name": "Teleport Magician", "effect": "teleport"},
        {"id": "broken-bridges", "name": "Broken Bridges", "effect": "block_path"},
        {"id": "pre-purchase", "name": "Pre-Purchase", "effect": "pre_purchase"},
        {"id": "hard-bargainer", "name": "Hard Bargainer", "effect": "hard_bargain"},
        {"id": "casino-oc", "name": "Casino", "effect": "casino"},
        {"id": "tax-refund", "name": "Tax Refund", "effect": "tax_refund"},
    ]
    (OUT / "opportunity.json").write_text(json.dumps(opportunity, indent=2) + "\n")

    total_bosses = sum(len(v) for v in bosses.values())
    total_equip = sum(len(v) for v in equipment.values()) + len(relics)
    print(f"Wrote bosses.json ({total_bosses}), equipment.json ({total_equip}), relics, tiles, opportunity")


if __name__ == "__main__":
    main()
