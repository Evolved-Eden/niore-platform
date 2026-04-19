import { NextResponse } from "next/server";
import { runZuriBrain } from "@/lib/zuri/brain";

export async function POST(req: Request) {
  const body = await req.json();

  const reply = await runZuriBrain(body.message);

  return NextResponse.json({ reply });
}