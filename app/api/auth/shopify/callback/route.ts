import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state') // user ID

  if (!code || !shop || !state) {
    return NextResponse.redirect(new URL('/shopify?error=missing_params', req.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    })

    const accessToken = tokenRes.data.access_token
    const scope = tokenRes.data.scope

    // Get shop info
    const shopRes = await axios.get(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    })
    const shopData = shopRes.data.shop

    // Save Shopify account
    const { data: savedAccount, error: saveErr } = await supabaseAdmin
      .from('shopify_accounts')
      .upsert({
        user_id: state,
        shop_domain: shop,
        access_token: accessToken,
        scope,
        shop_name: shopData.name,
        shop_email: shopData.email,
        currency: shopData.currency,
        is_active: true,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_domain' })
      .select()
      .single()

    if (saveErr || !savedAccount) {
      console.error('Shopify save error:', saveErr)
      return NextResponse.redirect(new URL('/shopify?error=save_failed', req.url))
    }

    // Initial sync of last 90 days of orders
    try {
      const since = new Date()
      since.setDate(since.getDate() - 90)
      const ordersRes = await axios.get(
        `https://${shop}/admin/api/2024-01/orders.json?status=any&created_at_min=${since.toISOString()}&limit=250`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
      )

      const orders = ordersRes.data.orders || []
      if (orders.length > 0) {
        const orderRows = orders.map((o: any) => ({
          shopify_account_id: savedAccount.id,
          order_id: o.id.toString(),
          order_number: o.order_number?.toString() || o.name,
          total_price: parseFloat(o.total_price || '0'),
          subtotal_price: parseFloat(o.subtotal_price || '0'),
          currency: o.currency,
          customer_email: o.email,
          customer_id: o.customer?.id?.toString(),
          utm_source: o.source_name || null,
          landing_page: o.landing_site,
          referring_site: o.referring_site,
          ordered_at: o.created_at,
        }))
        await supabaseAdmin.from('shopify_orders').upsert(orderRows, { onConflict: 'shopify_account_id,order_id' })
      }

      await supabaseAdmin
        .from('shopify_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', savedAccount.id)
    } catch (syncErr: any) {
      console.error('Shopify initial sync error:', syncErr.message)
    }

    return NextResponse.redirect(new URL('/shopify?connected=true', req.url))
  } catch (err: any) {
    console.error('Shopify OAuth error:', err.response?.data || err.message)
    return NextResponse.redirect(new URL('/shopify?error=oauth_failed', req.url))
  }
}