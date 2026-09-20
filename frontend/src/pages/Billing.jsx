import { useState } from 'react'
import { ChevronRight, Check, Zap } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'Try it out',
    features: [
      '3 meetings per month',
      'AI summary & key points',
      'Full transcript search',
      'No PDF export',
      'No AI chat',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/month',
    tagline: 'For regular use',
    featured: true,
    features: [
      'Up to 20 hours of meetings/month',
      'Everything in Free',
      'Unlimited PDF export',
      'AI chat on every meeting',
      'Priority processing',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: '/month',
    tagline: 'For small teams',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared meeting library',
      'Higher processing limits',
      'Priority support',
    ],
  },
]

export default function Billing() {
  const { user } = useAuth()
  const [notice, setNotice] = useState('')
  // No billing backend yet — everyone shows as Free until Stripe is wired up.
  const currentPlan = 'free'

  function handleUpgrade(planName) {
    setNotice(`${planName} isn't available for purchase yet — payments aren't wired up. Check back soon!`)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Billing</span>
            </nav>
          </div>
        </header>

        <main className="dash-content">
          <div className="page-head">
            <div>
              <h1>Billing</h1>
              <p>You're currently on the <strong>Free</strong> plan{user?.email ? ` (${user.email})` : ''}.</p>
            </div>
          </div>

          {notice && (
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid var(--border-accent)',
              color: 'var(--accent-dark)', borderRadius: 8, padding: '10px 14px',
              fontSize: '0.875rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap size={15} />
              {notice}
            </div>
          )}

          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card ${plan.featured ? 'featured' : ''} ${plan.id === currentPlan ? 'current' : ''}`}
              >
                {plan.featured && <span className="pricing-badge">Most popular</span>}
                <h3 className="heading-md">{plan.name}</h3>
                <p className="body-sm" style={{ color: 'var(--text-3)' }}>{plan.tagline}</p>
                <p className="pricing-price">
                  {plan.price}<span>{plan.period}</span>
                </p>

                <div className="pricing-features">
                  {plan.features.map((f) => (
                    <div key={f} className="pricing-feature">
                      <Check size={14} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {plan.id === currentPlan ? (
                  <button className="btn btn-ghost" disabled style={{ width: '100%', justifyContent: 'center' }}>
                    Current plan
                  </button>
                ) : (
                  <button
                    className={plan.featured ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="body-sm" style={{ color: 'var(--text-3)', marginTop: 24, textAlign: 'center' }}>
            Questions about billing? <a href="mailto:support@clario.app" style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>support@clario.app</a>
          </p>
        </main>
      </div>
    </div>
  )
}