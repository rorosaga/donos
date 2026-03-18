import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Leaf, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

/* ── Mock data ────────────────────────────────────────────────── */
interface MockInitiative {
  id: string
  title: string
  description: string
  imageUrl: string
  beneficiaryName: string
  personalizedMessage: string
  amountContributed: number
  date: string
  txHash: string
  ngoId: string
  ngoName: string
  campaignName: string
  category: string
  status: 'completed' | 'in-progress'
}

const MOCK_INITIATIVES: MockInitiative[] = [
  {
    id: 'initiative_classroom',
    title: 'School supplies for Nairobi students',
    description:
      'This initiative provided essential school supplies to 30 students in the Kibera neighborhood of Nairobi. Each student received textbooks, notebooks, pens, and a backpack. The supplies were delivered directly to the local community school in partnership with Education for All Foundation. Teachers reported a measurable increase in class attendance within the first two weeks of distribution.',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    beneficiaryName: 'Maria Wanjiku',
    personalizedMessage: 'Maria got to study in a school thanks to you!',
    amountContributed: 150,
    date: '2026-03-10',
    txHash: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0',
    ngoId: 'ngo_edu_africa',
    ngoName: 'Education for All Foundation',
    campaignName: 'Back to School 2026',
    category: 'Education',
    status: 'completed',
  },
  {
    id: 'initiative_scholarship',
    title: 'Scholarship disbursement program',
    description:
      'Providing full academic scholarships for 25 underprivileged students in Nairobi for the 2026 school year. Each scholarship covers tuition, books, uniforms, and a monthly stipend for meals.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    beneficiaryName: 'Samuel Mwangi',
    personalizedMessage: 'Samuel is the first in his family to attend school thanks to your generosity.',
    amountContributed: 70,
    date: '2026-03-05',
    txHash: 'D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3',
    ngoId: 'ngo_edu_africa',
    ngoName: 'Education for All Foundation',
    campaignName: 'Scholarship Program 2026',
    category: 'Education',
    status: 'completed',
  },
  {
    id: 'initiative_well',
    title: 'Clean water well in Kisumu',
    description:
      'Construction of a deep-bore well serving over 200 families in the outskirts of Kisumu. The well reaches 45 meters and taps into a clean aquifer. A solar-powered pump was installed to ensure reliable water access without ongoing fuel costs. The project is currently at 60% completion, with the pump installation phase underway.',
    imageUrl: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    beneficiaryName: 'James Odhiambo',
    personalizedMessage: 'James and his family now have clean drinking water because of your support.',
    amountContributed: 60,
    date: '2026-03-11',
    txHash: 'B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1',
    ngoId: 'ngo_clean_water',
    ngoName: 'Clean Water Initiative',
    campaignName: 'Wells for Kisumu',
    category: 'Infrastructure',
    status: 'in-progress',
  },
  {
    id: 'initiative_filter',
    title: 'Water filter distribution',
    description:
      'Providing household water filters to 500 families in rural villages to reduce waterborne illness. Each filter provides clean water for up to 5 years and eliminates 99.9% of bacteria and parasites.',
    imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600',
    beneficiaryName: 'Grace Atieno',
    personalizedMessage: 'Grace and her children no longer get sick from contaminated water.',
    amountContributed: 45,
    date: '2026-03-08',
    txHash: 'E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4',
    ngoId: 'ngo_clean_water',
    ngoName: 'Clean Water Initiative',
    campaignName: 'Water Filter Distribution',
    category: 'Distribution',
    status: 'completed',
  },
  {
    id: 'initiative_solar',
    title: 'Solar panels for rural villages',
    description:
      'Installation of off-grid solar panel systems across three villages in the Rift Valley region. Each village received a 5kW community solar array paired with battery storage, providing reliable electricity to power lights, charge devices, and run a small refrigeration unit at the local clinic. The project aims to replace kerosene lamps and reduce indoor air pollution.',
    imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800',
    beneficiaryName: 'Amina Chebet',
    personalizedMessage: 'Amina can now study after dark thanks to the solar panels you helped fund.',
    amountContributed: 120,
    date: '2026-03-13',
    txHash: 'C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2',
    ngoId: 'ngo_solar_villages',
    ngoName: 'SolarVillages',
    campaignName: 'Light the Rift',
    category: 'Energy',
    status: 'in-progress',
  },
  {
    id: 'initiative_food',
    title: 'Emergency food relief in Horn of Africa',
    description:
      'Providing emergency food packages to families affected by the drought. Each package contains enough rice, beans, cooking oil, and fortified flour to feed a family of five for two weeks.',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600',
    beneficiaryName: 'Hassan Ali',
    personalizedMessage: 'Hassan and his family received food packages during the drought thanks to you.',
    amountContributed: 120,
    date: '2026-02-20',
    txHash: 'F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5',
    ngoId: 'ngo_foodbank',
    ngoName: 'Global Food Bank Network',
    campaignName: 'Emergency Food Relief',
    category: 'Emergency',
    status: 'completed',
  },
  {
    id: 'initiative_logistics',
    title: 'Cold-chain logistics network',
    description:
      'Establishing a cold-chain logistics network to safely transport perishable food to remote communities. Includes two refrigerated trucks and five solar-powered cold storage units.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    beneficiaryName: 'Community of Turkana',
    personalizedMessage: 'Fresh food now reaches Turkana weekly thanks to the logistics network you funded.',
    amountContributed: 55,
    date: '2026-03-01',
    txHash: 'G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
    ngoId: 'ngo_foodbank',
    ngoName: 'Global Food Bank Network',
    campaignName: 'Logistics Upgrade',
    category: 'Infrastructure',
    status: 'in-progress',
  },
  {
    id: 'initiative_medical',
    title: 'Medical supplies for refugee camps',
    description:
      'Assembling and distributing essential health kits to three refugee camps in East Africa. Each kit contains medications, first-aid supplies, and hygiene essentials for a family of four.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    beneficiaryName: 'Dr. Fatima Osman',
    personalizedMessage: 'Dr. Fatima was able to treat 200 patients with the medical supplies you funded.',
    amountContributed: 180,
    date: '2026-03-03',
    txHash: 'H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7',
    ngoId: 'ngo_healthkits',
    ngoName: 'MedSupply International',
    campaignName: 'Refugee Camp Health Kits',
    category: 'Healthcare',
    status: 'completed',
  },
  {
    id: 'initiative_assembly',
    title: 'Health kit assembly program',
    description:
      'A community-based health kit assembly program that employs local workers to assemble 2,000 health kits. Each worker is trained in quality control and hygiene standards.',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
    beneficiaryName: 'Community Health Workers',
    personalizedMessage: 'Your support created 15 local jobs and 2,000 health kits for families in need.',
    amountContributed: 80,
    date: '2026-03-08',
    txHash: 'I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8',
    ngoId: 'ngo_healthkits',
    ngoName: 'MedSupply International',
    campaignName: 'Kit Assembly Program',
    category: 'Healthcare',
    status: 'completed',
  },
  {
    id: 'initiative_shipping',
    title: 'Health kit shipping and logistics',
    description:
      'Coordinating the shipping and last-mile delivery of health kits from assembly centers to clinics and refugee camps across three countries.',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
    beneficiaryName: 'Remote Clinics Network',
    personalizedMessage: 'Health kits reached 50 remote clinics thanks to the logistics network you funded.',
    amountContributed: 90,
    date: '2026-03-10',
    txHash: 'J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9',
    ngoId: 'ngo_healthkits',
    ngoName: 'MedSupply International',
    campaignName: 'Shipping & Logistics',
    category: 'Logistics',
    status: 'in-progress',
  },
]

