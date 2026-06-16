import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('archetypes')
      .select('*')
      .order('numeric_id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ archetypes: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('archetypes')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, archetype: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
