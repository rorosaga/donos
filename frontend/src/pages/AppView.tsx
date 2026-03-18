import { useState, useMemo, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Leaf, FileCheck, TrendingUp, ExternalLink, Search } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { fetchDonorTree } from '../utils/api'
import type { DonorTree, TreeBranch, TreeSpending } from '../types'

/* ── Pastel botanical palette ─────────────────────────────────── */
const PETAL_COLORS = [
  { base: '#8BC4A1', light: '#B5DCCA', dark: '#5A9B74' },
  { base: '#A8C5E2', light: '#C8DBF0', dark: '#7BA3C9' },
  { base: '#E8C8A0', light: '#F0DCC0', dark: '#C9A87A' },
  { base: '#D4A0B0', light: '#E8C0CC', dark: '#B87A8C' },
  { base: '#B8D4A0', light: '#D0E4BC', dark: '#92B874' },
  { base: '#C4B0D8', light: '#DCD0E8', dark: '#A088BC' },
]

/* ── Mock data ────────────────────────────────────────────────── */
const MOCK_TREE: DonorTree = {
  donor_address: 'rpK2GkXnCLRKeEc4SmZ4Yr3Cg68Jh9cZqJ',
  total_dono_tokens: 130,
  total_donated: 130,
  ngo_count: 5,
  branches: [
    {
      ngo_id: 'ngo_clean_water', ngo_name: 'Clean Water Initiative', total_donated: 50, total_dono_tokens: 50, donation_count: 1,
      spending: [
        { id: 's1', destination: 'Well construction', amount: 60, memo: 'Well in Kisumu reached 60%', category: 'infrastructure', has_proof: true, created_at: '2026-03-17' },
      ],
    },
    {
      ngo_id: 'ngo_edu_africa', ngo_name: 'Education for All Foundation', total_donated: 30, total_dono_tokens: 30, donation_count: 1,
      spending: [
        { id: 's2', destination: 'School supplies', amount: 90, memo: 'Funded supplies for 30 students in Nairobi', category: 'education', has_proof: true, created_at: '2026-03-17' },
        { id: 's3', destination: 'Field operations', amount: 36, memo: 'Field team deployment', category: 'operations', has_proof: true, created_at: '2026-03-17' },
      ],
    },
    {
      ngo_id: 'ngo_solar_villages', ngo_name: 'SolarVillages', total_donated: 25, total_dono_tokens: 25, donation_count: 1,
      spending: [
        { id: 's4', destination: 'Panel installation', amount: 80, memo: 'Solar panels for 3 villages', category: 'energy', has_proof: false, created_at: '2026-03-17' },
      ],
    },
    {
      ngo_id: 'ngo_foodbank', ngo_name: 'Global FoodBank Network', total_donated: 15, total_dono_tokens: 15, donation_count: 1,
      spending: [],
    },
    {
      ngo_id: 'ngo_healthkits', ngo_name: 'MedSupply International', total_donated: 10, total_dono_tokens: 10, donation_count: 1,
      spending: [],
    },
  ],
}

