import { DailyMetric, WasteFlag } from '@/types'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR'

export type Verdict = {
  recommendation: string
  risk_level: RiskLevel
  confidence: number          // 0-100
  confidence_label: string    // "Very confident" | "Likely" | "Uncertain" | "Too early"
  evidence: string[]          // Why we flagged it
  counter_arguments: string[] // What could explain it being fine
  action: string              // What the brand should actually do
  do_not_pause_reason?: string // If learning phase or low data — explain why to wait
}

export type EnrichedFlag = Omit<WasteFlag, 'id'> & {
  verdict: Verdict
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function confidenceLabel(score: number): string {
  if (score >= 90) return 'Very confident'
  if (score >= 75) return 'Likely'
  if (score >= 55) return 'Uncertain'
  return 'Too early to tell'
}

function isInLearningPhase(metrics: DailyMetric[]): boolean {
  // Meta's learning phase typically lasts 7 days or 50 optimisation events
  // We approximate: campaign has fewer than 7 days of data
  return metrics.length < 7
}

function hasEnoughData(metrics: DailyMetric[]): boolean {
  // Need at least 3 days of data before making any call
  return metrics.length >= 3
}

function totalSpend(metrics: DailyMetric[]): number {
  return metrics.reduce((s, m) => s + Number(m.spend), 0)
}

function totalRevenue(metrics: DailyMetric[]): number {
  return metrics.reduce((s, m) => s + Number(m.purchase_value), 0)
}

function avgRoas(metrics: DailyMetric[]): number {
  const spend = totalSpend(metrics)
  return spend > 0 ? totalRevenue(metrics) / spend : 0
}

function avgFrequency(metrics: DailyMetric[]): number {
  if (metrics.length === 0) return 0
  return metrics.reduce((s, m) => s + Number(m.frequency), 0) / metrics.length
}

function roasTrend(metrics: DailyMetric[]): number {
  // Returns % change in ROAS from first half to second half
  // Negative = declining, Positive = improving
  if (metrics.length < 6) return 0
  const half = Math.floor(metrics.length / 2)
  const firstHalf = metrics.slice(0, half)
  const secondHalf = metrics.slice(-half)
  const firstRoas = avgRoas(firstHalf)
  const secondRoas = avgRoas(secondHalf)
  if (firstRoas === 0) return 0
  return ((secondRoas - firstRoas) / firstRoas) * 100
}

function ctrTrend(metrics: DailyMetric[]): number {
  if (metrics.length < 4) return 0
  const recent = metrics.slice(-3)
  const older  = metrics.slice(0, metrics.length - 3)
  const recentCtr = recent.reduce((s, m) => s + Number(m.ctr), 0) / recent.length
  const olderCtr  = older.reduce((s, m) => s + Number(m.ctr), 0) / older.length
  if (olderCtr === 0) return 0
  return ((recentCtr - olderCtr) / olderCtr) * 100
}

function dataConfidenceBoost(metrics: DailyMetric[]): number {
  // More data = more confident. Caps at +15 points.
  if (metrics.length >= 21) return 15
  if (metrics.length >= 14) return 10
  if (metrics.length >= 7)  return 5
  return 0
}

// ─────────────────────────────────────────────
// RULE 1 — ZERO CONVERSIONS
// ─────────────────────────────────────────────

function checkZeroConversions(
  campaignId: string,
  metrics: DailyMetric[],
  inLearning: boolean
): EnrichedFlag | null {
  const spend = totalSpend(metrics)
  const revenue = totalRevenue(metrics)

  if (spend < 300 || revenue > 0) return null

  // Base confidence — increases with spend and days
  let confidence = 60
  if (spend > 1000) confidence += 10
  if (spend > 3000) confidence += 10
  if (metrics.length >= 14) confidence += 10
  confidence += dataConfidenceBoost(metrics)
  confidence = Math.min(confidence, 95)

  const evidence: string[] = [
    `$${spend.toFixed(0)} spent over ${metrics.length} days with zero attributed revenue`,
    `Meta pixel has not recorded a single purchase conversion`,
  ]
  if (spend > 2000) evidence.push(`High spend with no return is a strong signal of a broken funnel or wrong audience`)

  const counterArguments: string[] = [
    `Your product may have a long purchase cycle — customers research for weeks before buying`,
    `Attribution window mismatch — customer may have converted on Google after seeing this Meta ad`,
    `Pixel may be misconfigured — conversions happening but not tracked`,
  ]
  if (inLearning) counterArguments.unshift(`Campaign is still in Meta's learning phase (under 7 days) — optimisation hasn't kicked in yet`)

  const riskLevel: RiskLevel = spend > 2000 ? 'CRITICAL' : 'HIGH'
  const action = inLearning
    ? `Do not pause yet — campaign is in learning phase. Check pixel setup and monitor for ${7 - metrics.length} more days.`
    : `Check your pixel is firing correctly first. If pixel is confirmed working, pause this campaign and reallocate budget.`

  return {
    campaign_id: campaignId,
    flag_type: 'ZERO_CONVERSIONS',
    severity: riskLevel,
    description: `$${spend.toFixed(0)} spent with zero attributed conversions over ${metrics.length} days`,
    recommendation: inLearning ? 'MONITOR' : 'PAUSE',
    is_active: true,
    verdict: {
      recommendation: inLearning ? 'MONITOR' : 'PAUSE',
      risk_level: riskLevel,
      confidence,
      confidence_label: confidenceLabel(confidence),
      evidence,
      counter_arguments: counterArguments,
      action,
      do_not_pause_reason: inLearning
        ? `Campaign is only ${metrics.length} days old. Meta needs ~7 days and 50 events to exit learning phase. Pausing now resets all learning.`
        : undefined,
    },
  }
}

// ─────────────────────────────────────────────
// RULE 2 — HIGH SPEND LOW ROAS
// ─────────────────────────────────────────────

function checkHighSpendLowRoas(
  campaignId: string,
  metrics: DailyMetric[],
  inLearning: boolean
): EnrichedFlag | null {
  const spend = totalSpend(metrics)
  const roas = avgRoas(metrics)
  const revenue = totalRevenue(metrics)
  const trend = roasTrend(metrics)

  if (spend < 500 || roas >= 1.0 || revenue === 0) return null

  let confidence = 55
  if (roas < 0.5)  confidence += 20
  if (spend > 2000) confidence += 10
  if (trend < -20)  confidence += 10  // ROAS also declining
  if (metrics.length >= 14) confidence += 5
  confidence += dataConfidenceBoost(metrics)
  confidence = Math.min(confidence, 92)

  const evidence: string[] = [
    `Blended ROAS of ${roas.toFixed(2)}x — spending $1 to make $${roas.toFixed(2)}`,
    `Total loss: $${(spend - revenue).toFixed(0)} over ${metrics.length} days`,
  ]
  if (trend < -15) evidence.push(`ROAS trending down ${Math.abs(trend).toFixed(0)}% — getting worse not better`)
  if (roas < 0.5)  evidence.push(`Below 0.5x ROAS is a strong signal — less than half your spend is coming back`)

  const counterArguments: string[] = [
    `New customer acquisition cost may be acceptable if LTV (lifetime value) is high`,
    `Brand awareness campaigns aren't expected to have direct ROAS — check if this is awareness objective`,
    `Attribution window may be set too short — 7-day click is standard, 1-day click undercounts`,
  ]
  if (inLearning) counterArguments.unshift(`Still in learning phase — ROAS typically improves significantly after Meta exits learning`)
  if (trend > 10)  counterArguments.push(`ROAS is actually improving week-over-week — may be self-correcting`)

  const riskLevel: RiskLevel = roas < 0.5 ? 'CRITICAL' : 'HIGH'
  const action = inLearning
    ? `Monitor closely. Do not pause during learning phase. If ROAS hasn't improved by day 10, reduce budget by 30%.`
    : `Reduce budget by 50% immediately. Review audience targeting and creative. If no improvement in 5 days, pause.`

  return {
    campaign_id: campaignId,
    flag_type: 'HIGH_SPEND_LOW_ROAS',
    severity: riskLevel,
    description: `${roas.toFixed(2)}x ROAS on $${spend.toFixed(0)} spend — losing $${(spend - revenue).toFixed(0)}`,
    recommendation: inLearning ? 'MONITOR' : roas < 0.5 ? 'PAUSE' : 'REDUCE_BUDGET',
    is_active: true,
    verdict: {
      recommendation: inLearning ? 'MONITOR' : roas < 0.5 ? 'PAUSE' : 'REDUCE_BUDGET',
      risk_level: riskLevel,
      confidence,
      confidence_label: confidenceLabel(confidence),
      evidence,
      counter_arguments: counterArguments,
      action,
      do_not_pause_reason: inLearning
        ? `Meta's algorithm is still learning. ROAS in learning phase is typically 30-50% lower than post-learning ROAS.`
        : undefined,
    },
  }
}

// ─────────────────────────────────────────────
// RULE 3 — CREATIVE FATIGUE
// ─────────────────────────────────────────────

function checkCreativeFatigue(
  campaignId: string,
  metrics: DailyMetric[]
): EnrichedFlag | null {
  const freq = avgFrequency(metrics)
  const ctrDrop = ctrTrend(metrics)
  const latestCtr = metrics.length > 0 ? Number(metrics[metrics.length - 1].ctr) : 0

  if (freq < 2.5 || ctrDrop > -20) return null

  let confidence = 50
  if (freq > 4)       confidence += 15
  if (ctrDrop < -40)  confidence += 15
  if (latestCtr < 0.005) confidence += 10
  if (metrics.length >= 10) confidence += 10
  confidence += dataConfidenceBoost(metrics)
  confidence = Math.min(confidence, 88)

  const evidence: string[] = [
    `Average frequency of ${freq.toFixed(1)} — same person seeing this ad ${freq.toFixed(1)} times`,
    `CTR dropped ${Math.abs(ctrDrop).toFixed(0)}% in the last 3 days — audience is tuning out`,
  ]
  if (latestCtr < 0.005) evidence.push(`Current CTR of ${(latestCtr * 100).toFixed(2)}% is critically low`)
  if (freq > 5) evidence.push(`Frequency above 5 causes active ad fatigue and can damage brand perception`)

  const counterArguments: string[] = [
    `High frequency is acceptable for retargeting campaigns where repeat exposure is intentional`,
    `CTR drop may be seasonal, not creative-related — check if industry benchmarks also dropped`,
    `Some products need multiple touchpoints before purchase — frequency may be working`,
  ]

  const action = freq > 4
    ? `Refresh your creative immediately — introduce 2-3 new ad variations. Consider expanding audience to reduce frequency.`
    : `Begin testing new creative variants now before fatigue gets worse. Don't pause — just rotate in fresh ads.`

  return {
    campaign_id: campaignId,
    flag_type: 'CREATIVE_FATIGUE',
    severity: 'MEDIUM',
    description: `Frequency ${freq.toFixed(1)}x with CTR declining ${Math.abs(ctrDrop).toFixed(0)}% — audience burning out`,
    recommendation: 'REFRESH_CREATIVE',
    is_active: true,
    verdict: {
      recommendation: 'REFRESH_CREATIVE',
      risk_level: 'MEDIUM',
      confidence,
      confidence_label: confidenceLabel(confidence),
      evidence,
      counter_arguments: counterArguments,
      action,
    },
  }
}

// ─────────────────────────────────────────────
// RULE 4 — NEGATIVE ROAS TREND
// ─────────────────────────────────────────────

function checkNegativeTrend(
  campaignId: string,
  metrics: DailyMetric[]
): EnrichedFlag | null {
  if (metrics.length < 7) return null

  const trend = roasTrend(metrics)
  const roas = avgRoas(metrics)

  // Only flag if declining significantly AND still has meaningful spend
  if (trend > -25 || roas < 0.1) return null

  const spend = totalSpend(metrics)
  if (spend < 300) return null

  let confidence = 50
  if (trend < -40)  confidence += 15
  if (trend < -60)  confidence += 10
  if (roas < 1.0)   confidence += 10
  if (metrics.length >= 14) confidence += 10
  confidence += dataConfidenceBoost(metrics)
  confidence = Math.min(confidence, 85)

  const evidence: string[] = [
    `ROAS declined ${Math.abs(trend).toFixed(0)}% comparing first half vs second half of campaign`,
    `Current trajectory suggests continued deterioration without intervention`,
  ]
  if (roas < 1.0) evidence.push(`Already below break-even ROAS — losses are accelerating`)

  const counterArguments: string[] = [
    `Seasonality — external factors like holidays or events may be temporarily suppressing performance`,
    `iOS or browser privacy changes can cause apparent ROAS drops due to attribution loss`,
    `Competitor surge — increased auction competition may be raising CPMs temporarily`,
    `This may be a natural performance cycle — Meta campaigns often dip before stabilising`,
  ]

  const action = trend < -50
    ? `Reduce budget by 40% immediately and test a new audience. If trend doesn't reverse in 5 days, pause.`
    : `Monitor daily for 3 more days. If downward trend continues, reduce budget by 25% and refresh creative.`

  return {
    campaign_id: campaignId,
    flag_type: 'NEGATIVE_TREND',
    severity: trend < -50 ? 'HIGH' : 'MEDIUM',
    description: `ROAS declining ${Math.abs(trend).toFixed(0)}% over the campaign period`,
    recommendation: trend < -50 ? 'REDUCE_BUDGET' : 'MONITOR',
    is_active: true,
    verdict: {
      recommendation: trend < -50 ? 'REDUCE_BUDGET' : 'MONITOR',
      risk_level: trend < -50 ? 'HIGH' : 'MEDIUM',
      confidence,
      confidence_label: confidenceLabel(confidence),
      evidence,
      counter_arguments: counterArguments,
      action,
    },
  }
}

// ─────────────────────────────────────────────
// RULE 5 — HEALTHY CAMPAIGN (POSITIVE SIGNAL)
// ─────────────────────────────────────────────

function checkHealthyPerformance(
  campaignId: string,
  metrics: DailyMetric[]
): EnrichedFlag | null {
  const roas = avgRoas(metrics)
  const trend = roasTrend(metrics)
  const spend = totalSpend(metrics)

  if (roas < 2.5 || spend < 500) return null

  const evidence: string[] = [
    `Strong ${roas.toFixed(2)}x ROAS — generating $${roas.toFixed(2)} for every $1 spent`,
    `Campaign has spent $${spend.toFixed(0)} at profitable returns`,
  ]
  if (trend > 10) evidence.push(`ROAS improving ${trend.toFixed(0)}% — performance is accelerating`)

  return {
    campaign_id: campaignId,
    flag_type: 'STRONG_PERFORMANCE',
    severity: 'LOW',
    description: `${roas.toFixed(2)}x ROAS — performing well above break-even`,
    recommendation: roas > 4 ? 'SCALE' : 'MONITOR',
    is_active: true,
    verdict: {
      recommendation: roas > 4 ? 'SCALE' : 'MONITOR',
      risk_level: 'LOW',
      confidence: 85,
      confidence_label: 'Likely',
      evidence,
      counter_arguments: [
        `High ROAS can sometimes indicate audience is too narrow — scaling may dilute performance`,
        `Verify attribution window matches your sales cycle before aggressively scaling`,
      ],
      action: roas > 4
        ? `Strong signal to scale. Increase budget by 20-30% every 3 days and monitor ROAS carefully.`
        : `Healthy campaign. Maintain current budget and test slight audience expansions.`,
    },
  }
}

// ─────────────────────────────────────────────
// MAIN EXPORT — Run all rules
// ─────────────────────────────────────────────

export function runWasteRules(
  campaignId: string,
  metrics: DailyMetric[]
): Omit<WasteFlag, 'id'>[] {
  if (metrics.length === 0) return []

  // Not enough data — don't make any calls yet
  if (!hasEnoughData(metrics)) return []

  const inLearning = isInLearningPhase(metrics)
  const flags: EnrichedFlag[] = []

  // Run all checks
  const zeroConv = checkZeroConversions(campaignId, metrics, inLearning)
  const lowRoas  = checkHighSpendLowRoas(campaignId, metrics, inLearning)
  const fatigue  = checkCreativeFatigue(campaignId, metrics)
  const trend    = checkNegativeTrend(campaignId, metrics)
  const healthy  = checkHealthyPerformance(campaignId, metrics)

  if (zeroConv) flags.push(zeroConv)
  if (lowRoas)  flags.push(lowRoas)
  if (fatigue)  flags.push(fatigue)
  if (trend)    flags.push(trend)
  if (healthy)  flags.push(healthy)

  // Strip verdict from what gets stored in DB
  // (verdict is for UI display, DB stores the flat flag)
  return flags.map(({ verdict, ...flag }) => flag)
}

// ─────────────────────────────────────────────
// EXPORT WITH VERDICTS — for dashboard display
// ─────────────────────────────────────────────

export function runWasteRulesWithVerdicts(
  campaignId: string,
  metrics: DailyMetric[]
): EnrichedFlag[] {
  if (metrics.length === 0) return []
  if (!hasEnoughData(metrics)) return [{
    campaign_id: campaignId,
    flag_type: 'INSUFFICIENT_DATA',
    severity: 'LOW',
    description: `Only ${metrics.length} days of data — need at least 3 days to make any assessment`,
    recommendation: 'MONITOR',
    is_active: true,
    verdict: {
      recommendation: 'MONITOR',
      risk_level: 'LOW',
      confidence: 0,
      confidence_label: 'Too early to tell',
      evidence: [`Campaign has only ${metrics.length} day(s) of data`],
      counter_arguments: [],
      action: `Wait for at least 3 days of data before making any decisions. Let Meta's algorithm run.`,
      do_not_pause_reason: `Insufficient data to make any meaningful assessment. Any action now would be based on noise, not signal.`,
    },
  }]

  const inLearning = isInLearningPhase(metrics)
  const flags: EnrichedFlag[] = []

  const zeroConv = checkZeroConversions(campaignId, metrics, inLearning)
  const lowRoas  = checkHighSpendLowRoas(campaignId, metrics, inLearning)
  const fatigue  = checkCreativeFatigue(campaignId, metrics)
  const trend    = checkNegativeTrend(campaignId, metrics)
  const healthy  = checkHealthyPerformance(campaignId, metrics)

  if (zeroConv) flags.push(zeroConv)
  if (lowRoas)  flags.push(lowRoas)
  if (fatigue)  flags.push(fatigue)
  if (trend)    flags.push(trend)
  if (healthy)  flags.push(healthy)

  // If no flags at all and we have enough data
  if (flags.length === 0) {
    const roas = avgRoas(metrics)
    const spend = totalSpend(metrics)
    flags.push({
      campaign_id: campaignId,
      flag_type: 'NORMAL_PERFORMANCE',
      severity: 'LOW',
      description: `No significant waste signals detected`,
      recommendation: 'MONITOR',
      is_active: true,
      verdict: {
        recommendation: 'MONITOR',
        risk_level: 'MONITOR',
        confidence: 70,
        confidence_label: 'Likely',
        evidence: [
          `${roas.toFixed(2)}x ROAS on $${spend.toFixed(0)} spend`,
          `No waste patterns detected across ${metrics.length} days of data`,
        ],
        counter_arguments: [
          `ROAS between 1-2.5x is functional but may have room to improve`,
        ],
        action: `Campaign is running normally. Continue monitoring and test creative variations to push ROAS higher.`,
      },
    })
  }

  return flags
}

// ─────────────────────────────────────────────
// WASTE SCORE CALCULATOR
// ─────────────────────────────────────────────

export function calculateWasteScore(flags: Omit<WasteFlag, 'id'>[]): number {
  if (flags.length === 0) return 0

  let score = 0
  for (const flag of flags) {
    if (flag.flag_type === 'STRONG_PERFORMANCE') continue
    switch (flag.severity) {
      case 'CRITICAL': score += 4; break
      case 'HIGH':     score += 3; break
      case 'MEDIUM':   score += 2; break
      case 'LOW':      score += 1; break
    }
  }

  return Math.min(10, score)
}