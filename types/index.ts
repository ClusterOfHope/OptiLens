export type Campaign = {
  id: string
  campaign_id: string
  name: string
  status: string
  objective: string
  daily_budget: number | null
}

export type DailyMetric = {
  id: string
  campaign_id: string
  date: string
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  ctr: number
  purchases: number
  purchase_value: number
  roas: number
  waste_score: number
}

export type WasteFlag = {
  id: string
  campaign_id: string
  flag_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  recommendation: string
  is_active: boolean
}

export type CampaignSummary = Campaign & {
  total_spend: number
  total_revenue: number
  roas: number
  waste_score: number
  flags: WasteFlag[]
  recommendation: string
}
