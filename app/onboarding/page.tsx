'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useViewport } from '@/lib/useViewport'

export default function OnboardingPage() {
  const router = useRouter()
  const vp = useViewport()
  const isMobile = vp === 'mobile'

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    company_name: '',
    website: '',
    industry: '',
    budget_range: '',
    referral_source: '',
  })

  const totalSteps = 4

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1)
    else handleSubmit()
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        router.push('/dashboard?connected=true')
      } else {
        alert('Something went wrong saving your info. Try again?')
        setSubmitting(false)
      }
    } catch {
      alert('Network error. Try again?')
      setSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (step === 0) return data.company_name.trim() && data.website.trim()
    if (step === 1) return !!data.industry
    if (step === 2) return !!data.budget_range
    if (step === 3) return !!data.referral_source
    return false
  }

  return (
    <div style={S.page}>
      <nav style={{ ...S.nav, padding: isMobile ? '20px 20px' : '24px 32px' }}>
        <div style={{ ...S.logo, fontSize: isMobile ? 18 : 22 }}>
          <span style={S.logoOpti}>Opti</span>
          <span style={S.logoLens}>Lens</span>
        </div>
        <div style={S.progress}>Step {step + 1} of {totalSteps}</div>
      </nav>

      <div style={S.progressBar}>
        <div style={{ ...S.progressFill, width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      <div style={{
        ...S.container,
        padding: isMobile ? '50px 20px 80px' : '80px 32px 120px',
        maxWidth: isMobile ? '100%' : 640,
      }}>
        {step === 0 && (
          <Step
            eyebrow="Welcome"
            title="Tell us about your brand"
            sub="Just the basics — takes 30 seconds total."
            isMobile={isMobile}
          >
            <div style={S.fieldGroup}>
              <label style={S.label}>Brand or company name</label>
              <input
                type="text"
                placeholder="Acme Co."
                value={data.company_name}
                onChange={(e) => setData({ ...data, company_name: e.target.value })}
                style={S.input}
                autoFocus
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Website</label>
              <input
                type="text"
                placeholder="acme.com"
                value={data.website}
                onChange={(e) => setData({ ...data, website: e.target.value })}
                style={S.input}
              />
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step
            eyebrow="Industry"
            title="What category are you in?"
            sub="Helps us benchmark your performance."
            isMobile={isMobile}
          >
            <OptionGrid
              options={['Apparel & Fashion', 'Beauty & Skincare', 'Health & Supplements', 'Home & Furniture', 'Food & Beverage', 'Tech & Electronics', 'Services', 'Other']}
              selected={data.industry}
              onSelect={(v) => setData({ ...data, industry: v })}
              cols={isMobile ? 1 : 2}
            />
          </Step>
        )}

        {step === 2 && (
          <Step
            eyebrow="Budget"
            title="Monthly Meta ad budget?"
            sub="Tunes our recommendations to your scale."
            isMobile={isMobile}
          >
            <OptionGrid
              options={['Under $5,000', '$5,000 – $25,000', '$25,000 – $100,000', '$100,000+']}
              selected={data.budget_range}
              onSelect={(v) => setData({ ...data, budget_range: v })}
              cols={isMobile ? 1 : 2}
            />
          </Step>
        )}

        {step === 3 && (
          <Step
            eyebrow="One last thing"
            title="How'd you hear about us?"
            sub="Genuinely curious — helps us focus."
            isMobile={isMobile}
          >
            <OptionGrid
              options={['Reddit', 'Twitter / X', 'LinkedIn', 'A friend or colleague', 'Google search', 'Other']}
              selected={data.referral_source}
              onSelect={(v) => setData({ ...data, referral_source: v })}
              cols={isMobile ? 1 : 2}
            />
          </Step>
        )}

        <div style={{
          ...S.actions,
          flexDirection: isMobile ? 'column-reverse' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 12 : 16,
        }}>
          {step > 0 && (
            <button onClick={handleBack} style={S.backBtn}>← Back</button>
          )}
          <button
            onClick={handleNext}
            disabled={!isStepValid() || submitting}
            style={{
              ...S.nextBtn,
              width: isMobile ? '100%' : 'auto',
              marginLeft: isMobile ? 0 : 'auto',
              opacity: isStepValid() && !submitting ? 1 : 0.4,
              cursor: isStepValid() && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Saving...' : step === totalSteps - 1 ? 'Take me to my dashboard →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Step({ eyebrow, title, sub, children, isMobile }: { eyebrow: string; title: string; sub: string; children: React.ReactNode; isMobile: boolean }) {
  return (
    <div style={S.step}>
      <div style={S.eyebrow}>{eyebrow}</div>
      <h1 style={{ ...S.title, fontSize: isMobile ? 30 : 44 }}>{title}</h1>
      <p style={{ ...S.sub, fontSize: isMobile ? 15 : 17 }}>{sub}</p>
      <div style={S.fields}>{children}</div>
    </div>
  )
}

function OptionGrid({ options, selected, onSelect, cols = 2 }: { options: string[]; selected: string; onSelect: (v: string) => void; cols?: number }) {
  return (
    <div style={{ ...S.optionGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{ ...S.option, ...(selected === opt ? S.optionSelected : {}) }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const C = {
  bg: '#0A0B0E',
  surface: '#2D2D2D',
  surfaceLight: '#383838',
  border: '#444444',
  text: '#FFFFFF',
  textSecondary: '#A0A8B5',
  textTertiary: '#6B7280',
  amber: '#FBBF24',
  primary: '#FFFFFF',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
}

const S: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg, minHeight: '100vh', color: C.text,
    fontFamily: F.body, position: 'relative',
    overflowX: 'hidden',
  },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'relative', zIndex: 2,
  },
  logo: { fontFamily: F.display, fontWeight: 600, letterSpacing: '-0.02em' },
  logoOpti: { color: C.text },
  logoLens: { color: C.amber },
  progress: { fontSize: 13, color: C.textTertiary, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
  progressBar: { height: 2, background: C.border, position: 'relative', zIndex: 2 },
  progressFill: { height: '100%', background: C.amber, transition: 'width 0.3s ease' },
  container: { margin: '0 auto', position: 'relative', zIndex: 2 },
  step: { marginBottom: 48 },
  eyebrow: {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
    color: C.amber, marginBottom: 16, textTransform: 'uppercase',
  },
  title: { fontFamily: F.display, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 },
  sub: { color: C.textSecondary, lineHeight: 1.5, marginBottom: 40 },
  fields: { display: 'flex', flexDirection: 'column', gap: 24 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 13, color: C.textSecondary, fontWeight: 500, letterSpacing: '0.02em' },
  input: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '14px 16px', fontSize: 16, color: C.text,
    fontFamily: F.body, outline: 'none', width: '100%',
  },
  optionGrid: { display: 'grid', gap: 10 },
  option: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '16px 18px', fontSize: 15, color: C.text,
    fontFamily: F.body, textAlign: 'left', transition: 'all 0.15s', fontWeight: 500,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  optionSelected: {
    background: 'rgba(251,191,36,0.1)',
    border: `1px solid ${C.amber}`, color: C.amber,
  },
  actions: { display: 'flex', justifyContent: 'space-between', marginTop: 40 },
  backBtn: {
    background: 'transparent', border: 'none', color: C.textSecondary,
    fontSize: 14, cursor: 'pointer', fontFamily: F.body, padding: '12px 8px',
  },
  nextBtn: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    padding: '15px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
    fontFamily: F.body,
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
}
