import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('verticals')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ verticals: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('verticals')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, vertical: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
