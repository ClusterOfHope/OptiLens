import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

  // Permissions we need from the user
  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
  ].join(',')

  const metaAuthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=optilens_oauth`

  return NextResponse.redirect(metaAuthUrl)
}