// /app/api/scan/confirm-build/[id]/route.ts
import { NextResponse } from "next/server";
import { triggerBuild, getScanRun } from "@/lib/scanStore";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const resolved = await params;
    const id = resolved?.id;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const run = getScanRun(id);
    if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });

    const updated = triggerBuild(id);
    return NextResponse.json({
      success: true,
      buildStatus: updated?.buildStatus ?? "queued",
    });
  } catch (err: any) {
    console.error("POST /api/scan/confirm-build error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
