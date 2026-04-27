import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('id')
  if (!accountId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { data: account } = await supabaseAdmin
    .from('shopify_accounts')
    .select('user_id')
    .eq('id', accountId)
    .single()

  if (!account || account.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Soft delete - mark as inactive instead of deleting (preserves order history)
  const { error } = await supabaseAdmin
    .from('shopify_accounts')
    .update({ is_active: false })
    .eq('id', accountId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}