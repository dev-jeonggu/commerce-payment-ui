import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import FlowVisualization from './pages/FlowVisualization'
import Playground from './pages/Playground'
import WebhookLogs from './pages/WebhookLogs'
import SecurityGuide from './pages/SecurityGuide'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flow" element={<FlowVisualization />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/webhooks" element={<WebhookLogs />} />
            <Route path="/security" element={<SecurityGuide />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
