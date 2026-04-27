import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get connected Shopify account
  const { data: account } = await supabaseAdmin
    .from('shopify_accounts')
    .select('id, shop_domain, shop_name, shop_email, currency, is_active, connected_at, last_sync_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (!account) {
    return NextResponse.json({ account: null, attribution: null })
  }

  // Calculate attribution comparison (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Meta attributed revenue (from campaign_daily_metrics)
  const { data: metaAccounts } = await supabaseAdmin
    .from('meta_accounts')
    .select('id')
    .eq('user_id', userId)

  const metaAccountIds = (metaAccounts || []).map((m) => m.id)

  let metaRevenue = 0
  let metaOrders = 0

  if (metaAccountIds.length > 0) {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .in('meta_account_id', metaAccountIds)

    const campaignIds = (campaigns || []).map((c) => c.id)

    if (campaignIds.length > 0) {
      const { data: metrics } = await supabaseAdmin
        .from('campaign_daily_metrics')
        .select('purchase_value, purchases')
        .in('campaign_id', campaignIds)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      metaRevenue = (metrics || []).reduce((s, m) => s + (m.purchase_value || 0), 0)
      metaOrders = (metrics || []).reduce((s, m) => s + (m.purchases || 0), 0)
    }
  }

  // Shopify actual revenue
  const { data: orders } = await supabaseAdmin
    .from('shopify_orders')
    .select('total_price, utm_source')
    .eq('shopify_account_id', account.id)
    .gte('ordered_at', thirtyDaysAgo.toISOString())

  const shopifyRevenue = (orders || []).reduce((s, o) => s + (o.total_price || 0), 0)
  const shopifyOrders = (orders || []).length
  const metaUtmOrders = (orders || []).filter((o) =>
    o.utm_source?.toLowerCase().includes('facebook') ||
    o.utm_source?.toLowerCase().includes('meta') ||
    o.utm_source?.toLowerCase().includes('instagram')
  ).length

  const overAttribution = shopifyRevenue > 0
    ? ((metaRevenue - shopifyRevenue) / shopifyRevenue) * 100
    : 0

  const matchRate = shopifyOrders > 0 ? (metaUtmOrders / shopifyOrders) * 100 : 0

  return NextResponse.json({
    account,
    attribution: {
      meta_attributed_revenue: metaRevenue,
      shopify_actual_revenue: shopifyRevenue,
      meta_attributed_orders: metaOrders,
      shopify_actual_orders: shopifyOrders,
      match_rate: matchRate,
      over_attribution_pct: Math.max(0, overAttribution),
    }
  })
}