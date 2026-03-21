import { NextRequest, NextResponse } from "next/server";
import { checkGpt4oStatus, checkFluxKontextStatus } from "@/lib/kie-ai";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  const engine = req.nextUrl.searchParams.get("engine") as
    | "gpt4o"
    | "flux-kontext";

  if (!taskId || !engine) {
    return NextResponse.json(
      { error: "Missing taskId or engine" },
      { status: 400 }
    );
  }

  try {
    const result =
      engine === "gpt4o"
        ? await checkGpt4oStatus(taskId)
        : await checkFluxKontextStatus(taskId);

    return NextResponse.json({ taskId, ...result });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json(
      { taskId, status: "failed", error: "Failed to check status" },
      { status: 500 }
    );
  }
}
