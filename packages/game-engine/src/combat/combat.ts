export interface Combatant {
  dex: number;
  int: number;
  str: number;
  arm: number;
  hp: number;
}

export interface CombatResult {
  attackerHits: boolean;
  damage: number;
  defenderHp: number;
  log: string[];
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollDie(sides: 4 | 6 | 10 | 12): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function resolveAttack(
  attacker: Combatant,
  defender: Combatant,
  useMagic = false,
  damageDie: 4 | 6 | 10 | 12 = 6,
): CombatResult {
  const atkRoll = rollD20();
  const defRoll = rollD20();
  const atkStat = useMagic ? attacker.int : attacker.dex;
  const defStat = defender.dex;
  const hits = atkRoll + atkStat >= defRoll + defStat;
  const log = [`Attack ${atkRoll}+${atkStat} vs ${defRoll}+${defStat}`];

  if (!hits) {
    return { attackerHits: false, damage: 0, defenderHp: defender.hp, log: [...log, "Miss"] };
  }

  const raw = rollDie(damageDie) + (useMagic ? attacker.int : attacker.str);
  const damage = Math.max(0, raw - defender.arm);
  const defenderHp = Math.max(0, defender.hp - damage);
  log.push(`Hit for ${damage} damage`);
  return { attackerHits: true, damage, defenderHp, log };
}

export function bossBounty(tier: "common" | "rare" | "relic"): number {
  if (tier === "relic") return 3;
  if (tier === "rare") return 2;
  return 1;
}
