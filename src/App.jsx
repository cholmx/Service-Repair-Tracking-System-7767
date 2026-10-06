import React, { Suspense, lazy, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Components
import Navbar from './components/Navbar'
import LoadingSkeleton from './components/LoadingSkeleton'

// Pages and the receipt are loaded when first needed so the first screen downloads less code.
const PrintReceipt = lazy(() => import('./components/PrintReceipt'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ItemIntake = lazy(() => import('./pages/ItemIntake'))
const TrackingView = lazy(() => import('./pages/TrackingView'))
const ItemDetails = lazy(() => import('./pages/ItemDetails'))
const Settings = lazy(() => import('./pages/Settings'))
const PinEntryPage = lazy(() => import('./pages/PinEntryPage'))

// Contexts
import { PinAuthProvider, usePinAuth } from './contexts/PinAuthContext'
import { ServiceOrdersProvider } from './contexts/ServiceOrdersContext'

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
    return (
      <Suspense fallback={null}>
        <PinEntryPage />
      </Suspense>
    )
  }

  return (
    <ServiceOrdersProvider>
      <div className="min-h-screen bg-neutral-200">
        <Navbar />
        <motion.main className="pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<LoadingSkeleton type="default" />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onPrintReceipt={handlePrintReceipt} />} />
              <Route path="/intake" element={<ItemIntake />} />
              <Route path="/tracking" element={<TrackingView />} />
              <Route path="/item/:id" element={<ItemDetails onPrintReceipt={handlePrintReceipt} />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </motion.main>

        {printItem && (
          <Suspense fallback={null}>
            <PrintReceipt item={printItem} onClose={closePrintReceipt} />
          </Suspense>
        )}
      </div>
    </ServiceOrdersProvider>
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