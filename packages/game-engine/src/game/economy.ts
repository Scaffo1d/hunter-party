import type { PlayerCurrencies } from "./types";

export const CURRENCY_PICK_UNITS = 3;

export const VALID_CURRENCY_PICKS: Array<Partial<PlayerCurrencies>> = [
  { S: 3 },
  { C: 3 },
  { S: 1, LL: 1 },
  { C: 1, LL: 1 },
];

export function canAfford(currencies: PlayerCurrencies, cost: Partial<PlayerCurrencies>): boolean {
  return (Object.keys(cost) as Array<keyof PlayerCurrencies>).every(
    (k) => currencies[k] >= (cost[k] ?? 0),
  );
}

export function pay(currencies: PlayerCurrencies, cost: Partial<PlayerCurrencies>): PlayerCurrencies {
  const next = { ...currencies };
  for (const k of Object.keys(cost) as Array<keyof PlayerCurrencies>) {
    next[k] -= cost[k] ?? 0;
  }
  return next;
}

export function addCurrency(
  currencies: PlayerCurrencies,
  gain: Partial<PlayerCurrencies>,
): PlayerCurrencies {
  const next = { ...currencies };
  for (const k of Object.keys(gain) as Array<keyof PlayerCurrencies>) {
    next[k] += gain[k] ?? 0;
  }
  return next;
}
