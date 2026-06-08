import { notFound } from "next/navigation";
import BoardTraceTool from "@/components/board-trace/BoardTraceTool";

export const metadata = {
  title: "Board Trace Tool — Hunter Party",
};

function isBoardTraceEnabled(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_ENABLE_BOARD_TRACE === "true";
}

export default function BoardTracePage() {
  if (!isBoardTraceEnabled()) {
    notFound();
  }
  return <BoardTraceTool />;
}
