import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Wallet } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

export default function Connect() {
  const navigate = useNavigate()
  const { address, connect, connecting } = useWallet()

  // If already connected, redirect to app
  useEffect(() => {
    if (address) navigate('/app', { replace: true })
  }, [address, navigate])

  const handleConnect = async () => {
    await connect()
    // After connect, the useEffect above will redirect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Back to landing */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-[#8a7a6a] hover:text-[#2C2416] transition-colors cursor-pointer"
      >
        <Leaf size={18} className="text-[#4A7C59]" />
        <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">donos</span>
      </button>

      <div className="glass-card p-10 md:p-14 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(74,124,89,0.1)] flex items-center justify-center mx-auto mb-6">
          <Wallet size={28} className="text-[#4A7C59]" />
        </div>

        <h1 className="text-2xl font-light text-[#2C2416] mb-3">Connect your wallet</h1>
        <p className="text-sm text-[#8a7a6a] mb-8 leading-relaxed">
          Link your XRPL wallet to start donating and tracking your impact.
          Your wallet is your identity — no passwords, no emails.
        </p>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="btn-primary w-full"
        >
          {connecting ? 'Connecting...' : 'Connect with Xaman'}
        </button>

        <p className="text-xs text-[#a89a8a] mt-6 leading-relaxed">
          By connecting, you agree to receive DONO receipt tokens as proof of your donations.
        </p>
      </div>
    </div>
  )
}
