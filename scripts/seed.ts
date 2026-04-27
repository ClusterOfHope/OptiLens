// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts
//
// This will create 6 fake campaigns linked to YOUR most recent user account
// with 30 days of realistic-looking metrics each.

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Make sure .env.local has both values set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 6 fake campaigns with different "stories"
const FAKE_CAMPAIGNS = [
  {
    name: 'Black Friday Retargeting',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 200,
    pattern: 'zero_conversions', // critical
  },
  {
    name: 'Brand Awareness Broad',
    objective: 'BRAND_AWARENESS',
    status: 'ACTIVE',
    daily_budget: 150,
    pattern: 'low_roas', // warning
  },
  {
    name: 'Spring Sale 2026',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 300,
    pattern: 'healthy', // healthy, scaling
  },
  {
    name: 'Summer Collection Lookalike',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 180,
    pattern: 'fatigued', // warning
  },
  {
    name: 'Holiday Gift Guide',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 250,
    pattern: 'declining', // warning, getting worse
  },
  {
    name: 'Evergreen Best Sellers',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 100,
    pattern: 'healthy', // small but working
  },
]

function generateMetrics(pattern: string, dayIndex: number) {
  const day = dayIndex + 1 // 1 to 30

  switch (pattern) {
    case 'zero_conversions':
      // Lots of spend, zero purchases — clear waste signal
      return {
        spend: 200 + Math.random() * 50,
        impressions: 8000 + Math.random() * 2000,
        reach: 6500 + Math.random() * 1000,
        frequency: 1.2 + Math.random() * 0.3,
        clicks: 80 + Math.random() * 30,
        ctr: 0.95 + Math.random() * 0.4,
        cpm: 25 + Math.random() * 5,
        purchases: 0,
        purchase_value: 0,
        roas: 0,
      }

    case 'low_roas':
      // Spending money, getting some sales, but barely break-even
      return {
        spend: 150 + Math.random() * 30,
        impressions: 12000 + Math.random() * 3000,
        reach: 9000 + Math.random() * 1500,
        frequency: 1.4 + Math.random() * 0.4,
        clicks: 180 + Math.random() * 40,
        ctr: 1.4 + Math.random() * 0.3,
        cpm: 12 + Math.random() * 3,
        purchases: 2 + Math.floor(Math.random() * 2),
        purchase_value: 130 + Math.random() * 30,
        roas: 0.85 + Math.random() * 0.15,
      }

    case 'healthy':
      // Strong performance — should scale up
      const baseSpend = 200 + Math.random() * 40
      const purchases = 8 + Math.floor(Math.random() * 4)
      const purchaseValue = baseSpend * (2.8 + Math.random() * 0.6)
      return {
        spend: baseSpend,
        impressions: 15000 + Math.random() * 4000,
        reach: 11000 + Math.random() * 2000,
        frequency: 1.3 + Math.random() * 0.3,
        clicks: 280 + Math.random() * 60,
        ctr: 1.8 + Math.random() * 0.4,
        cpm: 13 + Math.random() * 2,
        purchases,
        purchase_value: purchaseValue,
        roas: purchaseValue / baseSpend,
      }

    case 'fatigued':
      // High frequency, declining CTR — audience burned out
      const fatigueFactor = 1 - (day / 60) // CTR drops over time
      return {
        spend: 180 + Math.random() * 30,
        impressions: 14000 + Math.random() * 3000,
        reach: 4500 + Math.random() * 1000, // low reach = high frequency
        frequency: 4.2 + Math.random() * 0.8,
        clicks: 100 * fatigueFactor + Math.random() * 20,
        ctr: 0.7 * fatigueFactor + Math.random() * 0.3,
        cpm: 15 + Math.random() * 3,
        purchases: Math.max(0, Math.floor(3 * fatigueFactor + Math.random() * 2)),
        purchase_value: 280 * fatigueFactor + Math.random() * 50,
        roas: 1.5 * fatigueFactor + Math.random() * 0.3,
      }

    case 'declining':
      // ROAS dropping week over week — campaign is dying
      const declineFactor = Math.max(0.3, 1 - (day / 35))
      const declineSpend = 250 + Math.random() * 40
      const declinePurchases = Math.max(1, Math.floor(6 * declineFactor + Math.random() * 2))
      const declineValue = declineSpend * (2.5 * declineFactor + Math.random() * 0.3)
      return {
        spend: declineSpend,
        impressions: 13000 + Math.random() * 2000,
        reach: 10000 + Math.random() * 1500,
        frequency: 1.3 + Math.random() * 0.3,
        clicks: 200 + Math.random() * 40,
        ctr: 1.5 + Math.random() * 0.3,
        cpm: 18 + Math.random() * 3,
        purchases: declinePurchases,
        purchase_value: declineValue,
        roas: declineValue / declineSpend,
      }

    default:
      return {
        spend: 100, impressions: 5000, reach: 4000, frequency: 1.25,
        clicks: 50, ctr: 1.0, cpm: 20,
        purchases: 1, purchase_value: 100, roas: 1.0,
      }
  }
}

