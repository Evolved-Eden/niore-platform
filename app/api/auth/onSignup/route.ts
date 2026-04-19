import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No user" },
      { status: 401 }
    );
  }

  // 1. Create Org
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: "My Intelligence",
      owner_id: user.id,
    })
    .select()
    .single();

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  // 2. Create Intelligence
  const { data: intelligence, error: intelError } = await supabase
    .from("intelligences")
    .insert({
      org_id: org.id,
      name: "Core Intelligence",
      type: "personal",
    })
    .select()
    .single();

  if (intelError) {
    return NextResponse.json({ error: intelError.message }, { status: 500 });
  }

  // 3. Create Zuri Agent
  const { error: agentError } = await supabase.from("agents").insert({
    org_id: org.id,
    name: "Zuri",
    role: "orchestrator",
    is_active: true,
  });

  if (agentError) {
    return NextResponse.json({ error: agentError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    org,
    intelligence,
  });
}