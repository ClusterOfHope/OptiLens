import axios from 'axios'

const BASE_URL = 'https://graph.facebook.com/v19.0'
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID

export async function getMetaCampaigns() {
  const res = await axios.get(`${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`, {
    params: {
      access_token: ACCESS_TOKEN,
      fields: 'id,name,status,objective,daily_budget,lifetime_budget',
      limit: 100,
    },
  })
  return res.data.data
}

export async function getMetaCampaignInsights(campaignId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const until = new Date().toISOString().split('T')[0]

  const res = await axios.get(`${BASE_URL}/${campaignId}/insights`, {
    params: {
      access_token: ACCESS_TOKEN,
      fields: 'spend,impressions,reach,frequency,clicks,ctr,cpm,actions,action_values',
      time_increment: 1,
      time_range: JSON.stringify({ since, until }),
      limit: 100,
    },
  })
  return res.data.data
}