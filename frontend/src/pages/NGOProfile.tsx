import { useState, useEffect } from 'react'
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Globe, CheckCircle, Leaf } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { fetchDonations } from '../utils/api'
import type { DonationResponse } from '../types'

// ── Types ──

interface Campaign {
  id: string
  title: string
  description: string
  goal: number
  raised: number
  image_url: string
  category: string
}

interface Donation {
  id: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
  tx_hash: string
}

interface SpendingItem {
  id: string
  destination: string
  amount: number
  initiative_id: string | null
  has_proof: boolean
}

interface Rating {
  overall: number
  transparency: number
  activity: number
  donor_diversity: number
  total_donations: number
  unique_donors: number
}

interface BlockchainDetails {
  treasury: string
  issuer: string
  distributor: string
  trustline_tx_hash: string
  issuance_tx_hash: string
  distribution_tx_hash: string
}

interface MockNGO {
  ngo_id: string
  name: string
  description: string
  category: string
  image_url: string
  credibility_score: number
  website: string
  founded_year: number
  blockchain: BlockchainDetails
  gallery: string[]
  rating: Rating
  campaigns: Campaign[]
  my_donations: Donation[]
  spending_flow: SpendingItem[]
}

// ── Mock Data ──

const MOCK_NGOS: Record<string, MockNGO> = {
  ngo_clean_water: {
    ngo_id: 'ngo_clean_water',
    name: 'Clean Water Initiative',
    description:
      'Providing access to clean drinking water in underserved communities worldwide. We build wells, install filtration systems, and train local technicians for long-term sustainability across Africa, South Asia, and Central America.',
    category: 'Water & Sanitation',
    image_url: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800',
    credibility_score: 92,
    website: 'https://cleanwater.org',
    founded_year: 2018,
    blockchain: {
      treasury: 'r9NpkP2Xu34htMEd7VPhTm3smVTCr35GkY',
      issuer: 'rppXAyhGSVKfaxo6se4VV9UaRtXRq2Xdn9',
      distributor: 'rswNk5zJ4aQi1roa1XkvjWwWdJJ35zVsCs',
      trustline_tx_hash: '5D726E5E9588367ECD269E863278826DF171FB2E4F0C7EC162B74A018A0B759F',
      issuance_tx_hash: 'E74B9237B970F536C2B30AC5AB98AEA13D209E653B02911813C4A7FABBFAB72D',
      distribution_tx_hash: 'B7F9CC0026EC09DAB9BB8868198A80A96ED774E5679229C22A13EDBF71AA779F',
    },
    gallery: [
      'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=600',
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600',
      'https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=600',
    ],
    rating: {
      overall: 4.6,
      transparency: 0.95,
      activity: 0.88,
      donor_diversity: 0.93,
      total_donations: 43,
      unique_donors: 28,
    },
    campaigns: [
      {
        id: 'camp1',
        title: 'Well Construction in Kisumu',
        description: 'Building 5 new wells to serve 2,000 families in the Kisumu region with clean, sustainable water access year-round.',
        goal: 15000,
        raised: 8750,
        image_url: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=600',
        category: 'Infrastructure',
      },
      {
        id: 'camp2',
        title: 'Water Filter Distribution',
        description: 'Providing household water filters to 500 families in rural villages to reduce waterborne illness.',
        goal: 5000,
        raised: 3200,
        image_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600',
        category: 'Distribution',
      },
    ],
    my_donations: [
      { id: 'd1', amount: 50, date: '2026-03-17', status: 'completed', tx_hash: 'CDFB103B7E6BE0DE0C9FA685A3182AD6A387A5B539DF542D15F39AAEBA103749' },
    ],
    spending_flow: [
      { id: 'init1', destination: 'Well construction materials', amount: 60, initiative_id: 'initiative_well', has_proof: true },
      { id: 'init2', destination: 'Water filter purchase', amount: 45, initiative_id: 'initiative_filter', has_proof: true },
      { id: 'init3', destination: 'Community training', amount: 30, initiative_id: null, has_proof: false },
      { id: 'init4', destination: 'Unallocated', amount: 15, initiative_id: null, has_proof: false },
    ],
  },

  ngo_edu_africa: {
    ngo_id: 'ngo_edu_africa',
    name: 'Education for All Foundation',
    description:
      'Funding scholarships, building schools, and training teachers across the globe. From rural Sub-Saharan Africa to underserved communities in South Asia and Latin America, we believe every child deserves access to quality education regardless of geography or economic background.',
    category: 'Education',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
    credibility_score: 78,
    website: 'https://educationforall.org',
    founded_year: 2015,
    blockchain: {
      treasury: 'rLbXCck9QTjNXoFmgS18cqH62o4yBkjSTG',
      issuer: 'rMNRLoL8Js4ytBuynAezwbPEcRJ9ufkQzM',
      distributor: 'rM8vwBcEbyE5qjK3ceLxK3grYg1Vct4Yjc',
      trustline_tx_hash: '7356C81163AA93845F87F784F2CDC0BF4EE13070DF4F092569C18BB497C4EB12',
      issuance_tx_hash: '183B8DE938278DF2FA954B67D3DCE6D8E496D38441F89A393FEBB2FB1FC92F41',
      distribution_tx_hash: '3CE59D773A3A290A5FB09A94C676F53C22F759B6C6AE91FB0C961F55A1CFD491',
    },
    gallery: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600',
    ],
    rating: {
      overall: 3.9,
      transparency: 0.72,
      activity: 0.85,
      donor_diversity: 0.77,
      total_donations: 31,
      unique_donors: 19,
    },
    campaigns: [
      {
        id: 'camp3',
        title: 'Classroom Construction in Nairobi',
        description: 'Building 3 new classrooms to accommodate 150 students who currently study under trees.',
        goal: 20000,
        raised: 12400,
        image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
        category: 'Infrastructure',
      },
      {
        id: 'camp4',
        title: 'Scholarship Program 2026',
        description: 'Providing full academic scholarships for 25 underprivileged students for the 2026 school year.',
        goal: 10000,
        raised: 4800,
        image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600',
        category: 'Scholarships',
      },
      {
        id: 'camp5',
        title: 'Teacher Training Workshop',
        description: 'A two-week intensive training program for 40 teachers on modern pedagogical methods.',
        goal: 8000,
        raised: 8000,
        image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
        category: 'Training',
      },
    ],
    my_donations: [
      { id: 'd3', amount: 30, date: '2026-03-17', status: 'completed', tx_hash: '1A33E8ADCCE6A2324EEA7A115FEACAAE6BD2650E431A219B7210FF59A7546231' },
    ],
    spending_flow: [
      { id: 'init5', destination: 'Classroom materials', amount: 90, initiative_id: 'initiative_classroom', has_proof: true },
      { id: 'init6', destination: 'Scholarship disbursement', amount: 70, initiative_id: 'initiative_scholarship', has_proof: true },
      { id: 'init7', destination: 'Teacher stipends', amount: 25, initiative_id: null, has_proof: false },
      { id: 'init8', destination: 'Unallocated', amount: 15, initiative_id: null, has_proof: false },
    ],
  },

  ngo_solar_villages: {
    ngo_id: 'ngo_solar_villages',
    name: 'SolarVillages',
    description:
      'Bringing affordable solar energy to off-grid communities in Southeast Asia and Latin America. We install solar micro-grids, distribute solar lanterns, and train local technicians to maintain systems in remote villages from the Philippines to Guatemala.',
    category: 'Renewable Energy',
    image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
    credibility_score: 88,
    website: 'https://solarvillages.org',
    founded_year: 2020,
    blockchain: {
      treasury: 'rHD87Fu1vM7iBZqVFJXXgBLogMG3sKenMT',
      issuer: 'rUagvsY5rGdWiNUa7c9agCa4YkH92x9ZNy',
      distributor: 'rUjUkyKShpqPfyrvb7NCJwncAWidQYjLoP',
      trustline_tx_hash: '96CB70872C88FAA0425C47F6FC139014F4B7860E843EB8647FF40ED92D5FE09E',
      issuance_tx_hash: '91454525462C78806EBFA2B39A5987CC5DA92C7E3133813FD55ECC18B807B233',
      distribution_tx_hash: '53DC58EDA6A93D758AD54926965FF060C9ED1BE5083790F7177FB1DDB02B7624',
    },
    gallery: [
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600',
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600',
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600',
    ],
    rating: {
      overall: 4.4,
      transparency: 0.91,
      activity: 0.82,
      donor_diversity: 0.90,
      total_donations: 56,
      unique_donors: 35,
    },
    campaigns: [
      {
        id: 'camp6',
        title: 'Solar Micro-Grid for Rangpur',
        description: 'Installing a 50kW solar micro-grid to power 200 homes in the Rangpur district of Bangladesh.',
        goal: 25000,
        raised: 18200,
        image_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600',
        category: 'Infrastructure',
      },
      {
        id: 'camp7',
        title: 'Solar Lantern Distribution',
        description: 'Distributing 1,000 solar lanterns to families currently relying on kerosene lamps.',
        goal: 7500,
        raised: 5100,
        image_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600',
        category: 'Distribution',
      },
    ],
    my_donations: [
      { id: 'd9', amount: 25, date: '2026-03-17', status: 'completed', tx_hash: 'E401B8F228F770EF0F39F0E08F7B52A2C862045868BC76BF262539320160C384' },
    ],
    spending_flow: [],
  },

  ngo_foodbank: {
    ngo_id: 'ngo_foodbank',
    name: 'Global FoodBank Network',
    description:
      'Fighting hunger by connecting surplus food with communities in need across six continents. We operate collection centers, cold-chain logistics, and last-mile distribution to ensure food reaches those who need it most -- from urban food deserts in North America to drought-affected regions in East Africa.',
    category: 'Food Security',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    credibility_score: 85,
    website: 'https://globalfoodbank.org',
    founded_year: 2016,
    blockchain: {
      treasury: 'rQNjQrLS52KwakfETjStE7GtTAFkqoXNsY',
      issuer: 'rnZZF5qbfazV9t7kFCuWUdogHEHGHrHfoH',
      distributor: 'rBYY3bFwg5AjSAJ2niPtX5sJECq6ENNcy2',
      trustline_tx_hash: '6C1817606A941FFDE3A3195864BE67B120127FF1B12FB3A930D383984E09ABF7',
      issuance_tx_hash: 'F8A3BC7006F799DB074A2B07943D24C1818D0F098DB4E85F3F88C8DFE4CB2464',
      distribution_tx_hash: '8AC4730C84F03EE71618180B91BA809F426BF0BD1EED91A9859DDFE97018FF1C',
    },
    gallery: [
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600',
    ],
    rating: {
      overall: 4.2,
      transparency: 0.87,
      activity: 0.83,
      donor_diversity: 0.85,
      total_donations: 67,
      unique_donors: 42,
    },
    campaigns: [
      {
        id: 'camp8',
        title: 'Emergency Food Relief - Horn of Africa',
        description: 'Providing emergency food packages to 5,000 families affected by the drought in the Horn of Africa.',
        goal: 30000,
        raised: 22500,
        image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600',
        category: 'Emergency',
      },
      {
        id: 'camp9',
        title: 'School Lunch Program',
        description: 'Feeding 800 school children daily with nutritious meals to improve attendance and learning outcomes.',
        goal: 12000,
        raised: 6700,
        image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600',
        category: 'Nutrition',
      },
    ],
    my_donations: [
      { id: 'd4', amount: 15, date: '2026-03-17', status: 'completed', tx_hash: 'CC6AD96BB762488051B3DA77DF1BFAEC5E625D018691526B5DD62F2B66F2E70D' },
    ],
    spending_flow: [
      { id: 'init9', destination: 'Food procurement', amount: 120, initiative_id: 'initiative_food', has_proof: true },
      { id: 'init10', destination: 'Cold-chain logistics', amount: 55, initiative_id: 'initiative_logistics', has_proof: true },
      { id: 'init11', destination: 'Volunteer coordination', amount: 35, initiative_id: null, has_proof: false },
      { id: 'init12', destination: 'Unallocated', amount: 65, initiative_id: null, has_proof: false },
    ],
  },

  ngo_healthkits: {
    ngo_id: 'ngo_healthkits',
    name: 'MedSupply International',
    description:
      'Assembling and distributing essential medical supply kits to clinics, refugee camps, and disaster zones worldwide. From post-earthquake relief in Turkey to rural health outreach in Southeast Asia, each kit contains medications, first-aid supplies, and hygiene essentials tailored to local needs.',
    category: 'Healthcare',
    image_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
    credibility_score: 95,
    website: 'https://medsupply.org',
    founded_year: 2012,
    blockchain: {
      treasury: 'rfqHHZ8gK9ubtdyRk3Y2azZLhYcHWikmNZ',
      issuer: 'rH4WeuTbVfdWqjNGsnQX5j1YABMDkqi8VG',
      distributor: 'rPQGmTtQZ4cfiL5ThKT2mtg1SpHiqmDWHK',
      trustline_tx_hash: 'D74810335BAA89E96B9549287E9374A4508B5C727680570C2E3AD7D55EFFE8A3',
      issuance_tx_hash: 'C81E1AFC58864D548760F39B50CB4A289BC4F39C1AF0934AFC1C32C1F2BAF89B',
      distribution_tx_hash: 'D919091C59FCEB9A2AAF9B31BAEEAD641E0E0DE4963EBB8959E8269E09DDAE91',
    },
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    ],
    rating: {
      overall: 4.8,
      transparency: 0.97,
      activity: 0.92,
      donor_diversity: 0.95,
      total_donations: 112,
      unique_donors: 78,
    },
    campaigns: [
      {
        id: 'camp10',
        title: 'Refugee Camp Health Kits',
        description: 'Producing 2,000 health kits for distribution across refugee camps in the Middle East and East Africa.',
        goal: 18000,
        raised: 16500,
        image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
        category: 'Emergency',
      },
      {
        id: 'camp11',
        title: 'Rural Clinic Resupply',
        description: 'Restocking 50 rural clinics with essential medications and first-aid supplies for 6 months.',
        goal: 22000,
        raised: 14300,
        image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
        category: 'Medical Supply',
      },
      {
        id: 'camp12',
        title: 'Hygiene Education Program',
        description: 'Training 3,000 community members in hygiene best practices alongside kit distribution.',
        goal: 6000,
        raised: 6000,
        image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
        category: 'Training',
      },
    ],
    my_donations: [
      { id: 'd7', amount: 10, date: '2026-03-17', status: 'completed', tx_hash: '3D4637872CDA9CDDED5421F5ADA53B07F8AFE3F2256DCC0AC86411B933A69C79' },
    ],
    spending_flow: [
      { id: 'init13', destination: 'Medical supplies', amount: 180, initiative_id: 'initiative_medical', has_proof: true },
      { id: 'init14', destination: 'Kit assembly labor', amount: 80, initiative_id: 'initiative_assembly', has_proof: true },
      { id: 'init15', destination: 'Shipping & logistics', amount: 90, initiative_id: 'initiative_shipping', has_proof: true },
      { id: 'init16', destination: 'Unallocated', amount: 50, initiative_id: null, has_proof: false },
    ],
  },
}

