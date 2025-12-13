// /app/api/scan/start/route.ts
import { NextResponse } from "next/server";
import { createScanRun } from "@lib/scanStore"; 

type Body = {
  repoUrl?: string;
  buildAfterScan?: boolean;
  dockerUsername?: string;
  dockerAccessToken?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.repoUrl) {
      return NextResponse.json({ error: "repoUrl required" }, { status: 400 });
    }

    // NOTE: we do not store tokens in this mock. In production, save secrets securely.
    const run = createScanRun({
      repoUrl: body.repoUrl,
      buildAfterScan: !!body.buildAfterScan,
    });

    return NextResponse.json({ scanId: run.id, status: run.status });
  } catch (err) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
