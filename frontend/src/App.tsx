import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Donate from './pages/Donate'
import Dashboard from './pages/Dashboard'
import NGOProfile from './pages/NGOProfile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ngo/:id" element={<NGOProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