// ── Score Bar Component ──

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100)
  const color = percent >= 85 ? '#4A7C59' : percent >= 65 ? '#BA7517' : '#B93C3C'

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#2C2416]/70">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {percent}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#2C2416]/8">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── River Diagram Component ──

function RiverDiagram({
  ngoName,
  totalDonated,
  spendingFlow,
}: {
  ngoName: string
  totalDonated: number
  spendingFlow: SpendingItem[]
}) {
  const navigate = useNavigate()

  if (spendingFlow.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <h2 className="text-xl font-semibold mb-3">Money Flow</h2>
        <p className="text-[#2C2416]/50 text-sm">
          No donations yet. Support this campaign to see how your money flows.
        </p>
      </div>
    )
  }

  const nodeCount = spendingFlow.length
  const svgHeight = Math.max(300, nodeCount * 70 + 40)
  const rightStartY = 30
  const rightSpacing = (svgHeight - 60) / Math.max(nodeCount - 1, 1)
  const centerY = svgHeight / 2

  // Pastel palette
  const pastelColors = ['#C8E6C9', '#B3E5FC', '#FFE0B2', '#F8BBD0', '#D1C4E9', '#DCEDC8']

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">Money Flow</h2>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 800 ${svgHeight}`}
          className="w-full min-w-[600px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left node: Your Donations */}
          <rect x="20" y={centerY - 30} width="160" height="60" rx="12" fill="#C8E6C9" stroke="#4A7C59" strokeWidth="1.5" />
          <text x="100" y={centerY - 5} textAnchor="middle" className="text-xs" fill="#2C2416" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600">
            Your donations
          </text>
          <text x="100" y={centerY + 15} textAnchor="middle" fill="#4A7C59" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">
            {totalDonated} RLUSD
          </text>

          {/* Center node: NGO Treasury */}
          <rect x="300" y={centerY - 30} width="180" height="60" rx="12" fill="#B3E5FC" stroke="#4DA6D9" strokeWidth="1.5" />
          <text x="390" y={centerY - 5} textAnchor="middle" fill="#2C2416" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600">
            {ngoName.length > 22 ? ngoName.slice(0, 20) + '...' : ngoName}
          </text>
          <text x="390" y={centerY + 15} textAnchor="middle" fill="#4DA6D9" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="500">
            Treasury
          </text>

          {/* Curve: Left to Center */}
          <path
            d={`M 180 ${centerY} C 240 ${centerY}, 240 ${centerY}, 300 ${centerY}`}
            fill="none"
            stroke="#4A7C59"
            strokeWidth="2"
            strokeOpacity="0.5"
          />

          {/* Right nodes: Spending items */}
          {spendingFlow.map((item, i) => {
            const nodeY = nodeCount === 1 ? centerY : rightStartY + i * rightSpacing
            const fillColor = pastelColors[i % pastelColors.length]
            const isClickable = !!item.initiative_id

            return (
              <g key={item.id}>
                {/* Curve: Center to Right node */}
                <path
                  d={`M 480 ${centerY} C 540 ${centerY}, 560 ${nodeY}, 600 ${nodeY}`}
                  fill="none"
                  stroke="#4DA6D9"
                  strokeWidth="1.5"
                  strokeOpacity="0.45"
                />

                {/* Right node */}
                <g
                  className={isClickable ? 'cursor-pointer' : ''}
                  onClick={() => {
                    if (isClickable) navigate(`/initiative/${item.initiative_id}`)
                  }}
                >
                  <rect
                    x="600"
                    y={nodeY - 22}
                    width="180"
                    height="44"
                    rx="12"
                    fill={fillColor}
                    stroke={isClickable ? '#4A7C59' : '#2C2416'}
                    strokeWidth={isClickable ? '1.5' : '0.8'}
                    strokeOpacity={isClickable ? '0.7' : '0.2'}
                  />
                  <text
                    x="690"
                    y={nodeY - 3}
                    textAnchor="middle"
                    fill="#2C2416"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {item.destination.length > 22 ? item.destination.slice(0, 20) + '...' : item.destination}
                  </text>
                  <text
                    x="690"
                    y={nodeY + 13}
                    textAnchor="middle"
                    fill="#4A7C59"
                    fontFamily="Inter, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {item.amount} RLUSD
                  </text>

                  {/* Proof badge */}
                  {item.has_proof && (
                    <circle cx="773" cy={nodeY - 15} r="7" fill="#4A7C59" />
                  )}
                  {item.has_proof && (
                    <text x="773" y={nodeY - 11} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">
                      &#10003;
                    </text>
                  )}
                </g>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-[#2C2416]/50">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#4A7C59]" />
          Proof verified
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-[#4A7C59]/40" />
          Clickable -- view initiative
        </span>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function NGOProfile() {
  const { id } = useParams<{ id: string }>()
  const { address } = useWallet()
  const navigate = useNavigate()

  if (!address) return <Navigate to="/connect" replace />

  const ngo = id ? MOCK_NGOS[id] : undefined

  if (!ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
          <p className="text-[#2C2416]/60 mb-6">
            The organization you are looking for does not exist.
          </p>
          <Link to="/donate" className="btn-primary inline-block">
            Browse campaigns
          </Link>
        </div>
      </div>
    )
  }

  // Fetch real donations from backend and merge with mock data
  const [liveDonations, setLiveDonations] = useState<Donation[]>([])
  const [liveSpendingFlow, setLiveSpendingFlow] = useState<SpendingItem[]>([])

  useEffect(() => {
    if (!address) return
    // Try fetching with both the mock ngo_id and just the wallet address
    // The backend uses UUID ngo_ids, frontend uses string IDs
    fetchDonations({ donor_wallet_address: address })
      .then((real: DonationResponse[]) => {
        const mapped: Donation[] = real
          .filter(d => {
            const s = d.state || d.processing_state
            return s === 'sent_to_donor' || s === 'issued_to_distributor'
          })
          .map(d => ({
            id: d.donation_id,
            amount: Number(d.rlusd_amount),
            date: d.created_at.split('T')[0],
            status: ((d.state || d.processing_state) === 'sent_to_donor' ? 'completed' : 'pending') as 'completed' | 'pending',
            tx_hash: d.detection_tx_hash || d.payment_reference,
          }))
        setLiveDonations(mapped)

        // Build spending items from real donation data for this NGO
        const ngoUUIDs: Record<string, string> = {
          'ngo_clean_water': '8c98e479-2db7-4bbd-85ef-fb3c10aad709',
          'ngo_edu_africa': 'd85563d4-d48a-4f55-9378-2cfe43ab96fc',
          'ngo_solar_villages': '0682f6f2-f66c-4521-964b-05ca817c3ec3',
          'ngo_foodbank': 'fd95f529-fa3f-4ff6-87c7-6db0038c9aea',
          'ngo_healthkits': '97be9e06-856c-47a0-acac-c6f9ac3488bf',
        }
        const uuid = ngoUUIDs[id || '']
        const ngoReal = real.filter(d => d.ngo_id === uuid && (d.state === 'sent_to_donor' || d.processing_state === 'sent_to_donor'))

        const items: SpendingItem[] = ngoReal.map(d => ({
          id: d.donation_id,
          destination: `Donation (${d.rlusd_amount} RLUSD)`,
          amount: Number(d.rlusd_amount),
          initiative_id: null,
          has_proof: !!(d.issuance_tx_hash && d.distribution_tx_hash),
        }))
        setLiveSpendingFlow(items)
      })
      .catch(() => {}) // silently fall back to mock data
  }, [id, address])

  // Merge: mock donations + real ones (deduplicate by tx_hash)
  const allDonations = [...ngo.my_donations]
  for (const live of liveDonations) {
    if (!allDonations.some(d => d.tx_hash === live.tx_hash)) {
      allDonations.push(live)
    }
  }

  // Merge: mock spending flow + live spending flow (deduplicate by id)
  const allSpendingFlow = [...ngo.spending_flow]
  for (const live of liveSpendingFlow) {
    if (!allSpendingFlow.some(s => s.id === live.id)) {
      allSpendingFlow.push(live)
    }
  }

  const isDonor = allDonations.length > 0
  const totalDonated = allDonations.reduce((sum, d) => sum + d.amount, 0)
  const scoreColor =
    ngo.credibility_score >= 85
      ? '#4A7C59'
      : ngo.credibility_score >= 65
        ? '#BA7517'
        : '#B93C3C'

  return (
    <div className="min-h-screen relative">
      {/* ── Sky background with clouds + flowers ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2E8BC0] via-[#5DB8E0] via-60% to-[#B8E0F0]" />
        <img src="/assets/cloud1.png" alt="" className="absolute top-[5%] left-[2%] w-[35%] max-w-[400px] opacity-80 pointer-events-none select-none" />
        <img src="/assets/cloud2.png" alt="" className="absolute top-[12%] right-[5%] w-[28%] max-w-[350px] opacity-70 pointer-events-none select-none" />
        <img src="/assets/flowers_corners.png" alt="" className="absolute bottom-0 left-0 right-0 w-full pointer-events-none select-none" />
      </div>

      {/* ── App window ── */}
      <div className="relative z-10 min-h-screen pt-6 pb-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto bg-[#FAF6F1] rounded-3xl shadow-[0_8px_60px_rgba(44,36,22,0.12)] overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(44, 36, 22, 0.13) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        >
      <div className="py-8 px-4 sm:px-8">
        {/* -- Top Bar -- */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <Leaf className="w-5 h-5 text-[#4A7C59]" />
            <span className="font-['IvyPresto_Headline','Playfair_Display',serif] text-xl font-light text-[#2C2416] tracking-wide">
              donos
            </span>
          </Link>
          <button
            className="btn-ghost flex items-center gap-1 text-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* -- Donor Badge -- */}
        {isDonor && (
          <div className="mb-4">
            <span className="badge-green inline-flex items-center gap-1.5 text-sm px-4 py-1.5">
              <CheckCircle size={14} />
              You are a donor
            </span>
          </div>
        )}

        {/* -- Hero Section -- */}
        <div className="glass-card overflow-hidden mb-8">
          <img
            src={ngo.image_url}
            alt={ngo.name}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="flex-1">
                <span className="bg-[#4A7C59] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block">{ngo.category}</span>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2416] mb-2">
                  {ngo.name}
                </h1>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center bg-[#FAF6F1]"
                  style={{ borderColor: scoreColor }}
                >
                  <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                    {ngo.credibility_score}
                  </span>
                </div>
                <span className="text-xs text-[#8a7a6a] mt-1">Credibility</span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[#2C2416]/80 leading-relaxed mb-4">{ngo.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#2C2416]/60">
                <a
                  href={ngo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#4A7C59] hover:underline"
                >
                  <Globe size={14} />
                  {ngo.website.replace('https://', '')}
                </a>
                <span>Founded {ngo.founded_year}</span>
                <span>{ngo.rating.unique_donors} donors</span>
                <span>{ngo.rating.total_donations} total donations</span>
              </div>
            </div>
          </div>
        </div>

        {/* -- Gallery -- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {ngo.gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${ngo.name} gallery ${i + 1}`}
                className="h-[200px] w-auto rounded-xl object-cover shrink-0"
              />
            ))}
          </div>
        </div>

        {/* -- Campaigns / Projects -- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Campaigns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ngo.campaigns.map((campaign) => {
              const progress = Math.min((campaign.raised / campaign.goal) * 100, 100)
              return (
                <div key={campaign.id} className="glass-card overflow-hidden flex flex-col">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-grey text-xs">{campaign.category}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-1">{campaign.title}</h3>
                    <p className="text-sm text-[#2C2416]/60 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-[#2C2416]/60 mb-1.5">
                        <span>{campaign.raised.toLocaleString()} RLUSD raised</span>
                        <span>{campaign.goal.toLocaleString()} goal</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2C2416]/8 mb-4">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: progress >= 100 ? '#4A7C59' : '#4DA6D9',
                          }}
                        />
                      </div>
                      <Link
                        to={`/donate?ngo=${ngo.ngo_id}`}
                        className="btn-primary block text-center text-sm py-2.5"
                      >
                        Donate to this
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* -- River Diagram -- */}
        <div className="mb-8">
          <RiverDiagram
            ngoName={ngo.name}
            totalDonated={totalDonated}
            spendingFlow={allSpendingFlow}
          />
        </div>

        {/* -- My Donations -- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Donations</h2>
          {allDonations.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[#2C2416]/50 text-sm">
                No donations yet. Support this campaign to see your impact here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allDonations.map((donation) => (
                <div key={donation.id} className="glass-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-[#4A7C59]">
                        {donation.amount} RLUSD
                      </span>
                      <span className="text-sm text-[#2C2416]/50">{donation.date}</span>
                      <span
                        className={
                          donation.status === 'completed'
                            ? 'badge-green'
                            : donation.status === 'pending'
                              ? 'badge-amber'
                              : 'badge-red'
                        }
                      >
                        {donation.status}
                      </span>
                    </div>
                    <a
                      href={`https://testnet.xrpl.org/transactions/${donation.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-xs inline-flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <ExternalLink size={12} />
                      <span className="font-mono">{donation.tx_hash.slice(0, 8)}...{donation.tx_hash.slice(-8)}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* -- Blockchain Details -- */}
        <div className="mb-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-6">Blockchain Details</h2>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#2C2416]/70 uppercase tracking-wide mb-3">Account Addresses</h3>
              <div className="space-y-2">
                {[
                  { label: 'Treasury', addr: ngo.blockchain.treasury },
                  { label: 'Issuer', addr: ngo.blockchain.issuer },
                  { label: 'Distributor', addr: ngo.blockchain.distributor },
                ].map(({ label, addr }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-sm text-[#2C2416]/60 w-24 shrink-0">{label}:</span>
                    <a
                      href={`https://testnet.xrpl.org/accounts/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-[#4A7C59] hover:underline inline-flex items-center gap-1.5 break-all"
                    >
                      {addr}
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#2C2416]/70 uppercase tracking-wide mb-3">Transaction Hashes</h3>
              <div className="space-y-2">
                {[
                  { label: 'DONO Trustline', hash: ngo.blockchain.trustline_tx_hash },
                  { label: 'Token Issuance', hash: ngo.blockchain.issuance_tx_hash },
                  { label: 'Distribution', hash: ngo.blockchain.distribution_tx_hash },
                ].map(({ label, hash }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-sm text-[#2C2416]/60 w-28 shrink-0">{label}:</span>
                    <a
                      href={`https://testnet.xrpl.org/transactions/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-[#4A7C59] hover:underline inline-flex items-center gap-1.5 break-all"
                    >
                      {hash.slice(0, 16)}...{hash.slice(-8)}
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#2C2416]/70 uppercase tracking-wide mb-3">Trustline Model</h3>
              <div className="text-sm text-[#2C2416]/70 space-y-2">
                <p>Donors establish a <span className="font-semibold text-[#2C2416]">trustline</span> to the NGO's issuer account to receive DONO receipt tokens. This is a one-time authorization per NGO.</p>
                <p>DONO tokens use currency code <span className="font-mono font-semibold text-[#4A7C59]">DONO</span> and are distinguished by issuer address — each NGO issues its own tokens.</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#2C2416]/70 uppercase tracking-wide mb-3">Base Reserve Info</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#2C2416]/[0.03] rounded-lg p-3">
                  <p className="text-xs text-[#2C2416]/50 mb-1">Account base reserve</p>
                  <p className="text-base font-bold text-[#2C2416]">1 XRP</p>
                </div>
                <div className="bg-[#2C2416]/[0.03] rounded-lg p-3">
                  <p className="text-xs text-[#2C2416]/50 mb-1">Per trustline reserve</p>
                  <p className="text-base font-bold text-[#2C2416]">0.2 XRP</p>
                </div>
              </div>
              <p className="text-xs text-[#2C2416]/50 leading-relaxed">
                Every XRPL account requires a minimum 1 XRP base reserve. Each trustline (e.g., for DONO or RLUSD) adds 0.2 XRP to the owner reserve. These reserves are not spent — they are locked to prevent ledger spam and are returned when trustlines are removed.
              </p>
            </div>
          </div>
        </div>

        {/* -- Reputation Breakdown -- */}
        <div className="mb-8">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold flex-1">Reputation Breakdown</h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full border-[3px] flex items-center justify-center"
                  style={{ borderColor: scoreColor }}
                >
                  <span className="text-lg font-bold" style={{ color: scoreColor }}>
                    {ngo.credibility_score}
                  </span>
                </div>
                <span className="text-sm text-[#2C2416]/50">Overall score</span>
              </div>
            </div>
            <ScoreBar label="Transparency" value={ngo.rating.transparency} />
            <ScoreBar label="Activity" value={ngo.rating.activity} />
            <ScoreBar label="Donor Diversity" value={ngo.rating.donor_diversity} />
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
