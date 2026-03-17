import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Donation {
  id: number
  ngo: string
  ngoId: string
  amount: number
  status: 'active' | 'new'
  proofs: number
  pct: number
  daysActive: number
  story: string
  txPath: { label: string; amount: number; type: 'verified' | 'receipt' | 'pending' }[]
}

// ── Data ──────────────────────────────────────────────────────────────────────
const donations: Donation[] = [
  {
    id: 1, ngo: 'EduAfrica Foundation', ngoId: '1', amount: 150,
    status: 'active', proofs: 3, pct: 84, daysActive: 12,
    story: 'Funded school supplies for 30 students in Nairobi.',
    txPath: [
      { label: 'You donated', amount: 150, type: 'verified' },
      { label: 'EduAfrica received', amount: 150, type: 'verified' },
      { label: 'School supplies', amount: 90, type: 'verified' },
      { label: 'Field operations', amount: 36, type: 'receipt' },
    ],
  },
  {
    id: 2, ngo: 'WaterNow Initiative', ngoId: '2', amount: 72,
    status: 'active', proofs: 2, pct: 100, daysActive: 8,
    story: 'Well construction in Kisumu reached 60% completion.',
    txPath: [
      { label: 'You donated', amount: 72, type: 'verified' },
      { label: 'WaterNow received', amount: 72, type: 'verified' },
      { label: 'Well construction', amount: 60, type: 'verified' },
    ],
  },
  {
    id: 3, ngo: 'SolarVillages', ngoId: '3', amount: 60,
    status: 'active', proofs: 2, pct: 75, daysActive: 5,
    story: 'Solar panels installed across 3 rural villages in Tanzania.',
    txPath: [
      { label: 'You donated', amount: 60, type: 'verified' },
      { label: 'SolarVillages received', amount: 60, type: 'verified' },
      { label: 'Panel installation', amount: 45, type: 'receipt' },
    ],
  },
  {
    id: 4, ngo: 'FoodBank Kenya', ngoId: '4', amount: 50,
    status: 'active', proofs: 1, pct: 60, daysActive: 15,
    story: 'Provided 200 meals to families in Mombasa this week.',
    txPath: [
      { label: 'You donated', amount: 50, type: 'verified' },
      { label: 'FoodBank received', amount: 50, type: 'verified' },
      { label: 'Food distribution', amount: 30, type: 'receipt' },
    ],
  },
  {
    id: 5, ngo: 'ReforestAfrica', ngoId: '5', amount: 45,
    status: 'active', proofs: 0, pct: 40, daysActive: 3,
    story: 'Tree planting campaign underway in the Rift Valley.',
    txPath: [
      { label: 'You donated', amount: 45, type: 'verified' },
      { label: 'ReforestAfrica received', amount: 45, type: 'verified' },
      { label: 'Seedling purchase', amount: 18, type: 'pending' },
    ],
  },
  {
    id: 6, ngo: 'HealthKits Africa', ngoId: '6', amount: 25,
    status: 'new', proofs: 0, pct: 0, daysActive: 1,
    story: 'Donation received. Awaiting fund allocation.',
    txPath: [
      { label: 'You donated', amount: 25, type: 'verified' },
      { label: 'HealthKits received', amount: 25, type: 'pending' },
    ],
  },
]

const TRUNK = '#7D5A3C'
const LEAF_GREEN = '#4A7C59'