/* ── SVG arc helper ───────────────────────────────────────────── */
function describeArc(cx: number, cy: number, r1: number, r2: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180
  const x1o = cx + r2 * Math.cos(toRad(startAngle))
  const y1o = cy + r2 * Math.sin(toRad(startAngle))
  const x2o = cx + r2 * Math.cos(toRad(endAngle))
  const y2o = cy + r2 * Math.sin(toRad(endAngle))
  const x1i = cx + r1 * Math.cos(toRad(endAngle))
  const y1i = cy + r1 * Math.sin(toRad(endAngle))
  const x2i = cx + r1 * Math.cos(toRad(startAngle))
  const y2i = cy + r1 * Math.sin(toRad(startAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r1} ${r1} 0 ${largeArc} 0 ${x2i} ${y2i} Z`
}

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/* ── Bloom stage ──────────────────────────────────────────────── */
function bloomStage(total: number): { label: string } {
  if (total === 0) return { label: 'Seed' }
  if (total <= 50) return { label: 'Sprout' }
  if (total <= 150) return { label: 'Bud' }
  if (total <= 300) return { label: 'Bloom' }
  return { label: 'Full Bloom' }
}

/* ── Constants ────────────────────────────────────────────────── */
const CX = 250
const CY = 250
const R_CENTER = 60
const R_PETAL_IN = 75
const R_PETAL_OUT = 140
const R_SPEND_IN = 145
const R_SPEND_OUT = 200
const GAP_DEG = 2

/* ── Radial Bloom SVG ─────────────────────────────────────────── */
function RadialBloom({
  tree,
  selectedNgoId,
  onSelectNgo,
  hoveredNgoId,
  onHoverNgo,
}: {
  tree: DonorTree
  selectedNgoId: string | null
  onSelectNgo: (id: string | null) => void
  hoveredNgoId: string | null
  onHoverNgo: (id: string | null) => void
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const hoveredBranch = hoveredNgoId ? tree.branches.find(b => b.ngo_id === hoveredNgoId) : null

  const petalData = useMemo(() => {
    const totalDonated = tree.total_donated
    const totalGap = GAP_DEG * tree.branches.length
    const available = 360 - totalGap
    let cursor = 0

    return tree.branches.map((branch, i) => {
      const angle = (branch.total_donated / totalDonated) * available
      const start = cursor + GAP_DEG / 2
      const end = cursor + GAP_DEG / 2 + angle
      cursor += angle + GAP_DEG
      const color = PETAL_COLORS[i % PETAL_COLORS.length]

      // Subdivide spending within this petal's angle range
      const spentTotal = branch.spending.reduce((s, sp) => s + sp.amount, 0)
      const unspent = branch.total_donated - spentTotal
      let spendCursor = start
      const spendingArcs = branch.spending.map((sp) => {
        const spAngle = (sp.amount / branch.total_donated) * angle
        const spStart = spendCursor
        const spEnd = spendCursor + spAngle
        spendCursor += spAngle
        return { spending: sp, startAngle: spStart, endAngle: spEnd }
      })
      // Unspent remainder
      const unspentArc = unspent > 0
        ? { startAngle: spendCursor, endAngle: start + angle, amount: unspent }
        : null

      return { branch, startAngle: start, endAngle: end, color, spendingArcs, unspentArc }
    })
  }, [tree])

  return (
    <svg viewBox="0 0 500 500" className="w-full max-w-[450px] mx-auto">
      {/* Subtle background glow */}
      <defs>
        <radialGradient id="bloom-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8BC4A1" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FAF6F1" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="1" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feFlood floodColor="#2C2416" floodOpacity="0.08" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r={210} fill="url(#bloom-glow)" />

      {/* ── Petal arcs (inner ring — NGOs) ── */}
      {petalData.map(({ branch, startAngle, endAngle, color }) => {
        const isHovered = hoveredNgoId === branch.ngo_id
        const isSelected = selectedNgoId === branch.ngo_id
        return (
          <path
            key={`petal-${branch.ngo_id}`}
            d={describeArc(CX, CY, R_PETAL_IN, R_PETAL_OUT, startAngle, endAngle)}
            fill={isSelected ? color.dark : color.base}
            opacity={isHovered || isSelected ? 1 : 0.82}
            stroke={isSelected ? '#2C2416' : '#FFFDF8'}
            strokeWidth={isSelected ? 3 : 1.5}
            strokeLinejoin="round"
            filter={isHovered ? 'url(#soft-shadow)' : undefined}
            className="cursor-pointer transition-opacity duration-200"
            onMouseEnter={() => onHoverNgo(branch.ngo_id)}
            onMouseLeave={() => onHoverNgo(null)}
            onClick={() => onSelectNgo(selectedNgoId === branch.ngo_id ? null : branch.ngo_id)}
          />
        )
      })}

      {/* ── Petal labels (NGO names on inner ring) ── */}
      {petalData.map(({ branch, startAngle, endAngle, color }) => {
        const midAngle = (startAngle + endAngle) / 2
        const labelR = (R_PETAL_IN + R_PETAL_OUT) / 2
        const pt = pointOnCircle(CX, CY, labelR, midAngle)
        const angleDeg = endAngle - startAngle
        const isSelected = selectedNgoId === branch.ngo_id
        if (angleDeg < 25) return null // skip label if too narrow
        return (
          <text
            key={`label-${branch.ngo_id}`}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none select-none"
            fill={isSelected ? '#FFFDF8' : color.dark}
            fontSize={angleDeg < 40 ? 8 : 10}
            fontWeight={isSelected ? 600 : 500}
            fontFamily="Inter, sans-serif"
          >
            {branch.ngo_name.length > 14 ? branch.ngo_name.slice(0, 12) + '...' : branch.ngo_name}
          </text>
        )
      })}

      {/* ── Spending sub-arcs (outer ring) ── */}
      {petalData.map(({ branch, color, spendingArcs, unspentArc }) => (
        <g key={`spend-group-${branch.ngo_id}`}>
          {spendingArcs.map(({ spending, startAngle, endAngle }) => (
            <path
              key={`spend-${spending.id}`}
              d={describeArc(CX, CY, R_SPEND_IN, R_SPEND_OUT, startAngle, endAngle)}
              fill={spending.has_proof ? color.dark : color.light}
              opacity={0.9}
              stroke="#FFFDF8"
              strokeWidth={1}
              strokeLinejoin="round"
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={(e) => {
                const svgRect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                if (svgRect) {
                  setTooltip({
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top - 10,
                    text: `${spending.destination}: ${spending.amount} RLUSD`,
                  })
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
          {/* Tip markers — small dots at outer edge for each expenditure */}
          {spendingArcs.map(({ spending, startAngle, endAngle }) => {
            const midAngle = (startAngle + endAngle) / 2
            const pt = pointOnCircle(CX, CY, R_SPEND_OUT + 6, midAngle)
            return (
              <circle
                key={`tip-${spending.id}`}
                cx={pt.x}
                cy={pt.y}
                r={3}
                fill={spending.has_proof ? color.dark : color.light}
                stroke="#FFFDF8"
                strokeWidth={1}
              />
            )
          })}
          {/* Unspent remainder */}
          {unspentArc && (
            <path
              d={describeArc(CX, CY, R_SPEND_IN, R_SPEND_OUT, unspentArc.startAngle, unspentArc.endAngle)}
              fill={color.base}
              opacity={0.3}
              stroke="#FFFDF8"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          )}
        </g>
      ))}

      {/* ── Center circle (donor) — clickable to profile ── */}
      <g className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('bloom-center-click'))}>
        <circle cx={CX} cy={CY} r={R_CENTER} fill="#FFFDF8" stroke="#8BC4A1" strokeWidth={2} filter="url(#soft-shadow)" />
        <circle cx={CX} cy={CY} r={R_CENTER} fill="transparent" className="hover:fill-[rgba(74,124,89,0.05)] transition-colors" />
        {hoveredBranch ? (
          <>
            <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={11} fill="#2C2416" fontWeight={500} className="pointer-events-none">
              {hoveredBranch.ngo_name.length > 18 ? hoveredBranch.ngo_name.slice(0, 16) + '...' : hoveredBranch.ngo_name}
            </text>
            <text x={CX} y={CY + 4} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={16} fill="#4A7C59" fontWeight={700} className="pointer-events-none">
              {hoveredBranch.total_donated}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={9} fill="#8a7a6a" className="pointer-events-none">
              RLUSD donated
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 12} textAnchor="middle" dominantBaseline="central" fontFamily="'IvyPresto Headline', 'Playfair Display', Georgia, serif" fontSize={13} fill="#2C2416" fontWeight={500} className="pointer-events-none">
              Your bloom
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={18} fill="#4A7C59" fontWeight={700} className="pointer-events-none">
              {tree.total_dono_tokens}
            </text>
            <text x={CX} y={CY + 24} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={9} fill="#8a7a6a" className="pointer-events-none">
              DONO tokens
            </text>
          </>
        )}
      </g>

      {/* ── Total donation count below center ── */}
      <text x={CX} y={CY + R_CENTER + 16} textAnchor="middle" dominantBaseline="central" fontFamily="Inter, sans-serif" fontSize={10} fill="#8a7a6a" className="pointer-events-none">
        {tree.branches.reduce((s, b) => s + b.donation_count, 0)} donation{tree.branches.reduce((s, b) => s + b.donation_count, 0) !== 1 ? 's' : ''}
      </text>

      {/* ── Tooltip ── */}
      {tooltip && (
        <g className="pointer-events-none">
          <rect x={tooltip.x - 70} y={tooltip.y - 28} width={140} height={24} rx={6} fill="#2C2416" opacity={0.88} />
          <text x={tooltip.x} y={tooltip.y - 14} textAnchor="middle" dominantBaseline="central" fill="#FFFDF8" fontSize={10} fontFamily="Inter, sans-serif">
            {tooltip.text}
          </text>
        </g>
      )}
    </svg>
  )
}

/* ── Detail Panel ─────────────────────────────────────────────── */
function DetailPanel({ branch, colorIdx, onClose }: { branch: TreeBranch; colorIdx: number; onClose: () => void }) {
  const navigate = useNavigate()
  const color = PETAL_COLORS[colorIdx % PETAL_COLORS.length]
  const spentTotal = branch.spending.reduce((s, sp) => s + sp.amount, 0)
  const traced = branch.total_donated > 0 ? Math.min(100, Math.round((spentTotal / branch.total_donated) * 100)) : 0
  const proofs = branch.spending.filter((s) => s.has_proof).length

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color.base }} />
            <h3 className="text-lg font-semibold">{branch.ngo_name}</h3>
          </div>
          <p className="text-sm text-[#8a7a6a]">{branch.donation_count} donation{branch.donation_count !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="btn-ghost text-xs py-1 px-2">Close</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-3 text-center">
          <p className="text-xs text-[#8a7a6a] mb-1">Donated</p>
          <p className="text-lg font-bold text-[#2C2416]">{branch.total_donated} <span className="text-xs font-normal">RLUSD</span></p>
        </div>
        <div className="glass p-3 text-center">
          <p className="text-xs text-[#8a7a6a] mb-1">DONO Tokens</p>
          <p className="text-lg font-bold text-[#4A7C59]">{branch.total_dono_tokens}</p>
        </div>
        <div className="glass p-3 text-center">
          <p className="text-xs text-[#8a7a6a] mb-1">Traced</p>
          <p className="text-lg font-bold text-[#2C2416]">{traced}%</p>
        </div>
        <div className="glass p-3 text-center">
          <p className="text-xs text-[#8a7a6a] mb-1">Proofs</p>
          <p className="text-lg font-bold text-[#2C2416]">{proofs}</p>
        </div>
      </div>

      {/* Spending timeline */}
      {branch.spending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#8a7a6a] uppercase tracking-wide mb-3">Spending Timeline</p>
          <div className="space-y-3">
            {branch.spending.map((sp: TreeSpending) => (
              <div key={sp.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1.5"
                    style={{ backgroundColor: sp.has_proof ? color.dark : color.light }}
                  />
                  <span className="w-px flex-1 bg-[#e0dcd6]" />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#2C2416]">{sp.destination}</p>
                    <span className="text-xs font-semibold text-[#4A7C59]">{sp.amount} RLUSD</span>
                  </div>
                  {sp.memo && <p className="text-xs text-[#8a7a6a] mt-0.5">{sp.memo}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#aaa]">{sp.created_at}</span>
                    {sp.has_proof && <span className="badge-green flex items-center gap-1"><FileCheck className="w-3 h-3" /> Proof</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {branch.spending.length === 0 && (
        <p className="text-sm text-[#8a7a6a] text-center py-4">No spending data reported yet.</p>
      )}

      {/* View NGO report */}
      <button
        onClick={() => navigate(`/ngo/${branch.ngo_id}`)}
        className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
      >
        View NGO report <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ── Stats Row ────────────────────────────────────────────────── */
function StatsRow({ tree }: { tree: DonorTree }) {
  const allSpending = tree.branches.flatMap((b) => b.spending)
  const spentTotal = allSpending.reduce((s, sp) => s + sp.amount, 0)
  const traced = tree.total_donated > 0 ? Math.min(100, Math.round((spentTotal / tree.total_donated) * 100)) : 0
  const proofCount = allSpending.filter((s) => s.has_proof).length
  const stage = bloomStage(tree.total_donated)

  const stats = [
    { label: 'Total Donated', value: `${tree.total_donated} RLUSD`, icon: TrendingUp },
    { label: 'Traced', value: `${traced}%`, icon: null },
    { label: 'Proof Docs', value: `${proofCount}`, icon: FileCheck },
    { label: 'Bloom Stage', value: stage.label, icon: null },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-4 text-center">
          <p className="text-xs text-[#8a7a6a] mb-1">{stat.label}</p>
          <p className="text-lg font-bold text-[#2C2416]">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Main AppView ─────────────────────────────────────────────── */
/* ── NGO list data for explore section ────────────────────────── */
const EXPLORE_NGOS = [
  { id: 'ngo_clean_water', name: 'Clean Water Initiative', category: 'Water & Sanitation', image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800', score: 92, donated: true },
  { id: 'ngo_edu_africa', name: 'Education for All Foundation', category: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', score: 78, donated: true },
  { id: 'ngo_solar_villages', name: 'SolarVillages', category: 'Renewable Energy', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', score: 88, donated: true },
  { id: 'ngo_foodbank', name: 'Global FoodBank Network', category: 'Food Security', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', score: 85, donated: true },
  { id: 'ngo_healthkits', name: 'MedSupply International', category: 'Healthcare', image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800', score: 95, donated: true },
  { id: 'ngo_reforest', name: 'ReforestNow', category: 'Environment', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', score: 81, donated: false },
  { id: 'ngo_tech_youth', name: 'TechYouth Initiative', category: 'Technology', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', score: 74, donated: false },
]

export default function AppView() {
  const { address, disconnect } = useWallet()
  const navigate = useNavigate()
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null)
  const [hoveredNgoId, setHoveredNgoId] = useState<string | null>(null)
  const [listTab, setListTab] = useState<'donated' | 'explore'>('donated')
  const [liveTree, setLiveTree] = useState<DonorTree | null>(null)

  // Listen for center circle click → navigate to profile
  useEffect(() => {
    const handler = () => navigate('/profile')
    window.addEventListener('bloom-center-click', handler)
    return () => window.removeEventListener('bloom-center-click', handler)
  }, [navigate])

  // Fetch live donation tree from API
  useEffect(() => {
    if (!address) return
    fetchDonorTree(address)
      .then(setLiveTree)
      .catch(() => {}) // fall back to mock
  }, [address])

  // Guard: redirect if no wallet connected
  if (!address) {
    return <Navigate to="/connect" replace />
  }

  // Merge mock + live: use mock as base, add live branches that don't exist in mock
  const tree = (() => {
    const base: DonorTree = {
      donor_address: MOCK_TREE.donor_address,
      total_dono_tokens: MOCK_TREE.total_dono_tokens,
      total_donated: MOCK_TREE.total_donated,
      ngo_count: MOCK_TREE.ngo_count,
      branches: MOCK_TREE.branches.map(b => ({ ...b })),
    }
    if (!liveTree) return base

    // Add live branches not in mock
    for (const liveBranch of liveTree.branches) {
      const existing = base.branches.find(b => b.ngo_name === liveBranch.ngo_name)
      if (existing) {
        // Update existing branch totals with live data
        existing.total_donated = Math.max(existing.total_donated, liveBranch.total_donated + existing.total_donated)
        existing.total_dono_tokens = Math.max(existing.total_dono_tokens, liveBranch.total_dono_tokens + existing.total_dono_tokens)
        existing.donation_count = existing.donation_count + liveBranch.donation_count
      } else {
        base.branches.push(liveBranch)
      }
    }

    // Recalculate totals
    base.total_donated = base.branches.reduce((s, b) => s + b.total_donated, 0)
    base.total_dono_tokens = base.branches.reduce((s, b) => s + b.total_dono_tokens, 0)
    base.ngo_count = base.branches.length

    return base
  })()
  const filteredNgos = listTab === 'donated'
    ? EXPLORE_NGOS.filter(n => n.donated)
    : EXPLORE_NGOS

  const selectedBranch = selectedNgoId
    ? tree.branches.find((b) => b.ngo_id === selectedNgoId) ?? null
    : null
  const selectedColorIdx = selectedBranch
    ? tree.branches.findIndex((b) => b.ngo_id === selectedNgoId)
    : 0

  return (
    <div className="min-h-screen relative">
      {/* ── Sky background with clouds + flowers ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2E8BC0] via-[#5DB8E0] via-60% to-[#B8E0F0]" />
        <img src="/assets/cloud1.png" alt="" className="absolute top-[5%] left-[2%] w-[35%] max-w-[400px] opacity-80 pointer-events-none select-none" />
        <img src="/assets/cloud2.png" alt="" className="absolute top-[12%] right-[5%] w-[28%] max-w-[350px] opacity-70 pointer-events-none select-none" />
        <img src="/assets/cloud2.png" alt="" className="absolute top-[35%] left-[10%] w-[20%] max-w-[250px] opacity-40 pointer-events-none select-none" />
        <img src="/assets/flowers_corners.png" alt="" className="absolute bottom-0 left-0 right-0 w-full pointer-events-none select-none" />
      </div>

      {/* ── App window ── */}
      <div className="relative z-10 min-h-screen pt-6 pb-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto bg-[#FAF6F1] rounded-3xl shadow-[0_8px_60px_rgba(44,36,22,0.12)] overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(44, 36, 22, 0.13) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#4A7C59]" />
          <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">donos</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8a7a6a]">
            Hi, {address.slice(0, 4)}...{address.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="text-xs text-[#8a7a6a] hover:text-[#2C2416] transition-colors cursor-pointer"
          >
            Log out
          </button>
          <button onClick={() => navigate('/donate')} className="btn-primary text-sm py-2 px-4">
            Donate
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 md:px-12 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Bloom + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center w-full">
              <RadialBloom
                tree={tree}
                selectedNgoId={selectedNgoId}
                onSelectNgo={setSelectedNgoId}
                hoveredNgoId={hoveredNgoId}
                onHoverNgo={setHoveredNgoId}
              />
            </div>
            <StatsRow tree={tree} />
          </div>

          {/* Right — Detail panel */}
          <div className="w-full lg:w-80 shrink-0">
            {selectedBranch ? (
              <DetailPanel
                branch={selectedBranch}
                colorIdx={selectedColorIdx}
                onClose={() => setSelectedNgoId(null)}
              />
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-[#8a7a6a] text-sm">Click a petal to see details about an NGO you support.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── NGO List View ── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-[#2C2416]">Campaigns</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setListTab('donated')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  listTab === 'donated'
                    ? 'bg-[rgba(74,124,89,0.12)] text-[#4A7C59] font-semibold'
                    : 'text-[#8a7a6a]'
                }`}
              >
                My NGOs
              </button>
              <button
                onClick={() => setListTab('explore')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                  listTab === 'explore'
                    ? 'bg-[rgba(74,124,89,0.12)] text-[#4A7C59] font-semibold'
                    : 'text-[#8a7a6a]'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> Explore
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNgos.map(ngo => (
              <div
                key={ngo.id}
                onClick={() => navigate(`/ngo/${ngo.id}`)}
                className="glass-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <img
                  src={ngo.image}
                  alt={ngo.name}
                  className="w-full h-36 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-[#2C2416]">{ngo.name}</h3>
                    <span className={`text-xs font-bold ${ngo.score >= 80 ? 'text-[#4A7C59]' : ngo.score >= 60 ? 'text-[#BA7517]' : 'text-[#B93C3C]'}`}>
                      {ngo.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-green text-[10px]">{ngo.category}</span>
                    {ngo.donated && <span className="text-[10px] text-[#4A7C59] font-medium">Donor</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
