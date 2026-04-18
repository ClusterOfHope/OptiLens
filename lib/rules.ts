import { DailyMetric, WasteFlag } from '@/types'

export function runWasteRules(
  campaignId: string,
  metrics: DailyMetric[]
): Omit<WasteFlag, 'id'>[] {
  const flags: Omit<WasteFlag, 'id'>[] = []
  if (metrics.length === 0) return flags

  const latest = metrics[metrics.length - 1]
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
  const totalRevenue = metrics.reduce((s, m) => s + m.purchase_value, 0)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgFrequency = metrics.reduce((s, m) => s + m.frequency, 0) / metrics.length

  // Rule 1: High spend + low ROAS
  if (totalSpend > 500 && avgRoas < 1.0) {
    flags.push({
      campaign_id: campaignId,
      flag_type: 'HIGH_SPEND_LOW_ROAS',
      severity: avgRoas < 0.5 ? 'CRITICAL' : 'HIGH',
      description: `Spent $${totalSpend.toFixed(0)} with only ${avgRoas.toFixed(2)}x ROAS`,
      recommendation: 'PAUSE',
      is_active: true,
    })
  }

  // Rule 2: Creative fatigue (high frequency + low CTR)
  if (avgFrequency > 3 && latest.ctr < 0.01) {
    flags.push({
      campaign_id: campaignId,
      flag_type: 'CREATIVE_FATIGUE',
      severity: 'MEDIUM',
      description: `Frequency ${avgFrequency.toFixed(1)} with CTR below 1%`,
      recommendation: 'REFRESH_CREATIVE',
      is_active: true,
    })
  }

  // Rule 3: Zero conversions with meaningful spend
  if (totalSpend > 200 && totalRevenue === 0) {
    flags.push({
      campaign_id: campaignId,
      flag_type: 'ZERO_CONVERSIONS',
      severity: 'CRITICAL',
      description: `$${totalSpend.toFixed(0)} spent with zero attributed revenue`,
      recommendation: 'PAUSE',
      is_active: true,
    })
  }

  // Rule 4: Negative trend (last 7 days ROAS declining)
  if (metrics.length >= 7) {
    const last7 = metrics.slice(-7)
    const first3Roas = last7.slice(0, 3).reduce((s, m) => s + m.roas, 0) / 3
    const last3Roas = last7.slice(-3).reduce((s, m) => s + m.roas, 0) / 3
    if (first3Roas > 0 && last3Roas < first3Roas * 0.7) {
      flags.push({
        campaign_id: campaignId,
        flag_type: 'NEGATIVE_TREND',
        severity: 'MEDIUM',
        description: `ROAS dropped ${((1 - last3Roas / first3Roas) * 100).toFixed(0)}% over last 7 days`,
        recommendation: 'REDUCE_BUDGET',
        is_active: true,
      })
    }
  }

  return flags
}