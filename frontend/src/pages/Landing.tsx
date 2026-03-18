import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import cloud1 from '../../assets/cloud1.png'
import cloud2 from '../../assets/cloud2.png'
import flowers from '../../assets/flowers_corners.png'

export default function Landing() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cloudOffset = Math.min(scrollY * 0.3, 600)
  const sheetProgress = Math.min(Math.max((scrollY - 200) / 400, 0), 1)

  return (
    <div>
      {/* ── Full-screen Hero ── */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2E8BC0] via-[#5DB8E0] via-60% to-[#B8E0F0]" />

        {/* Clouds with parallax */}
        <img src={cloud1} alt="" className="absolute pointer-events-none select-none w-[45%] md:w-[35%] max-w-[500px] top-[8%] left-[2%] opacity-90" style={{ transform: `translateX(${-cloudOffset}px)` }} />
        <img src={cloud2} alt="" className="absolute pointer-events-none select-none w-[40%] md:w-[30%] max-w-[420px] top-[15%] right-[5%] opacity-85" style={{ transform: `translateX(${cloudOffset}px)` }} />
        <img src={cloud2} alt="" className="absolute pointer-events-none select-none w-[30%] md:w-[22%] max-w-[320px] top-[40%] left-[8%] opacity-60" style={{ transform: `translateX(${-cloudOffset * 0.3}px)` }} />
        <img src={cloud1} alt="" className="absolute pointer-events-none select-none w-[28%] md:w-[20%] max-w-[280px] top-[45%] right-[10%] opacity-50" style={{ transform: `translateX(${cloudOffset * 0.4}px)` }} />

        {/* Flowers vignette */}
        <img src={flowers} alt="" className="absolute bottom-0 left-0 right-0 w-full pointer-events-none select-none z-10" style={{ opacity: Math.max(1 - sheetProgress * 1.5, 0) }} />

        {/* Top bar — just the logo and login */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-2">
            <Leaf size={22} className="text-white/90" />
            <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-white tracking-wide">donos</span>
          </div>
          <button onClick={() => navigate('/connect')} className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-5 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors cursor-pointer">
            Log in
          </button>
        </div>

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6 max-w-3xl">
            Transparent donations,<br />
            <em className="italic">verified on-chain.</em>
          </h1>
          <p className="text-lg text-white/80 max-w-lg mx-auto mb-10 leading-relaxed">
            Donate in stablecoins. Receive a verified receipt. Watch exactly where your money goes.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/connect')} className="btn-primary">
              Get started
            </button>
          </div>
        </div>

        {/* Bottom sheet with canvas sliding up */}
        <div
          className="absolute left-0 right-0 bottom-0 z-30 rounded-t-3xl bg-[#FAF6F1] shadow-[0_-8px_40px_rgba(44,36,22,0.08)]"
          style={{
            transform: `translateY(${(1 - sheetProgress) * 100}%)`,
            backgroundImage: 'radial-gradient(circle, rgba(44, 36, 22, 0.13) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 rounded-full bg-[#2C2416]/10" />
          </div>
          <div className="px-8 md:px-16 pb-12 pt-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { val: '1,240', label: 'donations verified' },
                { val: '94%', label: 'funds traceable' },
                { val: '18', label: 'NGOs active' },
                { val: '6,800', label: 'DONO issued' },
              ].map((s, i) => (
                <div key={i} className="glass-card p-4 text-center">
                  <div className="text-2xl font-light text-[#4A7C59]">{s.val}</div>
                  <div className="text-xs text-[#8a7a6a] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Below the fold — brief info ── */}
      <div className="px-6 md:px-12 lg:px-24 py-20 max-w-3xl mx-auto text-center">
        <div className="glass p-12">
          <h2 className="text-2xl font-light text-[#2C2416] mb-4">Every donation, fully traceable.</h2>
          <p className="text-sm text-[#6b5d4f] mb-8 max-w-md mx-auto leading-relaxed">
            Donos connects donors directly to outcomes. Send stablecoins to verified NGOs,
            receive on-chain donation receipts, and follow every fund movement — from your wallet to real-world impact.
          </p>
          <button onClick={() => navigate('/connect')} className="btn-primary mx-auto">
            Connect your wallet
          </button>
        </div>
      </div>
    </div>
  )
}
