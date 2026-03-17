import { Link, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'

const links = [
  { label: 'Home', path: '/' },
  { label: 'My Impact', path: '/dashboard' },
  { label: 'Donate', path: '/donate' },
  { label: 'NGO Portal', path: '/ngo/1' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav
      className="glass"
      style={{
        position: 'sticky',
        top: 16,
        zIndex: 100,
        margin: '16px 24px 0',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <Leaf size={18} color="#4A7C59" strokeWidth={2.5} />
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 600, color: '#2C2416' }}>
          donos
        </span>
      </Link>

      <div style={{ display: 'flex', gap: 2 }}>
        {links.map(link => {
          const active = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path.replace('/1', '')))
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#4A7C59' : '#2C2416',
                background: active ? 'rgba(74, 124, 89, 0.1)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#2C2416',
          opacity: 0.5,
          background: 'rgba(44, 36, 22, 0.06)',
          padding: '5px 12px',
          borderRadius: 20,
        }}
      >
        r3xK...f9aB
      </div>
    </nav>
  )
}
