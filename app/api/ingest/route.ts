import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runWasteRules } from '@/lib/rules'
import axios from 'axios'

const BASE_URL = 'https://graph.facebook.com/v19.0'

async function getCampaigns(adAccountId: string, accessToken: string) {
  const res = await axios.get(`${BASE_URL}/${adAccountId}/campaigns`, {
    params: {
      access_token: accessToken,
      fields: 'id,name,status,objective,daily_budget,lifetime_budget',
      limit: 100,
    },
  })
  return res.data.data
}

async function getCampaignInsights(campaignId: string, accessToken: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const until = new Date().toISOString().split('T')[0]

  const res = await axios.get(`${BASE_URL}/${campaignId}/insights`, {
    params: {
      access_token: accessToken,
      fields: 'spend,impressions,reach,frequency,clicks,ctr,cpm,actions,action_values,date_start',
      time_increment: 1,
      time_range: JSON.stringify({ since, until }),
      limit: 100,
    },
  })
  return res.data.data || []
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = req.cookies.get('optilens_uid')?.value

    let adAccountId = body.ad_account_id
    let accessToken = body.access_token
    let metaAccountId: string | undefined

    // If no token in body, look up from user's saved Meta account
    if (!accessToken) {
      let query = supabaseAdmin
        .from('meta_accounts')
        .select('id, ad_account_id, access_token')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: savedAccount, error: fetchError } = await query.single()

      if (fetchError || !savedAccount) {
        adAccountId = adAccountId || process.env.META_AD_ACCOUNT_ID
        accessToken = process.env.META_ACCESS_TOKEN
      } else {
        adAccountId = adAccountId || savedAccount.ad_account_id
        accessToken = savedAccount.access_token
        metaAccountId = savedAccount.id
      }
    }

    if (!adAccountId || !accessToken) {
      return NextResponse.json(
        { error: 'No Meta account connected. Please connect via OAuth.' },
        { status: 400 }
      )
    }

    if (!metaAccountId) {
      const { data: metaAccount } = await supabaseAdmin
        .from('meta_accounts')
        .select('id')
        .eq('ad_account_id', adAccountId)
        .single()
      metaAccountId = metaAccount?.id
    }

    const campaigns = await getCampaigns(adAccountId, accessToken)

    let synced = 0
    let flagsDetected = 0

    for (const campaign of campaigns) {
      const { data: savedCampaign } = await supabaseAdmin
        .from('campaigns')
        .upsert({
          campaign_id: campaign.id,
          meta_account_id: metaAccountId,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget: campaign.daily_budget ? campaign.daily_budget / 100 : null,
          lifetime_budget: campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'campaign_id' })
        .select()
        .single()

      if (!savedCampaign) continue

      const insights = await getCampaignInsights(campaign.id, accessToken)

      const metricsToInsert = insights.map((insight: any) => {
        const purchases = insight.actions?.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        )?.value || 0
        const purchaseValue = insight.action_values?.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        )?.value || 0
        const spend = parseFloat(insight.spend || '0')
        const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0

        return {
          campaign_id: savedCampaign.id,
          date: insight.date_start,
          spend,
          impressions: parseInt(insight.impressions || '0'),
          reach: parseInt(insight.reach || '0'),
          frequency: parseFloat(insight.frequency || '0'),
          clicks: parseInt(insight.clicks || '0'),
          ctr: parseFloat(insight.ctr || '0'),
          cpm: parseFloat(insight.cpm || '0'),
          purchases: parseInt(purchases),
          purchase_value: parseFloat(purchaseValue),
          roas,
        }
      })

      if (metricsToInsert.length > 0) {
        await supabaseAdmin
          .from('campaign_daily_metrics')
          .upsert(metricsToInsert, { onConflict: 'campaign_id,date' })
      }

      const { data: metrics } = await supabaseAdmin
        .from('campaign_daily_metrics')
        .select('*')
        .eq('campaign_id', savedCampaign.id)
        .order('date', { ascending: true })

      if (metrics && metrics.length > 0) {
        await supabaseAdmin
          .from('waste_flags')
          .update({ is_active: false, resolved_at: new Date().toISOString() })
          .eq('campaign_id', savedCampaign.id)
          .eq('is_active', true)

        const flags = runWasteRules(savedCampaign.id, metrics)
        if (flags.length > 0) {
          await supabaseAdmin.from('waste_flags').insert(flags)
          flagsDetected += flags.length
        }
      }

      synced++
    }

    return NextResponse.json({
      success: true,
      campaigns_synced: synced,
      flags_detected: flagsDetected,
      message: `Synced ${synced} campaigns · ${flagsDetected} flags detected`,
    })
  } catch (error: any) {
    console.error('Ingest error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: error.response?.data?.error?.message || error.message },
      { status: 500 }
    )
  }
}