'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Flag = { flag_type: string; severity: string; description: string; recommendation: string }
type Campaign = {
  id: string; name: string; status: string; objective: string
  total_spend: number; total_revenue: number; roas: number
  waste_score: number; flags: Flag[]; recommendation: string
}

const DEMO: Campaign[] = [
  { id:'1', name:'Spring Sale 2026', status:'ACTIVE', objective:'CONVERSIONS', total_spend:4200, total_revenue:13400, roas:3.19, waste_score:0, flags:[], recommendation:'SCALE' },
  { id:'2', name:'Black Friday Retargeting', status:'ACTIVE', objective:'CONVERSIONS', total_spend:6200, total_revenue:0, roas:0, waste_score:10, flags:[{flag_type:'ZERO_CONVERSIONS',severity:'CRITICAL',description:'$6,200 spent with zero revenue',recommendation:'PAUSE'}], recommendation:'PAUSE' },
  { id:'3', name:'Brand Awareness Broad', status:'ACTIVE', objective:'AWARENESS', total_spend:3100, total_revenue:2800, roas:0.90, waste_score:7, flags:[{flag_type:'HIGH_SPEND_LOW_ROAS',severity:'HIGH',description:'0.90x ROAS below break-even',recommendation:'PAUSE'}], recommendation:'PAUSE' },
  { id:'4', name:'Retargeting — 30 Day', status:'ACTIVE', objective:'CONVERSIONS', total_spend:1800, total_revenue:5200, roas:2.88, waste_score:2, flags:[{flag_type:'CREATIVE_FATIGUE',severity:'MEDIUM',description:'High frequency, CTR dropping',recommendation:'REFRESH_CREATIVE'}], recommendation:'REFRESH_CREATIVE' },
  { id:'5', name:'Lookalike — Top Customers', status:'ACTIVE', objective:'CONVERSIONS', total_spend:2900, total_revenue:6100, roas:2.10, waste_score:1, flags:[], recommendation:'MONITOR' },
  { id:'6', name:'TikTok UGC — Cold', status:'PAUSED', objective:'CONVERSIONS', total_spend:980, total_revenue:420, roas:0.43, waste_score:8, flags:[{flag_type:'NEGATIVE_TREND',severity:'HIGH',description:'ROAS dropped 68% in 7 days',recommendation:'REDUCE_BUDGET'}], recommendation:'REDUCE_BUDGET' },
]

const RECO_LABEL: Record<string,string> = {
  PAUSE:'Pause now', SCALE:'Scale up', REFRESH_CREATIVE:'Refresh creative',
  MONITOR:'Monitor', REDUCE_BUDGET:'Reduce budget'
}
const RECO_STYLE: Record<string,{bg:string,color:string}> = {
  PAUSE:           { bg:'#ef4444', color:'#000' },
  SCALE:           { bg:'#34d399', color:'#000' },
  REFRESH_CREATIVE:{ bg:'#fbbf24', color:'#000' },
  MONITOR:         { bg:'#333',    color:'#888' },
  REDUCE_BUDGET:   { bg:'#f97316', color:'#000' },
}
const NAV = ['Dashboard','Campaigns','History','Meta Ads','Shopify']

