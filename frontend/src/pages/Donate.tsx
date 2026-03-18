import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Info, Leaf, Loader2 } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { fetchNGOs, prepareTrustline, verifyTrustline } from '../utils/api'
import { RLUSD_ISSUER_ADDRESS, RLUSD_CURRENCY_HEX } from '../utils/constants'
import type { NGOResponse } from '../types'

type Step = 0 | 1 | 2 | 3

export default function Donate() {
  const { address, signTransaction } = useWallet()

  const [step, setStep] = useState<Step>(0)
  const [ngos, setNgos] = useState<NGOResponse[]>([])
  const [loadingNGOs, setLoadingNGOs] = useState(true)
  const [selectedNGO, setSelectedNGO] = useState<NGOResponse | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'rlusd' | 'xrp'>('xrp')
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Fetch NGOs on mount
  useEffect(() => {
    let cancelled = false
    setLoadingNGOs(true)
    fetchNGOs()
      .then((data) => {
        if (!cancelled) setNgos(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load campaigns')
      })
      .finally(() => {
        if (!cancelled) setLoadingNGOs(false)
      })
    return () => { cancelled = true }
  }, [])

  // Redirect if no wallet (after all hooks)
  if (!address) return <Navigate to="/connect" replace />

  const donoAmount = selectedNGO && amount
    ? Math.floor(Number(amount) * Number(selectedNGO.dono_rate))
    : 0

  // ── Step handlers ──

  async function handleAuthorizeTrustline() {
    if (!selectedNGO || !address) return
    setProcessing(true)
    setError(null)
    try {
      const { transaction } = await prepareTrustline(selectedNGO.ngo_id, {
        wallet_address: address,
      })
      const txHash = await signTransaction(transaction)
      if (!txHash) throw new Error('Signing was cancelled')

      // Verify trustline was set
      const verification = await verifyTrustline(selectedNGO.ngo_id, {
        wallet_address: address,
      })
      if (!verification.trustline_ready) {
        throw new Error('Receipt token authorization could not be verified. Please try again.')
      }

      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authorization failed')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDonate() {
    if (!selectedNGO || !amount || Number(amount) <= 0 || !address) return
    setProcessing(true)
    setError(null)
    try {
      let paymentTx: Record<string, unknown>
      if (paymentMethod === 'xrp') {
        // Native XRP — amount in drops (1 XRP = 1,000,000 drops)
        paymentTx = {
          TransactionType: 'Payment',
          Account: address,
          Destination: selectedNGO.treasury_address,
          Amount: String(Math.floor(Number(amount) * 1_000_000)), // XRP in drops
        }
      } else {
        // RLUSD — issued currency amount
        paymentTx = {
          TransactionType: 'Payment',
          Account: address,
          Destination: selectedNGO.treasury_address,
          Amount: {
            currency: RLUSD_CURRENCY_HEX,
            value: amount,
            issuer: RLUSD_ISSUER_ADDRESS,
          },
        }
      }

      const txHash = await signTransaction(paymentTx)
      if (!txHash) throw new Error('Transaction signing was cancelled')

      setStep(3)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Donation failed')
    } finally {
      setProcessing(false)
    }
  }

  // ── Shared top bar ──

  function TopBar() {
    return (
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#4A7C59]" />
          <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">donos</span>
        </Link>
        {step < 3 && (
          <button
            className="btn-ghost flex items-center gap-1 text-sm"
            onClick={() => {
              if (step === 0) window.history.back()
              else setStep((s) => (s - 1) as Step)
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
      </div>
    )
  }

  // ── Step indicators ──

  function StepIndicator() {
    const labels = ['Campaign', 'Authorize', 'Amount', 'Done']
    return (
      <div className="flex items-center justify-center gap-2 mb-10">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step
                  ? 'bg-[#4A7C59] text-white'
                  : i === step
                    ? 'bg-[#4A7C59]/20 text-[#4A7C59] border-2 border-[#4A7C59]'
                    : 'bg-[#2C2416]/8 text-[#2C2416]/40'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i <= step ? 'text-[#2C2416]' : 'text-[#2C2416]/40'}`}>
              {label}
            </span>
            {i < labels.length - 1 && <ChevronRight size={14} className="text-[#2C2416]/20 mx-1" />}
          </div>
        ))}
      </div>
    )
  }

  // ── Loading skeletons ──

  function SkeletonCard() {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-5 bg-[#2C2416]/10 rounded w-3/4 mb-3" />
        <div className="h-4 bg-[#2C2416]/8 rounded w-1/2 mb-4" />
        <div className="h-3 bg-[#2C2416]/6 rounded w-full" />
      </div>
    )
  }

  // ── Error banner ──

  function ErrorBanner() {
    if (!error) return null
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
        <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-red-700 font-medium">Something went wrong</p>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
        <button className="ml-auto text-red-400 hover:text-red-600 text-xs" onClick={() => setError(null)}>
          Dismiss
        </button>
      </div>
    )
  }

  // ── Step 3: Success ──

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2E8BC0] via-[#5DB8E0] to-[#B8E0F0] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Donation Complete</h1>
          <p className="text-white/85 text-lg mb-2">
            You donated <span className="font-semibold">{Number(amount).toFixed(2)} {paymentMethod === 'rlusd' ? 'RLUSD' : 'XRP'}</span> to{' '}
            <span className="font-semibold">{selectedNGO?.name}</span>
          </p>
          <p className="text-white/70 text-sm mb-8">
            You will receive <span className="font-semibold">{donoAmount} DONO</span> receipt tokens as proof of your generosity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app" className="btn-primary inline-block text-center">
              View Dashboard
            </Link>
            <button className="btn-ghost bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => { setStep(0); setAmount(''); setSelectedNGO(null); setPaymentMethod('rlusd') }}>
              Donate Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <TopBar />
        <StepIndicator />
        <ErrorBanner />

        {/* ── Step 0: Choose Campaign ── */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-center">Choose a campaign</h2>
            <p className="text-[#2C2416]/60 text-center text-sm mb-8">
              Select the organization you would like to support
            </p>

            {loadingNGOs ? (
              <div className="grid gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : ngos.length === 0 ? (
              <p className="text-center text-[#2C2416]/50 py-12">No campaigns available right now.</p>
            ) : (
              <div className="grid gap-4">
                {ngos.map((ngo) => (
                  <button
                    key={ngo.ngo_id}
                    className={`glass-card p-5 text-left transition-all hover:scale-[1.01] hover:shadow-md ${
                      selectedNGO?.ngo_id === ngo.ngo_id ? 'ring-2 ring-[#4A7C59]' : ''
                    }`}
                    onClick={() => setSelectedNGO(ngo)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{ngo.name}</h3>
                        <p className="text-sm text-[#2C2416]/60">
                          Rate: 1 RLUSD = {ngo.dono_rate} DONO
                        </p>
                      </div>
                      {selectedNGO?.ngo_id === ngo.ngo_id && (
                        <div className="w-6 h-6 rounded-full bg-[#4A7C59] flex items-center justify-center shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#2C2416]/40 mt-2 font-mono truncate">
                      Treasury: {ngo.treasury_address}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                className="btn-primary px-10"
                disabled={!selectedNGO}
                onClick={() => setStep(1)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Authorize Receipt Token ── */}
        {step === 1 && selectedNGO && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-3 text-center">Authorize receipt token</h2>
            <p className="text-[#2C2416]/60 text-center text-sm mb-10">
              One-time setup for <span className="font-semibold text-[#2C2416]/80">{selectedNGO.name}</span>
            </p>

            <div className="glass-card p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Info size={18} className="text-[#4A7C59] shrink-0" />
                <h3 className="font-semibold text-base">What does this mean?</h3>
              </div>

              <ol className="space-y-5 text-sm text-[#2C2416]/70">
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#4A7C59]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#4A7C59] text-sm font-bold">1</span>
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    When you donate, you receive <strong className="text-[#2C2416]/90">DONO receipt tokens</strong> as proof of your contribution.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#4A7C59]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#4A7C59] text-sm font-bold">2</span>
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    To receive these tokens, your wallet needs to <strong className="text-[#2C2416]/90">authorize them once</strong> per campaign.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#4A7C59]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#4A7C59] text-sm font-bold">3</span>
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    This is free and just tells your wallet to accept receipt tokens from <strong className="text-[#2C2416]/90">{selectedNGO.name}</strong>.
                  </span>
                </li>
              </ol>

              <div className="mt-6 pt-4 border-t border-[#2C2416]/8">
                <p className="text-xs text-[#2C2416]/50 text-center">
                  This is a one-time setup. No funds are transferred during this step.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary px-10 flex items-center gap-2"
                disabled={processing}
                onClick={handleAuthorizeTrustline}
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  'Authorize & Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Enter Amount ── */}
        {step === 2 && selectedNGO && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-2 text-center">Enter donation amount</h2>
            <p className="text-[#2C2416]/60 text-center text-sm mb-8">
              Donating to <span className="font-medium">{selectedNGO.name}</span>
            </p>

            {/* Payment method selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('rlusd')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === 'rlusd'
                    ? 'bg-[#4A7C59] text-white'
                    : 'glass text-[#2C2416]'
                }`}
              >
                RLUSD (Stablecoin)
              </button>
              <button
                onClick={() => setPaymentMethod('xrp')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === 'xrp'
                    ? 'bg-[#4A7C59] text-white'
                    : 'glass text-[#2C2416]'
                }`}
              >
                XRP (Native)
              </button>
            </div>

            <div className="glass-card p-6 mb-6">
              <label className="block text-sm font-medium mb-2">Amount ({paymentMethod === 'rlusd' ? 'RLUSD' : 'XRP'})</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="input-field text-2xl font-semibold text-center"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />

              {amount && Number(amount) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[#4A7C59]/8 text-center">
                  <p className="text-sm text-[#2C2416]/60">You will receive</p>
                  <p className="text-xl font-bold text-[#4A7C59]">
                    {donoAmount} DONO
                  </p>
                  <p className="text-xs text-[#2C2416]/40 mt-1">
                    receipt tokens at {selectedNGO.dono_rate}x rate
                  </p>
                </div>
              )}
            </div>

            <div className="glass-card p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#2C2416]/60">Campaign</span>
                <span className="font-medium">{selectedNGO.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-[#2C2416]/60">Currency</span>
                <span className="font-medium">{paymentMethod === 'rlusd' ? 'RLUSD (Stablecoin)' : 'XRP (Native)'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-[#2C2416]/60">Treasury</span>
                <span className="font-mono text-xs truncate ml-4">{selectedNGO.treasury_address}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-[#2C2416]/60">Your wallet</span>
                <span className="font-mono text-xs truncate ml-4">{address}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="btn-primary px-10 flex items-center gap-2"
                disabled={!amount || Number(amount) <= 0 || processing}
                onClick={handleDonate}
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Donate ${amount ? Number(amount).toFixed(2) : '0.00'} ${paymentMethod === 'rlusd' ? 'RLUSD' : 'XRP'}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
