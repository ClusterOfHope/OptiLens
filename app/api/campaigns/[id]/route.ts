import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.cookies.get('optilens_uid')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const campaignId = params.id

  // Get campaign + verify it belongs to user
  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('id, name, objective, status, daily_budget, meta_account_id')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify ownership via meta_account
  const { data: account } = await supabaseAdmin
    .from('meta_accounts')
    .select('user_id')
    .eq('id', campaign.meta_account_id)
    .single()

  if (!account || account.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Get metrics
  const { data: metrics } = await supabaseAdmin
    .from('campaign_daily_metrics')
    .select('date, spend, impressions, clicks, ctr, cpm, purchases, purchase_value, roas, frequency')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: true })

  // Get flags
  const { data: flags } = await supabaseAdmin
    .from('waste_flags')
    .select('id, rule_id, severity, message, detected_at, is_active')
    .eq('campaign_id', campaignId)
    .order('detected_at', { ascending: false })

  return NextResponse.json({
    campaign: {
      ...campaign,
      metrics: metrics || [],
      flags: flags || [],
    }
  })
}