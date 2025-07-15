import React, { useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Components
import Navbar from './components/Navbar'
import PrintReceipt from './components/PrintReceipt'

// Pages
import Dashboard from './pages/Dashboard'
import ItemIntake from './pages/ItemIntake'
import TrackingView from './pages/TrackingView'
import ItemDetails from './pages/ItemDetails'
import Settings from './pages/Settings'

// Styles
import './App.css'

function App() {
  const [printItem, setPrintItem] = useState(null)

  const handlePrintReceipt = (item) => {
    setPrintItem(item)
  }

  const closePrintReceipt = () => {
    setPrintItem(null)
  }

  return (
    <Router>
      <div className="min-h-screen bg-neutral-200">
        <Navbar />
        <motion.main className="pt-16" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard onPrintReceipt={handlePrintReceipt} />} />
            <Route path="/intake" element={<ItemIntake />} />
            <Route path="/tracking" element={<TrackingView />} />
            <Route path="/item/:id" element={<ItemDetails onPrintReceipt={handlePrintReceipt} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </motion.main>

        {/* Print Receipt Modal */}
        {printItem && (
          <PrintReceipt item={printItem} onClose={closePrintReceipt} />
        )}
      </div>
    </Router>
  )
}

export default App