import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value

  if (!userId) {
    return NextResponse.json({ user: null })
  }

  try {
    // Fetch user
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url, company_name, subscription_status, onboarded')
      .eq('id', userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ user: null })
    }

    // Fetch campaigns (linked via meta_accounts.user_id)
    const { data: metaAccounts } = await supabaseAdmin
      .from('meta_accounts')
      .select('id')
      .eq('user_id', user.id)

    const metaAccountIds = (metaAccounts || []).map((m) => m.id)

    let campaigns: any[] = []
    let trend: number[] = []

    if (metaAccountIds.length > 0) {
      const { data: campaignsData } = await supabaseAdmin
        .from('campaigns')
        .select('id, campaign_id, name, objective, status, daily_budget')
        .in('meta_account_id', metaAccountIds)

      if (campaignsData && campaignsData.length > 0) {
        // For each campaign, aggregate metrics from last 30 days
        for (const c of campaignsData) {
          const { data: metrics } = await supabaseAdmin
            .from('campaign_daily_metrics')
            .select('spend, purchase_value, roas, date')
            .eq('campaign_id', c.id)
            .order('date', { ascending: true })
            .limit(30)

          const spend = (metrics || []).reduce((s, m) => s + (m.spend || 0), 0)
          const revenue = (metrics || []).reduce((s, m) => s + (m.purchase_value || 0), 0)
          const roas = spend > 0 ? revenue / spend : 0

          // Health classification
          let health: 'healthy' | 'warning' | 'critical' = 'healthy'
          let waste_score = 0
          let recommendation = ''
          if (revenue === 0 && spend > 100) {
            health = 'critical'
            waste_score = 10
            recommendation = 'ZERO CONVERSIONS'
          } else if (roas < 1) {
            health = 'critical'
            waste_score = 9
            recommendation = 'BELOW BREAK-EVEN'
          } else if (roas < 1.5) {
            health = 'warning'
            waste_score = 7
            recommendation = 'HIGH WASTE'
          } else if (roas >= 2.5) {
            health = 'healthy'
            waste_score = 0
            recommendation = 'SCALE UP'
          } else {
            health = 'healthy'
            waste_score = 2
            recommendation = 'HEALTHY'
          }

          campaigns.push({
            id: c.id,
            name: c.name,
            objective: c.objective || '—',
            status: c.status || 'ACTIVE',
            spend,
            revenue,
            roas,
            waste_score,
            health,
            recommendation,
          })
        }

        // Build 30-day trend (sum of waste-flagged daily spend)
        const flaggedCampaignIds = campaigns
          .filter((c) => c.health !== 'healthy')
          .map((c) => c.id)

        if (flaggedCampaignIds.length > 0) {
          const { data: trendMetrics } = await supabaseAdmin
            .from('campaign_daily_metrics')
            .select('date, spend')
            .in('campaign_id', flaggedCampaignIds)
            .order('date', { ascending: true })

          // Group by date
          const byDate = new Map<string, number>()
          ;(trendMetrics || []).forEach((m) => {
            byDate.set(m.date, (byDate.get(m.date) || 0) + (m.spend || 0))
          })
          trend = Array.from(byDate.values()).slice(-30)
        }
      }
    }

    return NextResponse.json({
      user,
      campaigns,
      trend,
    })
  } catch (err: any) {
    console.error('/api/me error:', err.message)
    return NextResponse.json({ user: null, error: err.message })
  }
}