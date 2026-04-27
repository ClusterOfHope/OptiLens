import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/?error=meta_denied', req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', req.url))
  }

  try {
    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    // 1. Exchange code for short-lived token
    const tokenRes = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    )
    const shortLivedToken = tokenRes.data.access_token

    // 2. Exchange for long-lived (60-day) token
    const longTokenRes = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
      }
    )
    const longLivedToken = longTokenRes.data.access_token

    // 3. Fetch user profile
    const profileRes = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: longLivedToken,
        fields: 'id,name,email,picture.type(large)',
      },
    })
    const profile = profileRes.data
    const facebookId = profile.id
    const name = profile.name || ''
    const email = profile.email || null
    const avatarUrl = profile?.picture?.data?.url || null

    // 4. Upsert user
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          facebook_id: facebookId,
          name,
          email,
          avatar_url: avatarUrl,
          last_login_at: new Date().toISOString(),
        },
        { onConflict: 'facebook_id' }
      )
      .select()
      .single()

    if (userErr || !user) {
      console.error('User upsert failed:', userErr)
      return NextResponse.redirect(new URL('/?error=user_save_failed', req.url))
    }

    // 5. Fetch ad accounts
    const adAccountsRes = await axios.get(
      'https://graph.facebook.com/v19.0/me/adaccounts',
      {
        params: {
          access_token: longLivedToken,
          fields: 'id,name,account_status,currency',
          limit: 10,
        },
      }
    )
    const adAccounts = adAccountsRes.data.data

    if (!adAccounts || adAccounts.length === 0) {
      const response = NextResponse.redirect(
        new URL('/dashboard?error=no_ad_accounts', req.url)
      )
      response.cookies.set('optilens_uid', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60,
        path: '/',
      })
      return response
    }

    // 6. Save each ad account, linked to user
    for (const account of adAccounts) {
      await supabaseAdmin.from('meta_accounts').upsert(
        {
          ad_account_id: account.id,
          access_token: longLivedToken,
          account_name: account.name,
          account_status: account.account_status,
          currency: account.currency,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'ad_account_id' }
      )
    }

    // 7. Trigger initial sync (non-blocking)
    const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/ingest`
    axios
      .post(syncUrl, {
        ad_account_id: adAccounts[0].id,
        access_token: longLivedToken,
      })
      .catch(() => {})

    // 8. Set cookie + redirect
    const response = NextResponse.redirect(
      new URL(user.onboarded ? '/dashboard?connected=true' : '/onboarding', req.url)
    )
    response.cookies.set('optilens_uid', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Meta OAuth error:', err.response?.data || err.message)
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url))
  }
}