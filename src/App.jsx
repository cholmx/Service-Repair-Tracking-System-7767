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
import PinEntryPage from './pages/PinEntryPage'

// Contexts
import { PinAuthProvider, usePinAuth } from './contexts/PinAuthContext'

// Styles
import './App.css'

const ProtectedApp = () => {
  const [printItem, setPrintItem] = useState(null)
  const { isAuthenticated, isLoading } = usePinAuth()

  const handlePrintReceipt = (item) => {
    setPrintItem(item)
  }

  const closePrintReceipt = () => {
    setPrintItem(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PinEntryPage />
  }

  return (
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

      {printItem && (
        <PrintReceipt item={printItem} onClose={closePrintReceipt} />
      )}
    </div>
  )
}

function App() {
  return (
    <PinAuthProvider>
      <Router>
        <ProtectedApp />
      </Router>
    </PinAuthProvider>
  )
}

export default App