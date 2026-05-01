'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useViewport } from './useViewport'

type User = {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  company_name: string | null
  subscription_status: string
}

interface Props {
  children: React.ReactNode
  pageTitle: string
  pageSubtitle?: string
  rightActions?: React.ReactNode
}

export function DashboardLayout({ children, pageTitle, pageSubtitle, rightActions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const vp = useViewport()
  const isMobile = vp === 'mobile'

  const [user, setUser] = useState<User | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) { router.push('/'); return }
        setUser(d.user)
      })
      .catch(() => router.push('/'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Campaigns', href: '/campaigns' },
    { label: 'History', href: '/history' },
    { label: 'Meta Ads', href: '/meta-ads' },
    { label: 'Shopify', href: '/shopify' },
  ]

  if (!user) {
    return <div style={S.loadingPage}><div style={S.loadingText}>Loading...</div></div>
  }

  const sidebar = (
    <aside style={{
      ...S.sidebar,
      ...(isMobile ? S.sidebarMobile : {}),
      ...(isMobile && !showSidebar ? { transform: 'translateX(-100%)' } : {}),
    }}>
      <div style={S.sidebarTop}>
        <Link href="/dashboard" style={S.logoLink}>
          <div style={S.logo}>
            <span style={S.logoOpti}>Opti</span>
            <span style={S.logoLens}>Lens</span>
          </div>
          <div style={S.tagline}>Ad spend intelligence</div>
        </Link>
      </div>
      <nav style={S.menu}>
        <div style={S.menuLabel}>MENU</div>
        {menuItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ ...S.menuItem, ...(active ? S.menuItemActive : {}) }}
              onClick={() => setShowSidebar(false)}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div style={S.sidebarBottom}>
        <div style={S.betaBadge}>
          <span style={S.betaDot} />
          BETA · Free for life
        </div>
      </div>
    </aside>
  )

  return (
    <div style={{ ...S.page, gridTemplateColumns: isMobile ? '1fr' : '240px 1fr' }}>
      {!isMobile && sidebar}
      {isMobile && showSidebar && (
        <>
          <div onClick={() => setShowSidebar(false)} style={S.overlay} />
          {sidebar}
        </>
      )}

      <main style={{ ...S.main, padding: isMobile ? '16px 16px 60px' : '32px 40px 80px' }}>
        <div style={{
          ...S.topbar,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 16 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setShowSidebar(true)} style={S.hamburger}>
                <span style={S.hamburgerLine} />
                <span style={S.hamburgerLine} />
                <span style={S.hamburgerLine} />
              </button>
            )}
            <div>
              <h1 style={{ ...S.title, fontSize: isMobile ? 26 : 36 }}>{pageTitle}</h1>
              {pageSubtitle && <div style={S.subtitle}>{pageSubtitle}</div>}
            </div>
          </div>
          <div style={{
            ...S.topActions,
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            {rightActions}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={S.avatarBtn}>
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user.name} style={S.avatar} />
                ) : (
                  <div style={S.avatarFallback}>{user.name?.[0] || '?'}</div>
                )}
              </button>
              {showMenu && (
                <div style={S.dropdown}>
                  <div style={S.dropdownHeader}>
                    <div style={S.dropdownName}>{user.name}</div>
                    <div style={S.dropdownEmail}>{user.email || 'No email on file'}</div>
                  </div>
                  <button onClick={handleLogout} style={S.dropdownItem}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', bgSecondary: '#101218',
  surface: '#2C3E50', surfaceLight: '#34495E',
  border: '#3D5166',
  text: '#FFFFFF', textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  primary: '#FFFFFF', amber: '#FBBF24',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const S: Record<string, React.CSSProperties> = {
  loadingPage: {
    background: C.bg, color: C.textSecondary, minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body,
  },
  loadingText: { fontSize: 14, fontFamily: F.mono },
  page: {
    display: 'grid', background: C.bg, color: C.text, fontFamily: F.body,
    minHeight: '100vh', position: 'relative',
  },
  sidebar: {
    background: C.bgSecondary, borderRight: `1px solid ${C.border}`,
    padding: '28px 20px', display: 'flex', flexDirection: 'column',
    position: 'relative', zIndex: 2,
  },
  sidebarMobile: {
    position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 200,
    transition: 'transform 0.3s ease', boxShadow: '8px 0 24px rgba(0,0,0,0.5)',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 },
  sidebarTop: { marginBottom: 40 },
  logoLink: { textDecoration: 'none' },
  logo: { fontFamily: F.display, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 },
  logoOpti: { color: C.text },
  logoLens: { color: C.amber },
  tagline: { fontSize: 11, color: C.textTertiary, letterSpacing: '0.02em' },
  menu: { flex: 1, display: 'flex', flexDirection: 'column' },
  menuLabel: {
    fontSize: 10, fontWeight: 600, color: C.textTertiary,
    letterSpacing: '0.15em', marginBottom: 12, paddingLeft: 12,
  },
  menuItem: {
    display: 'block', padding: '10px 12px', color: C.textSecondary,
    fontSize: 14, fontWeight: 500, borderRadius: 6, marginBottom: 2, textDecoration: 'none',
  },
  menuItemActive: { background: C.surface, color: C.amber },
  sidebarBottom: { marginTop: 'auto' },
  betaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'rgba(251,191,36,0.1)',
    border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 100,
    fontSize: 11, fontWeight: 600, color: C.amber, letterSpacing: '0.02em',
  },
  betaDot: { width: 6, height: 6, background: C.amber, borderRadius: '50%', boxShadow: `0 0 8px ${C.amber}` },
  main: { position: 'relative', zIndex: 2, overflow: 'auto' },
  topbar: { display: 'flex', justifyContent: 'space-between', marginBottom: 24 },
  hamburger: {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
    width: 40, height: 40, padding: 0,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', gap: 4, cursor: 'pointer',
  },
  hamburgerLine: { width: 18, height: 2, background: C.text, borderRadius: 1 },
  title: { fontFamily: F.display, fontWeight: 500, letterSpacing: '-0.02em', color: C.text },
  subtitle: { fontSize: 12, color: C.textTertiary, marginTop: 4 },
  topActions: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarBtn: {
    width: 36, height: 36, borderRadius: '50%',
    border: `1px solid ${C.border}`, padding: 0, overflow: 'hidden',
    cursor: 'pointer', background: C.surface,
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: C.surface, color: C.text, fontSize: 14, fontWeight: 600,
  },
  dropdown: {
    position: 'absolute', top: 48, right: 0,
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, minWidth: 220,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 50,
  },
  dropdownHeader: { padding: '14px 16px', borderBottom: `1px solid ${C.border}` },
  dropdownName: { fontSize: 14, fontWeight: 600 },
  dropdownEmail: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  dropdownItem: {
    width: '100%', padding: '12px 16px', background: 'transparent',
    border: 'none', color: C.text, fontSize: 13, textAlign: 'left',
    cursor: 'pointer', fontFamily: F.body,
  },
}
