import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 60

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('savings_totals')
      .select('total_identified, total_saved, brand_count')
      .single()

    if (error || !data) {
      return NextResponse.json({ identified: 0, saved: 0, brands: 0 })
    }

    return NextResponse.json({
      identified: Math.round(Number(data.total_identified) || 0),
      saved: Math.round(Number(data.total_saved) || 0),
      brands: Number(data.brand_count) || 0,
    })
  } catch {
    return NextResponse.json({ identified: 0, saved: 0, brands: 0 })
  }
}