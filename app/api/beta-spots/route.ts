import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 60

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('beta_spots_remaining')
      .select('spots_left')
      .single()
    return NextResponse.json({ spots_left: data?.spots_left ?? 47 })
  } catch {
    return NextResponse.json({ spots_left: 47 })
  }
}