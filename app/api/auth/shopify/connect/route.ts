import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value
  if (!userId) {
    return NextResponse.redirect(new URL('/?error=not_authenticated', req.url))
  }

  const { searchParams } = new URL(req.url)
  const shop = searchParams.get('shop')
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return NextResponse.redirect(new URL('/shopify?error=invalid_shop', req.url))
  }

  const apiKey = process.env.SHOPIFY_API_KEY
  if (!apiKey) {
    return NextResponse.redirect(new URL('/shopify?error=not_configured', req.url))
  }

  const scopes = 'read_orders,read_all_orders,read_products'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`
  const state = userId // pass user ID through state

  const authUrl =
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${apiKey}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`

  return NextResponse.redirect(authUrl)
}