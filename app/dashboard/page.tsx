'use client'
import { useEffect, useState } from 'react'

type Flag = { flag_type: string; severity: string; description: string; recommendation: string }
type Campaign = { id: string; name: string; status: string; total_spend: number; total_revenue: number; roas: number; waste_score: number; flags: Flag[]; recommendation: string }

const DATA: Campaign[] = [
  { id:'1', name:'Spring Sale 2026', status:'ACTIVE', total_spend:4200, total_revenue:13400, roas:3.19, waste_score:0, flags:[], recommendation:'SCALE' },
  { id:'2', name:'Brand Awareness Broad', status:'ACTIVE', total_spend:3100, total_revenue:2800, roas:0.90, waste_score:7, flags:[{flag_type:'HIGH_SPEND_LOW_ROAS',severity:'HIGH',description:'Low ROAS',recommendation:'PAUSE'}], recommendation:'PAUSE' },
  { id:'3', name:'Retargeting 30 Day', status:'ACTIVE', total_spend:1800, total_revenue:5200, roas:2.88, waste_score:2, flags:[{flag_type:'CREATIVE_FATIGUE',severity:'MEDIUM',description:'High frequency',recommendation:'REFRESH_CREATIVE'}], recommendation:'REFRESH_CREATIVE' },
  { id:'4', name:'Black Friday Retargeting', status:'ACTIVE', total_spend:6200, total_revenue:0, roas:0, waste_score:10, flags:[{flag_type:'ZERO_CONVERSIONS',severity:'CRITICAL',description:'Zero revenue',recommendation:'PAUSE'}], recommendation:'PAUSE' },
  { id:'5', name:'Lookalike Top Customers', status:'ACTIVE', total_spend:2900, total_revenue:6100, roas:2.10, waste_score:1, flags:[], recommendation:'MONITOR' },
  { id:'6', name:'TikTok UGC Cold', status:'PAUSED', total_spend:980, total_revenue:420, roas:0.43, waste_score:8, flags:[{flag_type:'NEGATIVE_TREND',severity:'HIGH',description:'ROAS dropping',recommendation:'REDUCE_BUDGET'}], recommendation:'REDUCE_BUDGET' },
]

const SEV: Record<string,string> = { CRITICAL:'bg-red-100 text-red-800', HIGH:'bg-orange-100 text-orange-800', MEDIUM:'bg-yellow-100 text-yellow-800' }
const REC: Record<string,string> = { PAUSE:'bg-red-500', REDUCE_BUDGET:'bg-orange-500', REFRESH_CREATIVE:'bg-yellow-500', SCALE:'bg-green-500', MONITOR:'bg-blue-500' }

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => { setCampaigns(DATA); setLoading(false) }, 600)
  }, [])

  const spend = campaigns.reduce((s, c) => s + c.total_spend, 0)
  const rev = campaigns.reduce((s, c) => s + c.total_revenue, 0)
  const roas = spend > 0 ? rev / spend : 0
  const flagged = campaigns.filter(c => c.flags.length > 0).length
  const wasted = campaigns.filter(c => c.recommendation === 'PAUSE').reduce((s, c) => s + c.total_spend, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">OptiLens</h1>
            <p className="text-gray-500 text-sm">Optimize every ad dollar</p>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Demo mode</span>
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">Connect Meta Ads</button>
          </div>
        </div>

        {wasted > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-red-800">Wasted spend detected</p>
              <p className="text-xs text-red-600">${wasted.toLocaleString()} on zero-return campaigns — pause immediately</p>
            </div>
            <span className="text-2xl font-semibold text-red-700">${wasted.toLocaleString()}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Total spend</p>
            <p className="text-2xl font-semibold">${spend.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Total revenue</p>
            <p className="text-2xl font-semibold text-green-600">${rev.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Overall ROAS</p>
            <p className={`text-2xl font-semibold ${roas >= 2 ? 'text-green-600' : roas >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>{roas.toFixed(2)}x</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Flagged campaigns</p>
            <p className="text-2xl font-semibold text-red-600">{flagged}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-medium">Campaigns</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-gray-500">Campaign</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500">Spend</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500">Revenue</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500">ROAS</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500">Waste</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500">Flags</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">${c.total_spend.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-green-600">${c.total_revenue.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-medium ${c.roas >= 2 ? 'text-green-600' : c.roas >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>{c.roas.toFixed(2)}x</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${c.waste_score >= 7 ? 'text-red-600' : c.waste_score >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>{c.waste_score}/10</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.flags.map((f, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${SEV[f.severity] || 'bg-gray-100 text-gray-600'}`}>{f.flag_type.replace(/_/g, ' ')}</span>
                        ))}
                        {c.flags.length === 0 && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs text-white px-3 py-1 rounded-full ${REC[c.recommendation] || 'bg-gray-400'}`}>{c.recommendation.replace(/_/g, ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}