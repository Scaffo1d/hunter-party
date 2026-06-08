import RoomPanel from "@/components/game/RoomPanel";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <RoomPanel code={code.toUpperCase()} />
    </main>
  );
}
