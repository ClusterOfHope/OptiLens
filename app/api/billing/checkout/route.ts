import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe, STRIPE_PRICE_ID, APP_URL } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const userId = req.cookies.get('optilens_uid')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated. Sign in first.' }, { status: 401 })
  }

  if (!STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  // Get user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, name, stripe_customer_id, subscription_status')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Already subscribed? Send to billing portal instead
  if (user.subscription_status === 'active' || user.subscription_status === 'trialing') {
    return NextResponse.json({
      error: 'You already have an active subscription',
      redirect: '/billing',
    }, { status: 400 })
  }

  // Check if beta spots remain
  const { data: spotsData } = await supabaseAdmin
    .from('beta_spots_remaining')
    .select('spots_left')
    .single()

  const spotsLeft = spotsData?.spots_left || 0
  const isBetaSpot = spotsLeft > 0

  try {
    // Get or create Stripe customer
    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          is_beta: isBetaSpot ? 'true' : 'false',
        },
      },
      payment_method_collection: 'always', // require card upfront
      success_url: `${APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing?canceled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}