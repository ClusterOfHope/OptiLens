import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Realistic test campaigns covering all rule scenarios
const testCampaigns = [
  {
    name: 'Spring Sale 2026',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 150,
    pattern: 'healthy',          // High ROAS, scale up
  },
  {
    name: 'Black Friday Retargeting',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 200,
    pattern: 'zero_conversions', // Spending with no purchases
  },
  {
    name: 'Brand Awareness Broad',
    objective: 'AWARENESS',
    status: 'ACTIVE',
    daily_budget: 100,
    pattern: 'low_roas',          // Spending but ROAS < 1
  },
  {
    name: 'Lookalike 1% - Purchase',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 80,
    pattern: 'fatigued',          // High frequency, declining CTR
  },
  {
    name: 'Holiday Gift Guide',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 120,
    pattern: 'declining',         // ROAS dropping over time
  },
  {
    name: 'New Customer Acquisition',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    daily_budget: 90,
    pattern: 'healthy',           // Steady performer
  },
]

function generateDailyMetric(pattern: string, dayOffset: number) {
  const date = new Date()
  date.setDate(date.getDate() - (29 - dayOffset))
  const dateStr = date.toISOString().split('T')[0]

  switch (pattern) {
    case 'healthy': {
      const spend = 140 + Math.random() * 30
      const purchases = 4 + Math.floor(Math.random() * 4)
      const purchase_value = purchases * (90 + Math.random() * 40)
      return {
        date: dateStr,
        spend,
        impressions: 18000 + Math.floor(Math.random() * 5000),
        reach: 15000 + Math.floor(Math.random() * 4000),
        frequency: 1.1 + Math.random() * 0.3,
        clicks: 280 + Math.floor(Math.random() * 80),
        ctr: 1.5 + Math.random() * 0.5,
        cpm: 8 + Math.random() * 3,
        purchases,
        purchase_value,
        roas: purchase_value / spend,
      }
    }
    case 'zero_conversions': {
      const spend = 200 + Math.random() * 30
      return {
        date: dateStr,
        spend,
        impressions: 25000 + Math.floor(Math.random() * 5000),
        reach: 20000 + Math.floor(Math.random() * 3000),
        frequency: 1.3 + Math.random() * 0.4,
        clicks: 100 + Math.floor(Math.random() * 50),
        ctr: 0.4 + Math.random() * 0.2,
        cpm: 9 + Math.random() * 3,
        purchases: 0,
        purchase_value: 0,
        roas: 0,
      }
    }
    case 'low_roas': {
      const spend = 95 + Math.random() * 20
      const purchases = Math.random() > 0.5 ? 1 : 0
      const purchase_value = purchases * (40 + Math.random() * 30)
      return {
        date: dateStr,
        spend,
        impressions: 22000 + Math.floor(Math.random() * 4000),
        reach: 19000 + Math.floor(Math.random() * 3000),
        frequency: 1.2 + Math.random() * 0.2,
        clicks: 180 + Math.floor(Math.random() * 50),
        ctr: 0.8 + Math.random() * 0.3,
        cpm: 5 + Math.random() * 2,
        purchases,
        purchase_value,
        roas: purchase_value / spend,
      }
    }
    case 'fatigued': {
      // Frequency rises over time, CTR drops
      const spend = 75 + Math.random() * 15
      const frequency = 1.5 + (dayOffset / 30) * 4 // 1.5 → 5.5
      const ctr = 1.8 - (dayOffset / 30) * 1.2 // 1.8 → 0.6
      const purchases = Math.max(0, 3 - Math.floor(dayOffset / 8))
      const purchase_value = purchases * (75 + Math.random() * 25)
      return {
        date: dateStr,
        spend,
        impressions: 15000 + Math.floor(Math.random() * 3000),
        reach: 4000 + Math.floor(Math.random() * 1000),
        frequency,
        clicks: Math.max(50, 250 - dayOffset * 6),
        ctr,
        cpm: 6 + Math.random() * 2,
        purchases,
        purchase_value,
        roas: purchase_value / spend,
      }
    }
    case 'declining': {
      // ROAS strong early, weak late
      const spend = 115 + Math.random() * 20
      const roasMultiplier = Math.max(0.3, 2.5 - (dayOffset / 30) * 2.0)
      const purchase_value = spend * roasMultiplier
      const purchases = Math.max(0, Math.floor(purchase_value / 90))
      return {
        date: dateStr,
        spend,
        impressions: 17000 + Math.floor(Math.random() * 3000),
        reach: 14000 + Math.floor(Math.random() * 2000),
        frequency: 1.2 + Math.random() * 0.3,
        clicks: 220 + Math.floor(Math.random() * 50),
        ctr: 1.3 + Math.random() * 0.4,
        cpm: 7 + Math.random() * 2,
        purchases,
        purchase_value,
        roas: roasMultiplier,
      }
    }
    default:
      return null
  }
}

async function seed() {
  console.log('🌱 Starting OptiLens seed...\n')

  // 1. Wipe existing test data
  console.log('🧹 Cleaning old test data...')
  await supabase.from('waste_flags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('campaign_daily_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('   Done.\n')

  // 2. Insert each campaign + 30 days of metrics
  for (const tc of testCampaigns) {
    console.log(`📦 Inserting: ${tc.name} (${tc.pattern})`)

    const { data: campaign, error: campaignErr } = await supabase
      .from('campaigns')
      .insert({
        campaign_id: `seed_${tc.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: tc.name,
        objective: tc.objective,
        status: tc.status,
        daily_budget: tc.daily_budget,
      })
      .select()
      .single()

    if (campaignErr || !campaign) {
      console.error(`   ❌ Error: ${campaignErr?.message}`)
      continue
    }

    const metrics = []
    for (let day = 0; day < 30; day++) {
      const m = generateDailyMetric(tc.pattern, day)
      if (m) metrics.push({ ...m, campaign_id: campaign.id })
    }

    const { error: metricsErr } = await supabase
      .from('campaign_daily_metrics')
      .insert(metrics)

    if (metricsErr) {
      console.error(`   ❌ Metrics error: ${metricsErr.message}`)
    } else {
      console.log(`   ✅ Inserted 30 days of metrics`)
    }
  }

  console.log('\n🎉 Seed complete! Now click "Sync Now" on the dashboard to run rules.')
}

seed().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})