import GameScreen from "@/components/game/GameScreen";

export default async function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GameScreen code={code.toUpperCase()} />;
}
