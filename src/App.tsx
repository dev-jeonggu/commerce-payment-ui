import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DocsHome from './pages/DocsHome'
import Tutorial from './pages/Tutorial'
import GuideRouter, { Quickstart, Reference } from './pages/Guides'
import Playground from './pages/Playground'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="pt-16">
          <Routes>
            <Route path="/"               element={<DocsHome />} />
            <Route path="/quickstart"     element={<Quickstart />} />
            <Route path="/tutorial"       element={<Tutorial />} />
            <Route path="/guide/:guide"   element={<GuideRouter />} />
            <Route path="/reference"      element={<Reference />} />
            <Route path="/sandbox"        element={<Playground />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
