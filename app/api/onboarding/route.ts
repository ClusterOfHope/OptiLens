import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('optilens_uid')?.value
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please reconnect Meta.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { company_name, website, industry, budget_range, referral_source } = body

    if (!company_name || !website || !industry || !budget_range || !referral_source) {
      return NextResponse.json(
        { error: 'Please fill in all fields.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        company_name,
        website,
        industry,
        budget_range,
        referral_source,
        onboarded: true,
      })
      .eq('id', userId)

    if (error) {
      console.error('Onboarding update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Onboarding error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}