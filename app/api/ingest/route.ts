import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMetaCampaigns, getMetaCampaignInsights } from '@/lib/meta'
import { runWasteRules } from '@/lib/rules'

export async function POST() {
  try {
    const campaigns = await getMetaCampaigns()

    for (const campaign of campaigns) {
      // 1. Upsert campaign
      const { data: savedCampaign } = await supabaseAdmin
        .from('campaigns')
        .upsert({
          campaign_id: campaign.id,
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

      // 2. Pull insights
      const insights = await getMetaCampaignInsights(campaign.id)

      const metricsToInsert = insights.map((insight: any) => {
        const purchases = insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
        const purchaseValue = insight.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0
        const spend = parseFloat(insight.spend || '0')
        const roas = spend > 0 ? purchaseValue / spend : 0

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

      // 3. Run waste rules
      const { data: metrics } = await supabaseAdmin
        .from('campaign_daily_metrics')
        .select('*')
        .eq('campaign_id', savedCampaign.id)
        .order('date', { ascending: true })

      if (metrics && metrics.length > 0) {
        // Clear old flags
        await supabaseAdmin
          .from('waste_flags')
          .update({ is_active: false })
          .eq('campaign_id', savedCampaign.id)

        const flags = runWasteRules(savedCampaign.id, metrics)
        if (flags.length > 0) {
          await supabaseAdmin.from('waste_flags').insert(flags)
        }
      }
    }

    return NextResponse.json({ success: true, message: `Ingested ${campaigns.length} campaigns` })
  } catch (error: any) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}