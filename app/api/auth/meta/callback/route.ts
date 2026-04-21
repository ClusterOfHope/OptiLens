import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // User denied permission
  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?error=meta_denied', req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?error=no_code', req.url)
    )
  }

  try {
    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    // Step 1: Exchange code for short-lived token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    })

    const shortLivedToken = tokenRes.data.access_token

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      },
    })

    const longLivedToken = longTokenRes.data.access_token

    // Step 3: Get user's ad accounts
    const adAccountsRes = await axios.get('https://graph.facebook.com/v19.0/me/adaccounts', {
      params: {
        access_token: longLivedToken,
        fields: 'id,name,account_status,currency,spend_cap',
        limit: 10,
      },
    })

    const adAccounts = adAccountsRes.data.data

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_ad_accounts', req.url)
      )
    }

    // Step 4: Save each ad account to Supabase
    for (const account of adAccounts) {
      await supabaseAdmin
        .from('meta_accounts')
        .upsert({
          ad_account_id: account.id,
          access_token: longLivedToken,
          account_name: account.name,
          account_status: account.account_status,
          currency: account.currency,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ad_account_id' })
    }

    // Step 5: Trigger initial data sync
    const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/ingest`
    await axios.post(syncUrl, { ad_account_id: adAccounts[0].id, access_token: longLivedToken })
      .catch(() => {}) // Don't block redirect if sync fails

    return NextResponse.redirect(
      new URL('/dashboard?connected=true', req.url)
    )
  } catch (err: any) {
    console.error('Meta OAuth error:', err.response?.data || err.message)
    return NextResponse.redirect(
      new URL('/dashboard?error=oauth_failed', req.url)
    )
  }
}