import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Upload, CheckCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

interface ReputationScore {
  donorParticipation: number
  proofCoverage: number
  onChainRate: number
  milestones: number
  anomalyResolution: number
}

interface Transaction {
  id: string
  type: 'in' | 'out'
  party: string
  amount: number
  age: string
  proof: string | null
  status: 'on-chain' | 'receipt' | 'pending'
}

interface Flag {
  id: string
  rule: string
  amount: number | null
  status: 'Needs explanation' | 'Under review' | 'Resolved' | 'Penalized'
  age: string
}

const ngoData: Record<string, {
  name: string
  cause: string
  wallet: string
  balance: number
  donoIssued: number
  reputation: ReputationScore
  transactions: Transaction[]
  flags: Flag[]
}> = {
  '1': {
    name: 'EduAfrica Foundation',
    cause: 'Education in Sub-Saharan Africa',
    wallet: 'rNGO...tX9f',
    balance: 486,
    donoIssued: 247,
    reputation: {
      donorParticipation: 88,
      proofCoverage: 72,
      onChainRate: 78,
      milestones: 80,
      anomalyResolution: 95,
    },
    transactions: [
      { id: 'tx1', type: 'in', party: 'r3xK...f9aB', amount: 150, age: '2 days ago', proof: null, status: 'on-chain' },
      { id: 'tx2', type: 'out', party: 'School supplies wallet', amount: 90, age: '1 day ago', proof: 'receipt_school_01.pdf', status: 'on-chain' },
      { id: 'tx3', type: 'out', party: 'Field operations', amount: 36, age: '18h ago', proof: 'bank_receipt_fieldops.pdf', status: 'receipt' },
      { id: 'tx4', type: 'out', party: 'Admin reserve', amount: 24, age: '6 days ago', proof: null, status: 'pending' },
      { id: 'tx5', type: 'in', party: 'rBob...a3Kp', amount: 72, age: '3 days ago', proof: null, status: 'on-chain' },
    ],
    flags: [
      { id: 'f1', rule: 'Funds moved with no proof uploaded within 7 days', amount: 24, status: 'Needs explanation', age: '6 days ago' },
      { id: 'f2', rule: 'High proportion of funds moved without receipts', amount: null, status: 'Under review', age: '2 days ago' },
    ],
  },
  '2': {
    name: 'WaterNow Initiative',
    cause: 'Clean water access projects',
    wallet: 'rWTR...mN2z',
    balance: 1240,
    donoIssued: 89,
    reputation: {
      donorParticipation: 96,
      proofCoverage: 100,
      onChainRate: 100,
      milestones: 85,
      anomalyResolution: 100,
    },
    transactions: [
      { id: 'tx1', type: 'in', party: 'rBob...a3Kp', amount: 72, age: '3 days ago', proof: null, status: 'on-chain' },
      { id: 'tx2', type: 'out', party: 'Well construction wallet', amount: 60, age: '2 days ago', proof: 'well_progress_01.pdf', status: 'on-chain' },
    ],
    flags: [],
  },
  '3': {
    name: 'HealthKits Africa',
    cause: 'Medical supply distribution',
    wallet: 'rHLT...pQ7c',
    balance: 142,
    donoIssued: 34,
    reputation: {
      donorParticipation: 52,
      proofCoverage: 40,
      onChainRate: 45,
      milestones: 60,
      anomalyResolution: 70,
    },
    transactions: [
      { id: 'tx1', type: 'in', party: 'rAli...f2Xp', amount: 25, age: '5 days ago', proof: null, status: 'on-chain' },
      { id: 'tx2', type: 'out', party: 'External account', amount: 80, age: '4 days ago', proof: null, status: 'pending' },
    ],
    flags: [
      { id: 'f1', rule: 'Treasury drained too quickly relative to inflows', amount: 80, status: 'Penalized', age: '4 days ago' },
    ],
  },
}

