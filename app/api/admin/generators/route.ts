import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, count, error } = await supabaseAdmin
      .from('agent_generators')
      .select('*', { count: 'exact' })
      .order('generator_id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ generators: data || [], count: count ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json();
    const { data, error } = await supabaseAdmin
      .from('agent_generators')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, generator_id: data?.generator_id || body.generator_id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
