import bossesData from "../../data/bosses.json";
import equipmentData from "../../data/equipment.json";
import opportunityData from "../../data/opportunity.json";
import relicsData from "../../data/relics.json";
import tilesData from "../../data/tiles.json";

export interface CatalogItem {
  id: string;
  name: string;
  artFile: string;
  tier?: string;
  type?: string;
  hp?: number;
  str?: number;
  dex?: number;
}

export interface OpportunityDef {
  id: string;
  name: string;
  effect: string;
}

export const BOSSES = bossesData as Record<string, CatalogItem[]>;
export const EQUIPMENT = equipmentData as Record<string, CatalogItem[]>;
export const RELICS = relicsData as CatalogItem[];
export const TILE_ACTIONS = tilesData as Record<string, string>;
export const OPPORTUNITY_DECK = opportunityData as OpportunityDef[];

export function allEquipment(): CatalogItem[] {
  return [...(EQUIPMENT.common ?? []), ...(EQUIPMENT.rare ?? []), ...(EQUIPMENT.epic ?? []), ...RELICS];
}

export function allBosses(): CatalogItem[] {
  return [...(BOSSES.common ?? []), ...(BOSSES.rare ?? []), ...(BOSSES.epic ?? []), ...(BOSSES.relic ?? [])];
}