function Dashboard() {
  const searchParams = useSearchParams()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [filter, setFilter] = useState<'all'|'flagged'|'healthy'>('all')
  const [isConnected, setIsConnected] = useState(false)
  const [showBanner, setShowBanner] = useState<'success'|'error'|null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      setIsConnected(true)
      setShowBanner('success')
      fetchRealData()
      setTimeout(() => setShowBanner(null), 5000)
    } else if (error) {
      const messages: Record<string,string> = {
        meta_denied: 'You denied Meta access. Please try again.',
        no_ad_accounts: 'No ad accounts found on this Facebook account.',
        oauth_failed: 'Connection failed. Check your Meta app settings.',
        no_code: 'OAuth code missing. Please try again.',
      }
      setErrorMsg(messages[error] || 'Connection failed.')
      setShowBanner('error')
      setTimeout(() => setShowBanner(null), 6000)
      loadDemo()
    } else {
      loadDemo()
    }
  }, [])

  const loadDemo = () => {
    setTimeout(() => { setCampaigns(DEMO); setLoading(false) }, 600)
  }

  const fetchRealData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      if (data.campaigns?.length > 0) {
        setCampaigns(data.campaigns)
        setIsConnected(true)
      } else {
        setCampaigns(DEMO)
      }
    } catch {
      setCampaigns(DEMO)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!isConnected) {
      window.location.href = '/api/auth/meta/connect'
      return
    }
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/ingest', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.success) {
        setSyncMsg(`Synced ${data.campaigns_synced} campaigns · ${data.flags_detected} flags detected`)
        await fetchRealData()
      } else {
        setSyncMsg(data.error || 'Sync failed')
      }
    } catch {
      setSyncMsg('Sync failed — check console')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }

  const totalSpend = campaigns.reduce((s,c) => s+c.total_spend, 0)
  const totalRev   = campaigns.reduce((s,c) => s+c.total_revenue, 0)
  const roas       = totalSpend > 0 ? totalRev/totalSpend : 0
  const wasted     = campaigns.filter(c => c.recommendation==='PAUSE').reduce((s,c) => s+c.total_spend, 0)
  const wastedPct  = totalSpend > 0 ? Math.round(wasted/totalSpend*100) : 0
  const flagCount  = campaigns.filter(c => c.flags.length > 0).length

  const filtered = campaigns.filter(c => {
    if (filter==='flagged') return c.flags.length > 0
    if (filter==='healthy') return c.flags.length === 0
    return true
  })

  const borderColor = (c: Campaign) =>
    c.waste_score >= 7 ? '#ef4444' : c.waste_score >= 3 ? '#fbbf24' : '#34d399'
  const roasColor = (r: number) =>
    r >= 2 ? '#34d399' : r >= 1 ? '#fbbf24' : '#ef4444'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:'100vh', background:'#111', fontFamily:"system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ background:'#0a0a0a', borderRight:'1px solid #1f1f1f', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #1f1f1f' }}>
          <div style={{ fontSize:'20px', fontWeight:900, letterSpacing:'-0.5px', color:'#fff' }}>
            Opti<span style={{ color:'#fbbf24' }}>Lens</span>
          </div>
          <div style={{ fontSize:'11px', color:'#444', marginTop:'3px' }}>Ad spend intelligence</div>
        </div>

        <div style={{ padding:'16px 12px', flex:1 }}>
          <div style={{ fontSize:'9px', color:'#333', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 8px', marginBottom:'8px' }}>Menu</div>
          {NAV.map((n,i) => (
            <div key={n} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'9px 10px', borderRadius:'7px', marginBottom:'2px',
              background: i===0 ? '#1a1a1a' : 'transparent',
              color: i===0 ? '#fbbf24' : '#555',
              fontSize:'13px', fontWeight: i===0 ? 700 : 400, cursor:'pointer',
            }}>{n}</div>
          ))}
        </div>

        <div style={{ padding:'16px', borderTop:'1px solid #1f1f1f' }}>
          {isConnected ? (
            <div style={{ background:'#052e1c', border:'1px solid #064e3b', borderRadius:'8px', padding:'10px 12px' }}>
              <div style={{ fontSize:'10px', color:'#34d399', fontWeight:700, marginBottom:'2px' }}>● Meta Ads connected</div>
              <div style={{ fontSize:'9px', color:'#1a4030' }}>Live data active</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'10px', color:'#333', marginBottom:'8px', textAlign:'center' }}>Meta Ads not connected</div>
              <button
                onClick={() => window.location.href = '/api/auth/meta/connect'}
                style={{ width:'100%', background:'#fbbf24', color:'#000', border:'none', padding:'10px', borderRadius:'8px', fontSize:'12px', fontWeight:900, cursor:'pointer' }}
              >
                + Connect Meta Ads
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ padding:'28px 32px', overflowY:'auto' }}>

        {showBanner === 'success' && (
          <div style={{ background:'#052e1c', border:'1px solid #064e3b', borderRadius:'10px', padding:'14px 20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#34d399' }}>✓ Meta Ads connected successfully</div>
              <div style={{ fontSize:'11px', color:'#1a4030', marginTop:'2px' }}>Your campaigns are being synced now</div>
            </div>
            <button onClick={() => setShowBanner(null)} style={{ background:'none', border:'none', color:'#1a4030', cursor:'pointer', fontSize:'16px' }}>×</button>
          </div>
        )}
        {showBanner === 'error' && (
          <div style={{ background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:'10px', padding:'14px 20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#f87171' }}>Connection failed</div>
              <div style={{ fontSize:'11px', color:'#7f1d1d', marginTop:'2px' }}>{errorMsg}</div>
            </div>
            <button onClick={() => setShowBanner(null)} style={{ background:'none', border:'none', color:'#7f1d1d', cursor:'pointer', fontSize:'16px' }}>×</button>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
          <div>
            <h1 style={{ fontSize:'24px', fontWeight:900, color:'#fff', letterSpacing:'-0.5px', margin:0 }}>Dashboard</h1>
            <p style={{ fontSize:'12px', color:'#444', marginTop:'3px' }}>
              {isConnected ? 'Live data · synced from Meta Ads' : 'Demo mode — connect Meta Ads to see real data'}
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              {!isConnected && (
                <span style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#555', fontSize:'11px', padding:'6px 12px', borderRadius:'20px' }}>
                  Demo mode
                </span>
              )}
              <button
                onClick={handleSync}
                disabled={syncing}
                style={{ background:'#fbbf24', color:'#000', border:'none', padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:800, cursor:'pointer', opacity: syncing ? 0.7 : 1 }}
              >
                {syncing ? 'Syncing...' : isConnected ? 'Sync now' : 'Connect Meta Ads'}
              </button>
            </div>
            {syncMsg && (
              <div style={{ fontSize:'11px', color: syncMsg.includes('failed') || syncMsg.includes('error') ? '#ef4444' : '#34d399' }}>
                {syncMsg}
              </div>
            )}
          </div>
        </div>

        {wasted > 0 && (
          <div style={{ background:'#fbbf24', borderRadius:'12px', padding:'20px 24px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'10px', fontWeight:800, color:'#78350f', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>
                {isConnected ? 'Action required — real data' : 'Action required — demo data'}
              </div>
              <div style={{ fontSize:'16px', fontWeight:900, color:'#000', letterSpacing:'-0.3px' }}>
                {flagCount} campaign{flagCount !== 1 ? 's' : ''} burning money with zero return
              </div>
              <div style={{ fontSize:'12px', color:'#92400e', marginTop:'3px' }}>
                Pause these immediately to stop the bleed
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'36px', fontWeight:900, color:'#000', letterSpacing:'-2px', lineHeight:1 }}>
                ${wasted.toLocaleString()}
              </div>
              <div style={{ fontSize:'11px', color:'#78350f', marginTop:'4px' }}>wasted this month</div>
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'12px', marginBottom:'24px' }}>
          {[
            { label:'Total spend',     value:`$${totalSpend.toLocaleString()}`, color:'#fff',     sub:'Last 30 days' },
            { label:'Revenue',         value:`$${totalRev.toLocaleString()}`,   color:'#34d399',  sub:'Meta attributed' },
            { label:'Blended ROAS',    value:`${roas.toFixed(2)}x`,             color: roasColor(roas), sub:'Target: 2.0x+' },
            { label:'Budget wasted',   value:`${wastedPct}%`,                   color:'#ef4444',  sub:`$${wasted.toLocaleString()} lost` },
          ].map(m => (
            <div key={m.label} style={{ background:'#0a0a0a', border:'1px solid #1f1f1f', borderRadius:'10px', padding:'16px' }}>
              <div style={{ fontSize:'10px', color:'#444', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px', fontWeight:600 }}>{m.label}</div>
              <div style={{ fontSize:'22px', fontWeight:900, color:m.color, letterSpacing:'-0.5px' }}>{m.value}</div>
              <div style={{ fontSize:'10px', color:'#333', marginTop:'4px' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div style={{ fontSize:'14px', fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>
            Campaign performance
            <span style={{ fontSize:'11px', color:'#444', fontWeight:400, marginLeft:'8px' }}>{filtered.length} campaigns</span>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            {(['all','flagged','healthy'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize:'11px', padding:'5px 12px', borderRadius:'6px', cursor:'pointer',
                border: filter===f ? 'none' : '1px solid #2a2a2a',
                background: filter===f ? '#fbbf24' : '#0a0a0a',
                color: filter===f ? '#000' : '#555',
                fontWeight: filter===f ? 800 : 400,
              }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 70px 80px 90px 120px', gap:'8px', padding:'0 16px', marginBottom:'6px' }}>
          {['Campaign','Spend','Revenue','ROAS','Waste','Health','Action'].map((h,i) => (
            <div key={h} style={{ fontSize:'9px', color:'#333', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', textAlign: i===0 ? 'left' : 'right' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#444', fontSize:'13px' }}>
            {isConnected ? 'Pulling your real campaigns from Meta...' : 'Loading demo data...'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {filtered.map(c => (
              <div key={c.id} style={{
                background:'#0a0a0a', border:'1px solid #1f1f1f',
                borderLeft:`3px solid ${borderColor(c)}`,
                borderRadius:'10px', padding:'14px 16px',
                display:'grid', gridTemplateColumns:'1fr 90px 90px 70px 80px 90px 120px',
                alignItems:'center', gap:'8px',
              }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{c.name}</div>
                  <div style={{ fontSize:'10px', color:'#444', marginTop:'2px' }}>
                    {c.objective} · <span style={{ color: c.status==='ACTIVE' ? '#34d399' : '#555' }}>{c.status}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:'13px', fontWeight:700, color:'#fff' }}>${c.total_spend.toLocaleString()}</div>
                <div style={{ textAlign:'right', fontSize:'13px', fontWeight:700, color: c.total_revenue > 0 ? '#fff' : '#ef4444' }}>
                  {c.total_revenue > 0 ? `$${c.total_revenue.toLocaleString()}` : '$0'}
                </div>
                <div style={{ textAlign:'right', fontSize:'13px', fontWeight:900, color: roasColor(c.roas) }}>{c.roas.toFixed(2)}x</div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'12px', fontWeight:800, color: c.waste_score>=7 ? '#ef4444' : c.waste_score>=3 ? '#fbbf24' : '#34d399' }}>
                    {c.waste_score}/10
                  </div>
                  <div style={{ height:'3px', background:'#1f1f1f', borderRadius:'2px', marginTop:'4px', width:'60px', marginLeft:'auto' }}>
                    <div style={{ height:'100%', borderRadius:'2px', width:`${c.waste_score*10}%`, background: c.waste_score>=7 ? '#ef4444' : c.waste_score>=3 ? '#fbbf24' : '#34d399' }}/>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {c.flags.length > 0 ? (
                    <span style={{ fontSize:'9px', background:'#450a0a', color:'#f87171', padding:'3px 6px', borderRadius:'4px', fontWeight:700 }}>
                      {c.flags[0].flag_type.replace(/_/g,' ')}
                    </span>
                  ) : (
                    <span style={{ fontSize:'10px', color:'#333' }}>—</span>
                  )}
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{
                    fontSize:'11px', fontWeight:800, padding:'5px 10px', borderRadius:'6px',
                    background: RECO_STYLE[c.recommendation]?.bg || '#333',
                    color: RECO_STYLE[c.recommendation]?.color || '#888',
                    whiteSpace:'nowrap',
                  }}>
                    {RECO_LABEL[c.recommendation] || c.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:'32px', paddingTop:'20px', borderTop:'1px solid #1f1f1f', display:'flex', justifyContent:'space-between' }}>
          <div style={{ fontSize:'11px', color:'#333' }}>OptiLens · Optimize every ad dollar</div>
          <div style={{ fontSize:'11px', color:'#333' }}>
            {isConnected ? '● Live data' : '● Demo mode — connect Meta Ads to see real campaigns'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ background:'#111', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#444', fontFamily:'system-ui' }}>
        Loading...
      </div>
    }>
      <Dashboard />
    </Suspense>
  )
}
