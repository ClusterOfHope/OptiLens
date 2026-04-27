'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
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
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoOpti}>Opti</span>
          <span style={styles.logoLens}>Lens</span>
        </div>
        <div style={styles.progress}>Step {step + 1} of {totalSteps}</div>
      </nav>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      <div style={styles.container}>
        {step === 0 && (
          <Step eyebrow="Welcome" title="Tell us about your brand" sub="Just the basics — takes 30 seconds total.">
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Brand or company name</label>
              <input
                type="text"
                placeholder="Acme Co."
                value={data.company_name}
                onChange={(e) => setData({ ...data, company_name: e.target.value })}
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Website</label>
              <input
                type="text"
                placeholder="acme.com"
                value={data.website}
                onChange={(e) => setData({ ...data, website: e.target.value })}
                style={styles.input}
              />
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step eyebrow="Industry" title="What category are you in?" sub="Helps us benchmark your performance.">
            <OptionGrid
              options={['Apparel & Fashion', 'Beauty & Skincare', 'Health & Supplements', 'Home & Furniture', 'Food & Beverage', 'Tech & Electronics', 'Services', 'Other']}
              selected={data.industry}
              onSelect={(v) => setData({ ...data, industry: v })}
            />
          </Step>
        )}

        {step === 2 && (
          <Step eyebrow="Budget" title="Monthly Meta ad budget?" sub="Tunes our recommendations to your scale.">
            <OptionGrid
              options={['Under $5,000', '$5,000 – $25,000', '$25,000 – $100,000', '$100,000+']}
              selected={data.budget_range}
              onSelect={(v) => setData({ ...data, budget_range: v })}
              cols={2}
            />
          </Step>
        )}

        {step === 3 && (
          <Step eyebrow="One last thing" title="How'd you hear about us?" sub="Genuinely curious — helps us focus.">
            <OptionGrid
              options={['Reddit', 'Twitter / X', 'LinkedIn', 'A friend or colleague', 'Google search', 'Other']}
              selected={data.referral_source}
              onSelect={(v) => setData({ ...data, referral_source: v })}
              cols={2}
            />
          </Step>
        )}

        <div style={styles.actions}>
          {step > 0 && (
            <button onClick={handleBack} style={styles.backBtn}>← Back</button>
          )}
          <button
            onClick={handleNext}
            disabled={!isStepValid() || submitting}
            style={{
              ...styles.nextBtn,
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

function Step({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={styles.step}>
      <div style={styles.eyebrow}>{eyebrow}</div>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.sub}>{sub}</p>
      <div style={styles.fields}>{children}</div>
    </div>
  )
}

function OptionGrid({ options, selected, onSelect, cols = 2 }: { options: string[]; selected: string; onSelect: (v: string) => void; cols?: number }) {
  return (
    <div style={{ ...styles.optionGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{ ...styles.option, ...(selected === opt ? styles.optionSelected : {}) }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const colors = {
  bg: '#0A0B0E',
  surface: '#1A1D24',
  surfaceLight: '#22262F',
  border: '#2D3340',
  text: '#FFFFFF',
  textSecondary: '#A0A8B5',
  textTertiary: '#6B7280',
  amber: '#FBBF24',
  primary: '#FFFFFF',
}

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: colors.bg, minHeight: '100vh', color: colors.text,
    fontFamily: fonts.body, position: 'relative',
  },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '24px 32px', position: 'relative', zIndex: 2,
  },
  logo: { fontFamily: fonts.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  logoOpti: { color: colors.text },
  logoLens: { color: colors.amber },
  progress: { fontSize: 13, color: colors.textTertiary, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
  progressBar: { height: 2, background: colors.border, position: 'relative', zIndex: 2 },
  progressFill: { height: '100%', background: colors.amber, transition: 'width 0.3s ease' },
  container: { maxWidth: 640, margin: '0 auto', padding: '80px 32px 120px', position: 'relative', zIndex: 2 },
  step: { marginBottom: 48 },
  eyebrow: {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
    color: colors.amber, marginBottom: 16, textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.display, fontSize: 44, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 },
  sub: { fontSize: 17, color: colors.textSecondary, lineHeight: 1.5, marginBottom: 48 },
  fields: { display: 'flex', flexDirection: 'column', gap: 24 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: 500, letterSpacing: '0.02em' },
  input: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: '16px 18px', fontSize: 16, color: colors.text,
    fontFamily: fonts.body, outline: 'none', transition: 'border-color 0.2s',
  },
  optionGrid: { display: 'grid', gap: 12 },
  option: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: '18px 20px', fontSize: 15, color: colors.text,
    fontFamily: fonts.body, textAlign: 'left', transition: 'all 0.15s', fontWeight: 500,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  optionSelected: {
    background: 'rgba(251,191,36,0.1)',
    border: `1px solid ${colors.amber}`, color: colors.amber,
  },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 48 },
  backBtn: {
    background: 'transparent', border: 'none', color: colors.textSecondary,
    fontSize: 14, cursor: 'pointer', fontFamily: fonts.body, padding: '12px 8px',
  },
  nextBtn: {
    background: colors.primary, color: '#0A0B0E', border: 'none',
    padding: '16px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
    fontFamily: fonts.body, marginLeft: 'auto',
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
}