/* ── Status badge helper ──────────────────────────────────────── */
function statusBadgeClass(status: string) {
  return status === 'completed' ? 'badge-green' : 'badge-amber'
}

/* ── Main Component ──────────────────────────────────────────── */
export default function Initiative() {
  const { id } = useParams<{ id: string }>()
  const { address } = useWallet()
  const navigate = useNavigate()

  useEffect(() => {
    if (!address) {
      navigate('/connect', { replace: true })
    }
  }, [address, navigate])

  if (!address) return null

  const initiative = MOCK_INITIATIVES.find((init) => init.id === id)

  if (!initiative) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={40} className="text-[#BA7517] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Initiative not found</h2>
          <p className="text-[#2C2416]/60 mb-6">
            The initiative you are looking for does not exist.
          </p>
          <Link to="/app" className="btn-primary inline-block">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const explorerUrl = `https://testnet.xrpl.org/transactions/${initiative.txHash}`

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#4A7C59]" />
          <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">
            donos
          </span>
        </Link>
        <button
          className="btn-ghost flex items-center gap-1 text-sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left column (wider) ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden">
              <img
                src={initiative.imageUrl}
                alt={initiative.title}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>

            {/* Title and description */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">
                {initiative.title}
              </h1>
              <p className="text-[#2C2416]/70 text-sm leading-relaxed">
                {initiative.description}
              </p>
            </div>
          </div>

          {/* ── Right column (narrower) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personalized message card */}
            <div className="glass-card p-6">
              <p className="text-sm font-semibold text-[#2C2416] mb-3">
                {initiative.beneficiaryName}
              </p>
              <p className="text-sm italic text-[#2C2416]/70 mb-4 leading-relaxed">
                "{initiative.personalizedMessage}"
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6a]">Contributed</span>
                  <span className="font-bold text-[#4A7C59]">
                    {initiative.amountContributed} RLUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6a]">Date</span>
                  <span className="text-[#2C2416]">{initiative.date}</span>
                </div>
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
              >
                View on XRPL Explorer
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Initiative details card */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Initiative details</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6a]">NGO</span>
                  <Link
                    to={`/ngo/${initiative.ngoId}`}
                    className="text-[#4A7C59] font-medium hover:underline"
                  >
                    {initiative.ngoName}
                  </Link>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6a]">Campaign</span>
                  <span className="text-[#2C2416]">{initiative.campaignName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8a7a6a]">Category</span>
                  <span className="badge-grey">{initiative.category}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8a7a6a]">Status</span>
                  <span className={statusBadgeClass(initiative.status)}>
                    {initiative.status === 'completed' ? 'Completed' : 'In progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