// ── Branch slots ──────────────────────────────────────────────────────────────
// Trunk centre x=250, runs y=84 → y=415.
// Each branch uses a cubic bezier (C cp1 cp2 end) so the branch leaves the
// trunk in a natural upward-outward arc.  Heights are fully staggered — no
// two branches are at the same level.  Branches are ~150 px long.
//
//  slot 0: LEFT  exits y=118  →  end (82,  68)
//  slot 1: RIGHT exits y=152  →  end (418, 104)
//  slot 2: LEFT  exits y=184  →  end (90,  144)
//  slot 3: RIGHT exits y=216  →  end (412, 172)
//  slot 4: LEFT  exits y=250  →  end (96,  220)
//  slot 5: RIGHT exits y=280  →  end (402, 250)
//
const SLOTS = [
  // 0 — LEFT, highest (biggest donation)
  {
    from: { x: 232, y: 118 },
    cp1:  { x: 200, y: 108 }, cp2: { x: 148, y: 82 },
    end:  { x: 82,  y: 68  }, w: 8,
    leaves: [
      { x: 64,  y: 54,  rx: 23, ry: 11, r: -38 },
      { x: 90,  y: 50,  rx: 19, ry:  9, r:  14 },
      { x: 52,  y: 72,  rx: 16, ry:  8, r: -68 },
      { x: 94,  y: 80,  rx: 14, ry:  7, r:  44 },
      { x: 74,  y: 86,  rx: 13, ry:  6, r: -16 },
    ],
    apples: [{ x: -8, y: -16 }, { x: 11, y: -20 }, { x: -16, y: 4 }],
  },
  // 1 — RIGHT, 2nd from top
  {
    from: { x: 268, y: 152 },
    cp1:  { x: 300, y: 142 }, cp2: { x: 356, y: 114 },
    end:  { x: 418, y: 104 }, w: 7,
    leaves: [
      { x: 434, y: 88,  rx: 22, ry: 10, r:  38 },
      { x: 410, y: 84,  rx: 18, ry:  9, r: -14 },
      { x: 444, y: 108, rx: 16, ry:  8, r:  68 },
      { x: 408, y: 118, rx: 14, ry:  7, r: -42 },
      { x: 426, y: 122, rx: 12, ry:  6, r:  16 },
    ],
    apples: [{ x: 8, y: -16 }, { x: -10, y: -20 }],
  },
  // 2 — LEFT, middle
  {
    from: { x: 230, y: 184 },
    cp1:  { x: 198, y: 176 }, cp2: { x: 148, y: 160 },
    end:  { x: 90,  y: 146 }, w: 6.5,
    leaves: [
      { x: 72,  y: 132, rx: 21, ry: 10, r: -32 },
      { x: 98,  y: 128, rx: 17, ry:  8, r:  16 },
      { x: 62,  y: 150, rx: 14, ry:  7, r: -60 },
      { x: 100, y: 158, rx: 13, ry:  6, r:  44 },
    ],
    apples: [{ x: -6, y: -14 }, { x: 10, y: -18 }],
  },
  // 3 — RIGHT, middle-lower
  {
    from: { x: 270, y: 216 },
    cp1:  { x: 302, y: 208 }, cp2: { x: 354, y: 188 },
    end:  { x: 412, y: 174 }, w: 6,
    leaves: [
      { x: 428, y: 158, rx: 21, ry: 10, r:  32 },
      { x: 406, y: 154, rx: 17, ry:  8, r: -16 },
      { x: 438, y: 176, rx: 14, ry:  7, r:  60 },
      { x: 404, y: 184, rx: 13, ry:  6, r: -44 },
    ],
    apples: [{ x: 6, y: -14 }],
  },
  // 4 — LEFT, lower
  {
    from: { x: 229, y: 250 },
    cp1:  { x: 196, y: 244 }, cp2: { x: 150, y: 232 },
    end:  { x: 96,  y: 222 }, w: 5.5,
    leaves: [
      { x: 78,  y: 208, rx: 19, ry:  9, r: -28 },
      { x: 104, y: 204, rx: 15, ry:  7, r:  20 },
      { x: 70,  y: 226, rx: 13, ry:  6, r: -52 },
      { x: 108, y: 232, rx: 12, ry:  5, r:  38 },
    ],
    apples: [],
  },
  // 5 — RIGHT, lowest (smallest donation)
  {
    from: { x: 271, y: 280 },
    cp1:  { x: 303, y: 274 }, cp2: { x: 350, y: 260 },
    end:  { x: 402, y: 250 }, w: 5,
    leaves: [
      { x: 418, y: 234, rx: 18, ry:  8, r:  28 },
      { x: 396, y: 230, rx: 14, ry:  7, r: -20 },
      { x: 424, y: 252, rx: 12, ry:  6, r:  52 },
      { x: 392, y: 260, rx: 11, ry:  5, r: -36 },
    ],
    apples: [],
  },
]

