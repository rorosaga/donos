import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'

const Landing = lazy(() => import('./pages/Landing'))
const Connect = lazy(() => import('./pages/Connect'))
const AppView = lazy(() => import('./pages/AppView'))
const Donate = lazy(() => import('./pages/Donate'))
const NGOProfile = lazy(() => import('./pages/NGOProfile'))
const Profile = lazy(() => import('./pages/Profile'))
const Initiative = lazy(() => import('./pages/Initiative'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-[#8a7a6a]">Loading...</div>
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/connect" element={<Connect />} />

            {/* Authenticated */}
            <Route path="/app" element={<AppView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/ngo/:id" element={<NGOProfile />} />
            <Route path="/initiative/:id" element={<Initiative />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
