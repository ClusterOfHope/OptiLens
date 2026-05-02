import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: skip if already processed
  const { data: existingEvent } = await supabaseAdmin
    .from('subscription_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.subscription && session.customer) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const userId = (session.metadata?.user_id as string | undefined) || (sub.metadata?.user_id as string | undefined) || null
    await updateUserSubscription(sub, userId)

          // Claim a beta spot if applicable
          if (sub.metadata?.is_beta === 'true' && userId) {
            await supabaseAdmin
              .from('beta_spots')
              .upsert({ user_id: userId }, { onConflict: 'user_id' })

            await supabaseAdmin
              .from('users')
              .update({ is_beta_user: true })
              .eq('id', userId)
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await updateUserSubscription(sub, null)
        break
      }

      case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice
  // Get subscription ID — different fields in different Stripe API versions
  const subscriptionId =
    (invoice as any).subscription ||
    (invoice.parent as any)?.subscription_details?.subscription ||
    invoice.lines?.data?.[0]?.subscription

  if (subscriptionId && typeof subscriptionId === 'string') {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    await updateUserSubscription(sub, null)
  }
  break
}

      case 'customer.subscription.trial_will_end': {
        // Stripe sends this 3 days before trial ends — could trigger an email
        // For now, just log it
        console.log('Trial ending soon for subscription:', (event.data.object as Stripe.Subscription).id)
        break
      }
    }

    // Log event for audit trail
    const userIdFromEvent = await getUserIdFromEvent(event)
    await supabaseAdmin.from('subscription_events').insert({
      user_id: userIdFromEvent,
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data.object as any,
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function updateUserSubscription(sub: Stripe.Subscription, userIdHint: string | null) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  let userId = userIdHint
  if (!userId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    userId = user?.id || null
  }

  if (!userId) {
    console.warn('No user found for customer:', customerId)
    return
  }

  // Get period end — moved between API versions
  // Try subscription-level first, then fall back to first item's period
  const periodEndUnix =
    (sub as any).current_period_end ||
    sub.items?.data?.[0]?.current_period_end ||
    null

  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null

  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: sub.status,
      subscription_id: sub.id,
      price_id: sub.items.data[0]?.price.id,
      trial_ends_at: trialEnd,
      subscription_ends_at: periodEnd,
    })
    .eq('id', userId)
}

async function getUserIdFromEvent(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as any
  if (obj?.metadata?.user_id) return obj.metadata.user_id

  const customerId = obj?.customer
  if (typeof customerId === 'string') {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    return user?.id || null
  }
  return null
}