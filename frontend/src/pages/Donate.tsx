import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle, Users, Link as LinkIcon } from 'lucide-react'

interface NGO {
  id: string
  name: string
  cause: string
  score: number
  donors: number
  traceable: number
  flag: boolean
}

const ngos: NGO[] = [
  { id: '1', name: 'EduAfrica Foundation', cause: 'Education in Sub-Saharan Africa', score: 82, donors: 143, traceable: 78, flag: false },
  { id: '2', name: 'WaterNow Initiative', cause: 'Clean water access projects', score: 94, donors: 89, traceable: 100, flag: false },
  { id: '3', name: 'HealthKits Africa', cause: 'Medical supply distribution', score: 61, donors: 34, traceable: 45, flag: true },
]

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#4A7C59' : score >= 60 ? '#BA7517' : '#B93C3C'
  const size = 52
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(44,36,22,0.08)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
        <text
          x={size / 2} y={size / 2 + 5}
          textAnchor="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
          fill={color} fontSize={13} fontWeight={700} fontFamily="DM Sans, sans-serif"
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: '#a89a8a' }}>score</span>
    </div>
  )
}

export default function Donate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null)
  const [amount, setAmount] = useState('')
  const txHash = `tx_${Math.random().toString(36).slice(2, 10)}`

  const handleSelect = (ngo: NGO) => { setSelectedNGO(ngo); setStep(1) }
  const handleTrustline = () => setStep(2)
  const handleDonate = () => { if (Number(amount) > 0) setStep(3) }

  // ── Step 0: Choose NGO ─────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#2C2416', marginBottom: 4 }}>Choose a campaign</h1>
        <p style={{ fontSize: 14, color: '#8a7a6a' }}>Reputation scores are calculated in real time from on-chain activity.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ngos.map(ngo => (
          <div
            key={ngo.id}
            className="glass-card"
            onClick={() => handleSelect(ngo)}
            style={{
              padding: '18px 22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,124,89,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
          >
            <ScoreRing score={ngo.score} />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#2C2416' }}>{ngo.name}</span>
                {ngo.flag && (
                  <span className="badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> Flag active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 10 }}>{ngo.cause}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#a89a8a' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> {ngo.donors} donors
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LinkIcon size={12} /> {ngo.traceable}% traceable
                </span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#4A7C59', fontWeight: 600 }}>Donate →</div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Step 1: Trustline ──────────────────────────────────────────────────────
  if (step === 1 && selectedNGO) return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <button onClick={() => setStep(0)} className="btn-ghost" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="glass-card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C2416', marginBottom: 6 }}>Set up your receipt token</h2>
        <p style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 24, lineHeight: 1.6 }}>
          Your wallet needs a one-time authorisation to receive <strong>DONO</strong> tokens from {selectedNGO.name}.
          These tokens are your verified proof of donation — not currency.
        </p>

        <div
          style={{
            background: 'rgba(74, 124, 89, 0.05)',
            border: '1px solid rgba(74, 124, 89, 0.12)',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {[
            ['Token name', 'DONO'],
            ['Issuer', 'rISSU...nG4a'],
            ['Campaign', selectedNGO.name],
            ['Reserve required', '0.2 XRP (one-time)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#8a7a6a' }}>
              <span>{k}</span>
              <span style={{ color: '#2C2416', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'rgba(74, 124, 89, 0.08)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 22,
            fontSize: 12,
            color: '#3a6347',
            lineHeight: 1.6,
          }}
        >
          Once authorised, every XRP you donate automatically generates 1 DONO — your on-chain proof that the donation happened.
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={handleTrustline}>
          Authorise receipt token
        </button>
      </div>
    </div>
  )

  // ── Step 2: Amount ─────────────────────────────────────────────────────────
  if (step === 2 && selectedNGO) return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <button onClick={() => setStep(1)} className="btn-ghost" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="glass-card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C2416', marginBottom: 4 }}>
          Donate to {selectedNGO.name}
        </h2>
        <p style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 24 }}>1 XRP donated = 1 DONO receipt token</p>

        <label style={{ fontSize: 12, color: '#8a7a6a', display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Amount (XRP)
        </label>
        <input
          className="input-field"
          type="number"
          min="1"
          placeholder="e.g. 50"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ marginBottom: 16, fontSize: 20 }}
        />

        {Number(amount) > 0 && (
          <div
            style={{
              background: 'rgba(74, 124, 89, 0.07)',
              border: '1px solid rgba(74, 124, 89, 0.15)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#3a6347' }}>You send</span>
              <span style={{ fontWeight: 600, color: '#4A7C59' }}>{amount} XRP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#3a6347' }}>You receive</span>
              <span style={{ fontWeight: 600, color: '#4A7C59' }}>{amount} DONO</span>
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(74, 124, 89, 0.12)',
                paddingTop: 8,
                fontSize: 11,
                color: '#6b9a78',
              }}
            >
              To: {selectedNGO.name} · XRPL testnet
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          disabled={!(Number(amount) > 0)}
          onClick={handleDonate}
        >
          Send on XRPL
        </button>
      </div>
    </div>
  )

  // ── Step 3: Success ────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: 36, textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(74, 124, 89, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle size={36} color="#4A7C59" />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#2C2416', marginBottom: 8 }}>Donation confirmed</h2>
        <p style={{ fontSize: 14, color: '#8a7a6a', marginBottom: 28, lineHeight: 1.7 }}>
          You sent <strong>{amount} XRP</strong> to <strong>{selectedNGO?.name}</strong> and received{' '}
          <strong>{amount} DONO</strong> as your verified donation receipt.
        </p>

        <div
          style={{
            background: 'rgba(74, 124, 89, 0.05)',
            border: '1px solid rgba(74, 124, 89, 0.1)',
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            fontSize: 13,
            textAlign: 'left',
          }}
        >
          {[
            ['Receipt ID', txHash],
            ['DONO received', `${amount} tokens`],
            ['Campaign', selectedNGO?.name ?? ''],
            ['Status', '✓ Verified'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#8a7a6a' }}>
              <span>{k}</span>
              <span style={{ color: k === 'Status' ? '#4A7C59' : '#2C2416', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setStep(0); setAmount(''); setSelectedNGO(null) }}>
            Donate again
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
            View my impact →
          </button>
        </div>
      </div>
    </div>
  )
}
