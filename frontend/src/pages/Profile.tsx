import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, ArrowLeft, Shield, ExternalLink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { fetchDonations } from '../utils/api'
import type { DonationResponse } from '../types'

/* ── Mock data ────────────────────────────────────────────────── */
const MOCK_RECENT_DONATIONS = [
  { ngoId: 'ngo_clean_water', ngoName: 'Clean Water Initiative', amount: 50, date: '2026-03-17', currency: 'RLUSD', tx_hash: 'CDFB103B7E6BE0DE0C9FA685A3182AD6A387A5B539DF542D15F39AAEBA103749' },
  { ngoId: 'ngo_edu_africa', ngoName: 'Education for All Foundation', amount: 30, date: '2026-03-17', currency: 'RLUSD', tx_hash: '1A33E8ADCCE6A2324EEA7A115FEACAAE6BD2650E431A219B7210FF59A7546231' },
  { ngoId: 'ngo_solar_villages', ngoName: 'SolarVillages', amount: 25, date: '2026-03-17', currency: 'RLUSD', tx_hash: 'E401B8F228F770EF0F39F0E08F7B52A2C862045868BC76BF262539320160C384' },
  { ngoId: 'ngo_foodbank', ngoName: 'Global FoodBank Network', amount: 15, date: '2026-03-17', currency: 'RLUSD', tx_hash: 'CC6AD96BB762488051B3DA77DF1BFAEC5E625D018691526B5DD62F2B66F2E70D' },
  { ngoId: 'ngo_healthkits', ngoName: 'MedSupply International', amount: 10, date: '2026-03-17', currency: 'RLUSD', tx_hash: '3D4637872CDA9CDDED5421F5ADA53B07F8AFE3F2256DCC0AC86411B933A69C79' },
]

// Map backend NGO UUIDs to frontend IDs
const NGO_UUID_TO_ID: Record<string, { id: string; name: string }> = {
  '8c98e479-2db7-4bbd-85ef-fb3c10aad709': { id: 'ngo_clean_water', name: 'Clean Water Initiative' },
  'd85563d4-d48a-4f55-9378-2cfe43ab96fc': { id: 'ngo_edu_africa', name: 'Education for All Foundation' },
  '0682f6f2-f66c-4521-964b-05ca817c3ec3': { id: 'ngo_solar_villages', name: 'SolarVillages' },
  'fd95f529-fa3f-4ff6-87c7-6db0038c9aea': { id: 'ngo_foodbank', name: 'Global FoodBank Network' },
  '97be9e06-856c-47a0-acac-c6f9ac3488bf': { id: 'ngo_healthkits', name: 'MedSupply International' },
}

interface ActivityItem {
  ngoId: string
  ngoName: string
  amount: number
  date: string
  currency: string
  tx_hash: string
}

/* ── Main Component ──────────────────────────────────────────── */
export default function Profile() {
  const { address, disconnect } = useWallet()
  const navigate = useNavigate()
  const [liveDonations, setLiveDonations] = useState<ActivityItem[]>([])

  useEffect(() => {
    if (!address) {
      navigate('/connect', { replace: true })
    }
  }, [address, navigate])

  // Fetch real donations from API
  useEffect(() => {
    if (!address) return
    fetchDonations({ donor_wallet_address: address })
      .then((real: DonationResponse[]) => {
        const mapped: ActivityItem[] = real
          .filter(d => (d.state || d.processing_state) === 'sent_to_donor')
          .map(d => {
            const ngoInfo = NGO_UUID_TO_ID[d.ngo_id] || { id: d.ngo_id, name: d.ngo_id }
            return {
              ngoId: ngoInfo.id,
              ngoName: ngoInfo.name,
              amount: Number(d.rlusd_amount),
              date: d.created_at.split('T')[0],
              currency: Number(d.rlusd_amount) < 10 ? 'XRP' : 'RLUSD',
              tx_hash: d.detection_tx_hash || d.payment_reference,
            }
          })
        setLiveDonations(mapped)
      })
      .catch(() => {})
  }, [address])

  if (!address) return null

  // Merge mock + live, deduplicate by tx_hash
  const allActivity: ActivityItem[] = [...MOCK_RECENT_DONATIONS]
  for (const live of liveDonations) {
    if (!allActivity.some(a => a.tx_hash === live.tx_hash)) {
      allActivity.push(live)
    }
  }
  // Sort by date descending
  allActivity.sort((a, b) => b.date.localeCompare(a.date))

  // Compute stats from all activity
  const totalRLUSD = allActivity.filter(a => a.currency === 'RLUSD').reduce((s, a) => s + a.amount, 0)
  const totalXRP = allActivity.filter(a => a.currency === 'XRP').reduce((s, a) => s + a.amount, 0)
  const totalDONO = allActivity.reduce((s, a) => s + a.amount, 0)
  const uniqueNGOs = new Set(allActivity.map(a => a.ngoId)).size
  const bloomStage = totalDONO === 0 ? 'Seed' : totalDONO <= 50 ? 'Sprout' : totalDONO <= 150 ? 'Bud' : totalDONO <= 300 ? 'Bloom' : 'Full Bloom'

  const avatarChars = address.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#4A7C59]" />
          <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">
            donos
          </span>
        </Link>
        <button
          className="btn-ghost flex items-center gap-1 text-sm"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-4 space-y-6">
        {/* Profile header */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#4A7C59] flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-white font-mono">
                {avatarChars}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-mono text-sm text-[#2C2416] break-all mb-2">
                {address}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Shield className="w-4 h-4 text-[#4A7C59]" />
                <span className="badge-green text-xs font-medium">Verified Donor</span>
              </div>
              <p className="text-xs text-[#8a7a6a]">Member since March 2026</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#8a7a6a] mb-1">RLUSD donated</p>
            <p className="text-lg font-bold text-[#2C2416]">{totalRLUSD}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#8a7a6a] mb-1">XRP donated</p>
            <p className="text-lg font-bold text-[#2C2416]">{totalXRP}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#8a7a6a] mb-1">NGOs supported</p>
            <p className="text-lg font-bold text-[#2C2416]">{uniqueNGOs}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#8a7a6a] mb-1">DONO tokens</p>
            <p className="text-lg font-bold text-[#4A7C59]">{totalDONO}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#8a7a6a] mb-1">Bloom stage</p>
            <p className="text-lg font-bold text-[#2C2416]">{bloomStage}</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent activity</h2>
          <div className="space-y-3">
            {allActivity.map((donation, i) => (
              <div
                key={donation.tx_hash + i}
                className="flex items-center justify-between p-3 rounded-xl border border-[#2C2416]/8 hover:bg-[#2C2416]/3 transition-colors"
              >
                <Link to={`/ngo/${donation.ngoId}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2C2416]">
                    {donation.ngoName}
                  </p>
                  <p className="text-xs text-[#8a7a6a]">{donation.date}</p>
                </Link>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <p className="text-sm font-bold text-[#4A7C59]">
                    {donation.amount} {donation.currency}
                  </p>
                  <a
                    href={`https://testnet.xrpl.org/transactions/${donation.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A7C59] hover:text-[#2F5738] transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log out */}
        <button
          onClick={disconnect}
          className="w-full py-3 rounded-xl text-sm font-medium text-[#8a7a6a] hover:text-[#2C2416] border border-[#2C2416]/10 hover:border-[#2C2416]/20 transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