// ── Tree stage ────────────────────────────────────────────────────────────────
function getStage(total: number) {
  if (total === 0)   return { label: 'Seed',       emoji: '🌱' }
  if (total <= 50)   return { label: 'Sprout',     emoji: '🌿' }
  if (total <= 150)  return { label: 'Sapling',    emoji: '🌳' }
  if (total <= 300)  return { label: 'Young tree', emoji: '🌲' }
  return                    { label: 'Full tree',  emoji: '🌳' }
}

// ── SVG Tree ──────────────────────────────────────────────────────────────────
function ImpactTree({
  selected, onSelect, filter,
}: {
  selected: number | null
  onSelect: (id: number) => void
  filter: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  const visible = [...donations]
    .filter(d => {
      if (filter === 'proof') return d.proofs > 0
      if (filter === 'completed') return d.pct === 100
      return true
    })
    .sort((a, b) => b.amount - a.amount)

  return (
    <svg viewBox="0 0 500 420" width="100%" height="100%">

      {/* ── Background canopy glow ── */}
      <ellipse cx="250" cy="165" rx="210" ry="155" fill="rgba(74,124,89,0.05)" />

      {/* ── Ground shadow + grass ── */}
      <ellipse cx="250" cy="416" rx="96" ry="9" fill="rgba(74,124,89,0.14)" />
      {[200, 220, 258, 276, 296].map((x, i) => (
        <ellipse key={i} cx={x} cy={410} rx={4} ry={7}
          fill={LEAF_GREEN} opacity={0.22}
          transform={`rotate(${(i % 3 - 1) * 10},${x},410)`} />
      ))}

      {/* ── Root flares ── */}
      <path d="M 224,414 Q 194,407 166,414" stroke={TRUNK} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 276,414 Q 306,407 334,414" stroke={TRUNK} strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* ── TRUNK: single tall column — wide base (~54 px), tapers to 8 px at top ── */}
      <path
        d="M 223,416
           C 220,376 225,322 231,270
           C 235,234 239,196 242,160
           C 244,134 245,112 246,86
           L 254,86
           C 255,112 256,134 258,160
           C 261,196 265,234 269,270
           C 275,322 280,376 277,416
           Z"
        fill={TRUNK}
      />
      {/* Grain lines */}
      <path d="M 238,402 Q 236,346 240,268 Q 242,222 244,172" stroke="rgba(255,255,255,0.11)" strokeWidth="2" fill="none" />
      <path d="M 250,398 Q 251,344 252,268 Q 253,222 252,172" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" fill="none" />
      <path d="M 260,398 Q 261,346 260,268 Q 259,222 257,172" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />

      {/* ── Leafy top cap ── */}
      <ellipse cx="250" cy="82" rx="15" ry="8" fill={LEAF_GREEN} opacity="0.65" />
      <ellipse cx="238" cy="88" rx="12" ry="6" fill={LEAF_GREEN} opacity="0.55" transform="rotate(-25,238,88)" />
      <ellipse cx="262" cy="88" rx="12" ry="6" fill={LEAF_GREEN} opacity="0.55" transform="rotate(25,262,88)" />

      {/* ── Secondary branches + leaf nodes (one per donation) ── */}
      {visible.map((don, i) => {
        if (i >= SLOTS.length) return null
        const sl = SLOTS[i]
        const isSelected = selected === don.id
        const isHovered = hovered === don.id
        const nodeR = Math.max(14, Math.min(22, 11 + (don.amount / 150) * 13))
        const leafFill = don.status === 'new' ? 'rgba(74,124,89,0.42)' : LEAF_GREEN
        const leafOp = don.status === 'new' ? 0.52 : 0.80

        return (
          <g key={don.id}>
            {/* Secondary branch */}
            <path
              d={`M ${sl.from.x},${sl.from.y} C ${sl.cp1.x},${sl.cp1.y} ${sl.cp2.x},${sl.cp2.y} ${sl.end.x},${sl.end.y}`}
              stroke={TRUNK} strokeWidth={sl.w} fill="none" strokeLinecap="round"
            />

            {/* Leaf cluster */}
            {sl.leaves.map((lf, li) => (
              <ellipse key={li}
                cx={lf.x} cy={lf.y} rx={lf.rx} ry={lf.ry}
                fill={leafFill} opacity={leafOp}
                transform={`rotate(${lf.r},${lf.x},${lf.y})`}
              />
            ))}

            {/* Apples — one per proof, max 3 */}
            {don.proofs > 0 && sl.apples.slice(0, Math.min(don.proofs, sl.apples.length)).map((off, ai) => (
              <g key={ai} style={{ pointerEvents: 'none' }}>
                <circle cx={sl.end.x + off.x} cy={sl.end.y + off.y} r={6.5} fill="#C0392B" opacity={0.9} />
                <circle cx={sl.end.x + off.x + 1.5} cy={sl.end.y + off.y - 1.5} r={1.8} fill="rgba(255,255,255,0.45)" />
                <line
                  x1={sl.end.x + off.x + 1} y1={sl.end.y + off.y - 6}
                  x2={sl.end.x + off.x + 3} y2={sl.end.y + off.y - 10}
                  stroke={LEAF_GREEN} strokeWidth={1.2} strokeLinecap="round"
                />
              </g>
            ))}

            {/* Glow ring */}
            {(isSelected || isHovered) && (
              <circle cx={sl.end.x} cy={sl.end.y} r={nodeR + 9}
                fill="rgba(74,124,89,0.14)" style={{ pointerEvents: 'none' }} />
            )}

            {/* Visible node circle */}
            <circle
              cx={sl.end.x} cy={sl.end.y} r={nodeR}
              fill={isSelected ? 'rgba(74,124,89,0.28)' : 'rgba(255,253,248,0.92)'}
              stroke={isSelected ? '#4A7C59' : 'rgba(74,124,89,0.42)'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={sl.end.x} y={sl.end.y + 5.5} textAnchor="middle"
              fontSize={don.status === 'new' ? 12 : 14}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {don.proofs > 0 ? '🌿' : don.status === 'new' ? '🌱' : '🍃'}
            </text>

            {/* Tooltip */}
            {isHovered && (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={sl.end.x - 58} y={sl.end.y - nodeR - 36}
                  width={116} height={28} rx={8}
                  fill="rgba(44,36,22,0.85)"
                />
                <text
                  x={sl.end.x} y={sl.end.y - nodeR - 17}
                  textAnchor="middle" fontSize={12}
                  fill="white" fontFamily="DM Sans, sans-serif" fontWeight="500"
                >
                  ${don.amount} · {don.ngo.split(' ')[0]}
                </text>
              </g>
            )}

            {/* ⚡ Transparent hit area — MUST be last (top of stacking order) */}
            <circle
              cx={sl.end.x} cy={sl.end.y} r={nodeR + 14}
              fill="transparent"
              cursor="pointer"
              onMouseEnter={() => setHovered(don.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(don.id)}
            />
          </g>
        )
      })}

      {/* Filler leaves — fill gaps along branch midpoints */}
      {[
        { x: 158, y: 104, rx: 14, ry: 6, r: -20 },
        { x: 344, y: 128, rx: 14, ry: 6, r:  22 },
        { x: 160, y: 168, rx: 13, ry: 6, r: -16 },
        { x: 342, y: 196, rx: 13, ry: 6, r:  18 },
        { x: 164, y: 240, rx: 12, ry: 5, r: -14 },
        { x: 338, y: 268, rx: 12, ry: 5, r:  16 },
      ].map((lf, i) => (
        <ellipse key={`f${i}`}
          cx={lf.x} cy={lf.y} rx={lf.rx} ry={lf.ry}
          fill={LEAF_GREEN} opacity={0.24}
          transform={`rotate(${lf.r},${lf.x},${lf.y})`}
        />
      ))}
    </svg>
  )
}

// ── Transaction path ──────────────────────────────────────────────────────────
function TxPath({ steps }: { steps: Donation['txPath'] }) {
  return (
    <div>
      {steps.map((step, i) => {
        const dot = step.type === 'verified' ? '#4A7C59' : step.type === 'receipt' ? '#BA7517' : '#c5bdb5'
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: dot, marginTop: 4 }} />
              {i < steps.length - 1 && (
                <div style={{ width: 1.5, height: 20, background: 'rgba(44,36,22,0.1)', marginTop: 2 }} />
              )}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 10 : 0 }}>
              <div style={{ fontSize: 13, color: '#2C2416', fontWeight: 500 }}>{step.label}</div>
              <div style={{ fontSize: 11, color: '#a89a8a' }}>${step.amount}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<number>(donations[0].id)
  const [filter, setFilter] = useState('all')

  const total = donations.reduce((s, d) => s + d.amount, 0)
  const { label: stageLabel, emoji: stageEmoji } = getStage(total)
  const selected = donations.find(d => d.id === selectedId) ?? donations[0]
  const totalProofs = donations.reduce((s, d) => s + d.proofs, 0)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'proof', label: '🍎 With proof' },
    { id: 'completed', label: '✓ Fully traced' },
  ]

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: '#2C2416', marginBottom: 4 }}>Your impact tree</h1>
          <p style={{ fontSize: 14, color: '#8a7a6a' }}>
            {donations.length} campaigns · ${total} donated · each leaf is a donation
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(74,124,89,0.09)', borderRadius: 20, padding: '7px 18px',
        }}>
          <span style={{ fontSize: 18 }}>{stageEmoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4A7C59' }}>{stageLabel}</span>
        </div>
      </div>

      {/* Tree + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, marginBottom: 16 }}>

        {/* Tree card */}
        <div className="glass-card" style={{ padding: '18px 14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
            <div style={{ fontSize: 12, color: '#a89a8a' }}>Hover a leaf — click to trace your money</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {filters.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  style={{
                    fontSize: 11, padding: '4px 11px', borderRadius: 12, border: 'none',
                    cursor: 'pointer',
                    background: filter === f.id ? 'rgba(74,124,89,0.15)' : 'transparent',
                    color: filter === f.id ? '#4A7C59' : '#a89a8a',
                    fontWeight: filter === f.id ? 600 : 400,
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 420 }}>
            <ImpactTree selected={selectedId} onSelect={setSelectedId} filter={filter} />
          </div>

          <div style={{ display: 'flex', gap: 18, paddingTop: 10, borderTop: '1px solid rgba(44,36,22,0.06)', paddingLeft: 4 }}>
            {[{ e: '🌿', l: 'Active' }, { e: '🍎', l: 'Proof attached' }, { e: '🌱', l: 'New' }].map(item => (
              <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a89a8a' }}>
                <span style={{ fontSize: 13 }}>{item.e}</span> {item.l}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#a89a8a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
            Selected
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#2C2416', fontFamily: 'Playfair Display, serif', marginBottom: 3 }}>
              ${selected.amount}
            </div>
            <div style={{ fontSize: 14, color: '#4A7C59', fontWeight: 500 }}>{selected.ngo}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 18 }}>
            {[
              ['Traced', `${selected.pct}%`],
              ['Days active', String(selected.daysActive)],
              ['Proof docs', `${selected.proofs} 🍎`],
              ['Status', selected.status === 'new' ? 'New' : 'Active'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(74,124,89,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#a89a8a', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2416' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, color: '#a89a8a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            Money's journey
          </div>
          <div style={{ flex: 1, marginBottom: 14 }}>
            <TxPath steps={selected.txPath} />
          </div>

          <div style={{
            background: 'rgba(74,124,89,0.07)', borderRadius: 8, padding: 12,
            fontSize: 13, color: '#3a6347', fontStyle: 'italic', lineHeight: 1.6,
            marginBottom: 14,
          }}>
            "{selected.story}"
          </div>

          <button className="btn-ghost"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate(`/ngo/${selected.ngoId}`)}>
            Full NGO report <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total donated', val: `$${total}`, sub: `${donations.length} campaigns`, green: false },
          { label: 'Funds traced', val: '84%', sub: 'verified or receipted', green: true },
          { label: 'Proof docs', val: String(totalProofs), sub: 'attached 🍎', green: false },
          { label: 'Tree stage', val: stageEmoji, sub: stageLabel, green: false },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: '#a89a8a', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.green ? '#4A7C59' : '#2C2416' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#a89a8a', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <button className="btn-primary"
        style={{ width: '100%', padding: 14, fontSize: 15 }}
        onClick={() => navigate('/donate')}>
        + Grow your tree — donate to a new campaign
      </button>
    </div>
  )
}
