import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get sync history
  const { data: syncs } = await supabaseAdmin
    .from('sync_history')
    .select('id, status, campaigns_synced, flags_detected, flags_resolved, error_message, duration_ms, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get flags via campaigns -> meta_accounts -> user
  const { data: metaAccounts } = await supabaseAdmin
    .from('meta_accounts')
    .select('id')
    .eq('user_id', userId)

  const metaAccountIds = (metaAccounts || []).map((m) => m.id)

  let flags: any[] = []
  if (metaAccountIds.length > 0) {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, name')
      .in('meta_account_id', metaAccountIds)

    const campaignMap = new Map((campaigns || []).map((c) => [c.id, c.name]))
    const campaignIds = (campaigns || []).map((c) => c.id)

    if (campaignIds.length > 0) {
      const { data: flagData } = await supabaseAdmin
        .from('waste_flags')
        .select('id, rule_id, severity, message, campaign_id, detected_at, resolved_at, is_active')
        .in('campaign_id', campaignIds)
        .order('detected_at', { ascending: false })
        .limit(100)

      flags = (flagData || []).map((f) => ({
        ...f,
        campaign_name: campaignMap.get(f.campaign_id) || 'Unknown',
      }))
    }
  }

  return NextResponse.json({
    syncs: syncs || [],
    flags,
  })
}