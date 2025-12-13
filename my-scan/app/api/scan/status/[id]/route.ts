// /app/api/scan/status/[id]/route.ts
import { NextResponse } from "next/server";
import { getScanRun } from "@/lib/scanStore";

export async function GET(req: Request, { params }: { params: any }) {
  try {
    // params may be a Promise in some Next.js envs — await to unwrap
    const resolved = await params;
    const id = resolved?.id;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const run = getScanRun(id);
    if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json(run);
  } catch (err: any) {
    console.error("GET /api/scan/status error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