async function main() {
  console.log('🌱 Starting seed...\n')

  // 1. Find the most recent user
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, facebook_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (userErr || !users || users.length === 0) {
    console.error('❌ No users found in database!')
    console.error('   You need to log in via Meta OAuth first.')
    console.error('   Visit https://opti-lens-c8qv.vercel.app and click "Connect Meta Ads"')
    process.exit(1)
  }

  const user = users[0]
  console.log(`✅ Found user: ${user.name} (${user.facebook_id})`)

  // 2. Find or create a meta_account for this user
  let metaAccountId: string

  const { data: existingAccount } = await supabase
    .from('meta_accounts')
    .select('id, ad_account_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (existingAccount) {
    metaAccountId = existingAccount.id
    console.log(`✅ Using existing Meta account: ${existingAccount.ad_account_id}`)
  } else {
    // Create a fake meta_account
    const { data: newAccount, error: createErr } = await supabase
      .from('meta_accounts')
      .insert({
        user_id: user.id,
        ad_account_id: 'act_seed_' + Date.now(),
        account_name: 'Seed Test Account',
        account_status: 1,
        currency: 'USD',
        access_token: 'seed_token_placeholder',
      })
      .select()
      .single()

    if (createErr || !newAccount) {
      console.error('❌ Failed to create meta_account:', createErr)
      process.exit(1)
    }
    metaAccountId = newAccount.id
    console.log(`✅ Created new Meta account: ${newAccount.ad_account_id}`)
  }

  // 3. Delete existing seed campaigns for this account (clean slate)
  const { data: oldCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('meta_account_id', metaAccountId)

  if (oldCampaigns && oldCampaigns.length > 0) {
    const oldCampaignIds = oldCampaigns.map((c) => c.id)
    await supabase.from('campaign_daily_metrics').delete().in('campaign_id', oldCampaignIds)
    await supabase.from('waste_flags').delete().in('campaign_id', oldCampaignIds)
    await supabase.from('campaigns').delete().in('id', oldCampaignIds)
    console.log(`🗑️  Cleared ${oldCampaigns.length} old campaigns`)
  }

  // 4. Create 6 new fake campaigns
  for (const fake of FAKE_CAMPAIGNS) {
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .insert({
        meta_account_id: metaAccountId,
        campaign_id: 'seed_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        name: fake.name,
        objective: fake.objective,
        status: fake.status,
        daily_budget: fake.daily_budget,
      })
      .select()
      .single()

    if (campErr || !campaign) {
      console.error(`❌ Failed to create campaign "${fake.name}":`, campErr)
      continue
    }

    // Generate 30 days of metrics
    const metrics = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const m = generateMetrics(fake.pattern, i)
      metrics.push({
        campaign_id: campaign.id,
        date: date.toISOString().split('T')[0],
        ...m,
      })
    }

    await supabase.from('campaign_daily_metrics').insert(metrics)
    console.log(`  ✓ ${fake.name} (${fake.pattern}) — 30 days of metrics`)
  }

  console.log('\n✨ Seed complete! Refresh your dashboard:')
  console.log('   https://opti-lens-c8qv.vercel.app/dashboard\n')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})