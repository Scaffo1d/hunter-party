import LobbyForm from "@/components/game/LobbyForm";

const PHASES = [
  { name: "Opportunity", desc: "Play or skip opportunity cards" },
  { name: "Shop", desc: "Buy equipment from the shop" },
  { name: "Dice", desc: "Roll and move along the board" },
  { name: "Tile", desc: "Resolve the tile you land on" },
  { name: "Equip", desc: "Manage gear, then end your turn" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-10">
        <header className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-500">Online multiplayer</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Hunter Party</h1>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Race around the board, fight bosses, collect loot, and outplay your friends — up to 4 players in one room.
          </p>
        </header>

        <section className="mx-auto w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-center text-lg font-semibold">Play now</h2>
          <LobbyForm />
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-center text-xl font-semibold">How to play</h2>
          <ol className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
            <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm">
              <span className="font-semibold text-amber-400">1. Create or join</span>
              <p className="mt-1 text-zinc-400">Host creates a room and shares the 6-letter code. Up to 4 players.</p>
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm">
              <span className="font-semibold text-amber-400">2. Start the game</span>
              <p className="mt-1 text-zinc-400">The host starts when at least 2 players are in the room.</p>
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm sm:col-span-2">
              <span className="font-semibold text-amber-400">3. Take turns</span>
              <p className="mt-1 text-zinc-400">Each turn cycles through five phases:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {PHASES.map((p) => (
                  <li
                    key={p.name}
                    className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                    title={p.desc}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm sm:col-span-2">
              <span className="font-semibold text-amber-400">4. Win the hunt</span>
              <p className="mt-1 text-zinc-400">
                Collect gold, gear, and bounty counters. Challenge bosses, dodge the Taxman, and use opportunity cards to
                gain the edge.
              </p>
            </li>
          </ol>
        </section>

        <footer className="mt-auto pt-12 text-center text-xs text-zinc-600">
          Built for the Hunter Party board game · v1 online
        </footer>
      </div>
    </main>
  );
}
