import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Donate from './pages/Donate'
import Dashboard from './pages/Dashboard'
import NGOProfile from './pages/NGOProfile'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ padding: '24px 24px 48px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ngo/:id" element={<NGOProfile />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
