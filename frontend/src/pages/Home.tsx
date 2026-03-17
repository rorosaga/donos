import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, TreePine, ScanLine } from 'lucide-react'

const features = [
  {
    icon: <ShieldCheck size={22} color="#4A7C59" />,
    title: 'Verified receipts',
    desc: 'Every donation mints a receipt token on XRPL — immutable proof that your gift happened.',
  },
  {
    icon: <TreePine size={22} color="#4A7C59" />,
    title: 'Your impact tree',
    desc: 'Watch your personal tree grow with every donation. Each branch links to real-world outcomes.',
  },
  {
    icon: <ScanLine size={22} color="#4A7C59" />,
    title: 'Full fund traceability',
    desc: 'Follow money from your wallet all the way to the project — on-chain or with attached receipts.',
  },
]

const stats = [
  { val: '1,240', label: 'donations verified' },
  { val: '94%', label: 'funds traceable' },
  { val: '18', label: 'NGOs active' },
  { val: '6,800', label: 'DONO issued' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Hero */}
      <div
        className="glass"
        style={{ padding: '64px 48px', textAlign: 'center', marginBottom: 20, marginTop: 8 }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(74, 124, 89, 0.1)',
            color: '#4A7C59',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1.2,
            padding: '4px 14px',
            borderRadius: 20,
            marginBottom: 20,
            textTransform: 'uppercase',
          }}
        >
          XRPL Commons Hackathon
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 600, color: '#2C2416', lineHeight: 1.2, marginBottom: 16 }}>
          Trace every donation<br />
          <span style={{ color: '#4A7C59', fontStyle: 'italic' }}>from wallet to real-world impact.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#6b5d4f', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Donos connects donors directly to outcomes. Send XRP, receive a verified receipt,
          and watch exactly where your money goes — no trust required.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/donate')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Donate now <ArrowRight size={16} />
          </button>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            View my impact
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="glass"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          marginBottom: 20,
          padding: '20px 0',
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid rgba(44, 36, 22, 0.08)' : 'none',
              padding: '8px 16px',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 600, color: '#4A7C59', fontFamily: 'Playfair Display, serif' }}>
              {s.val}
            </div>
            <div style={{ fontSize: 12, color: '#8a7a6a', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {features.map((f, i) => (
          <div key={i} className="glass-card" style={{ padding: 24 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(74, 124, 89, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {f.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#2C2416' }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: '#6b5d4f', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="glass" style={{ padding: '32px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#2C2416', marginBottom: 28, textAlign: 'center' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
          {[
            { step: '01', title: 'Choose an NGO', desc: 'Browse verified campaigns with live reputation scores.' },
            { step: '02', title: 'Send XRP', desc: 'Donate any amount — your wallet sends directly to the NGO treasury.' },
            { step: '03', title: 'Receive receipt', desc: 'You instantly receive DONO tokens as your verified donation receipt.' },
            { step: '04', title: 'Track the impact', desc: 'Follow every fund movement, see proofs, watch your tree grow.' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#4A7C59',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  margin: '0 auto 12px',
                  fontFamily: 'Playfair Display, serif',
                }}
              >
                {item.step}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2416', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#6b5d4f', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn-primary" onClick={() => navigate('/donate')}>
            Get started →
          </button>
        </div>
      </div>

    </div>
  )
}