function computeScore(r: ReputationScore): number {
  return Math.round(
    r.donorParticipation * 0.25 +
    r.proofCoverage * 0.25 +
    r.onChainRate * 0.20 +
    r.milestones * 0.15 +
    r.anomalyResolution * 0.15
  )
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = value >= 80 ? '#4A7C59' : value >= 60 ? '#BA7517' : '#B93C3C'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <span style={{ color: '#2C2416' }}>{label}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#a89a8a', fontSize: 11 }}>{weight} weight</span>
          <span style={{ fontWeight: 600, color }}>{value}</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(44,36,22,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

const flagStatusColor = (status: Flag['status']) => {
  if (status === 'Resolved') return { bg: 'rgba(74,124,89,0.1)', text: '#3a6347' }
  if (status === 'Under review') return { bg: 'rgba(186,117,23,0.1)', text: '#8a5510' }
  if (status === 'Penalized') return { bg: 'rgba(185,60,60,0.1)', text: '#9b2e2e' }
  return { bg: 'rgba(186,117,23,0.1)', text: '#8a5510' }
}

export default function NGOProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const data = ngoData[id ?? '1']

  const [uploadTarget, setUploadTarget] = useState<string | null>(null)
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [explaining, setExplaining] = useState<string | null>(null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [submittedExplanations, setSubmittedExplanations] = useState<Record<string, boolean>>({})

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#8a7a6a' }}>NGO not found.</div>
  )

  const score = computeScore(data.reputation)
  const scoreColor = score >= 80 ? '#4A7C59' : score >= 60 ? '#BA7517' : '#B93C3C'

  const handleUpload = (txId: string) => {
    setUploads(prev => ({ ...prev, [txId]: 'proof_document.pdf' }))
    setUploadTarget(null)
  }

  const handleExplainSubmit = (flagId: string) => {
    setSubmittedExplanations(prev => ({ ...prev, [flagId]: true }))
    setExplaining(null)
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Back */}
      <button
        className="btn-ghost"
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="glass" style={{ padding: '24px 28px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#2C2416', marginBottom: 4 }}>{data.name}</h1>
          <p style={{ fontSize: 14, color: '#8a7a6a', marginBottom: 6 }}>{data.cause}</p>
          <span style={{ fontSize: 12, color: '#a89a8a', fontFamily: 'monospace' }}>{data.wallet}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: `4px solid ${scoreColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor, fontFamily: 'Playfair Display, serif' }}>
              {score}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#a89a8a', marginTop: 5 }}>reputation</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Treasury balance', val: `${data.balance} XRP` },
          { label: 'DONO issued', val: `${data.donoIssued} tokens` },
          { label: 'Active flags', val: String(data.flags.filter(f => f.status !== 'Resolved').length) },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#2C2416' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Left: Reputation breakdown + Flags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Reputation breakdown */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2416', marginBottom: 18 }}>Reputation breakdown</div>
            <ScoreBar label="Donor participation" value={data.reputation.donorParticipation} weight="25%" />
            <ScoreBar label="Proof coverage" value={data.reputation.proofCoverage} weight="25%" />
            <ScoreBar label="On-chain traceability" value={data.reputation.onChainRate} weight="20%" />
            <ScoreBar label="Milestone completion" value={data.reputation.milestones} weight="15%" />
            <ScoreBar label="Flag resolution speed" value={data.reputation.anomalyResolution} weight="15%" />
            <div
              style={{
                marginTop: 6,
                paddingTop: 14,
                borderTop: '1px solid rgba(44,36,22,0.07)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
            >
              <span style={{ color: '#8a7a6a', fontWeight: 500 }}>Overall score</span>
              <span style={{ fontWeight: 700, color: scoreColor, fontSize: 16 }}>{score} / 100</span>
            </div>
          </div>

          {/* Active flags */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2416', marginBottom: 16 }}>
              Active flags {data.flags.length > 0 && (
                <span className="badge-red" style={{ marginLeft: 8 }}>{data.flags.length}</span>
              )}
            </div>

            {data.flags.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4A7C59', fontSize: 13 }}>
                <CheckCircle size={16} /> No active flags — looking healthy
              </div>
            ) : (
              data.flags.map(flag => {
                const { bg, text } = flagStatusColor(flag.status)
                const submitted = submittedExplanations[flag.id]
                return (
                  <div
                    key={flag.id}
                    style={{
                      background: 'rgba(185,60,60,0.04)',
                      border: '1px solid rgba(185,60,60,0.12)',
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <AlertTriangle size={14} color="#B93C3C" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#2C2416', lineHeight: 1.4 }}>{flag.rule}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#a89a8a' }}>{flag.age}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, background: bg, color: text, padding: '2px 8px', borderRadius: 12 }}>
                        {submitted ? 'Explanation submitted' : flag.status}
                      </span>
                    </div>

                    {!submitted && flag.status !== 'Resolved' && (
                      <div style={{ marginTop: 10 }}>
                        {explaining === flag.id ? (
                          <div>
                            <textarea
                              placeholder="Provide your explanation for this flag..."
                              value={explanations[flag.id] ?? ''}
                              onChange={e => setExplanations(prev => ({ ...prev, [flag.id]: e.target.value }))}
                              style={{
                                width: '100%',
                                minHeight: 72,
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid rgba(44,36,22,0.15)',
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: 13,
                                color: '#2C2416',
                                background: 'rgba(255,253,248,0.8)',
                                resize: 'vertical',
                                outline: 'none',
                                boxSizing: 'border-box',
                                marginBottom: 8,
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setExplaining(null)}>
                                Cancel
                              </button>
                              <button
                                className="btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => handleExplainSubmit(flag.id)}
                              >
                                Submit explanation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn-ghost"
                            style={{ fontSize: 12, padding: '6px 14px', marginTop: 4 }}
                            onClick={() => setExplaining(flag.id)}
                          >
                            Explain this flag
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Transactions + proof upload */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2416', marginBottom: 16 }}>
            Treasury transactions
          </div>

          {data.transactions.map((tx, i) => {
            const attached = uploads[tx.id] ?? tx.proof
            const isExpanded = uploadTarget === tx.id

            return (
              <div
                key={tx.id}
                style={{
                  padding: '12px 0',
                  borderBottom: i < data.transactions.length - 1 ? '1px solid rgba(44,36,22,0.07)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* In/out indicator */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: tx.type === 'in' ? 'rgba(74,124,89,0.1)' : 'rgba(44,36,22,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: tx.type === 'in' ? '#4A7C59' : '#8a7a6a',
                      flexShrink: 0,
                    }}
                  >
                    {tx.type === 'in' ? '↓' : '↑'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#2C2416', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {tx.type === 'in' ? `From ${tx.party}` : `To ${tx.party}`}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'in' ? '#4A7C59' : '#2C2416', flexShrink: 0, marginLeft: 8 }}>
                        {tx.type === 'in' ? '+' : '−'}{tx.amount} XRP
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#a89a8a' }}>{tx.age}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {tx.status === 'on-chain' && <span className="badge-green">Verified</span>}
                        {tx.status === 'receipt' && <span className="badge-amber">Receipt</span>}
                        {tx.status === 'pending' && <span className="badge-grey">Pending</span>}
                        {attached && <span style={{ fontSize: 11, color: '#4A7C59' }}>📎 {attached}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Proof toggle (only for outgoing without proof) */}
                  {tx.type === 'out' && (
                    <button
                      onClick={() => setUploadTarget(isExpanded ? null : tx.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#8a7a6a',
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>

                {/* Proof upload panel */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      background: 'rgba(74,124,89,0.04)',
                      border: '1px solid rgba(74,124,89,0.1)',
                      borderRadius: 8,
                    }}
                  >
                    {attached ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A7C59' }}>
                        <CheckCircle size={14} /> Proof attached: {attached}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 8 }}>
                          Attach a bank receipt, invoice, or photo to verify this transfer.
                        </div>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => handleUpload(tx.id)}
                        >
                          <Upload size={13} /> Upload proof document
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
