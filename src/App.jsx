import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ItemIntake from './pages/ItemIntake';
import TrackingView from './pages/TrackingView';
import ItemDetails from './pages/ItemDetails';
import PrintReceipt from './components/PrintReceipt';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [printItem, setPrintItem] = useState(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('repairItems');
    const savedArchived = localStorage.getItem('archivedItems');
    
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    
    if (savedArchived) {
      setArchivedItems(JSON.parse(savedArchived));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('repairItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('archivedItems', JSON.stringify(archivedItems));
  }, [archivedItems]);

  const addItem = (formData) => {
    // Create separate entries for each item type
    const newItems = formData.items.map((item, itemIndex) => ({
      id: `${Date.now()}-${itemIndex}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      company: formData.company,
      itemType: item.itemType,
      quantity: item.quantity,
      description: item.description,
      urgency: formData.urgency,
      expectedCompletion: formData.expectedCompletion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          timestamp: new Date().toISOString(),
          notes: `${item.quantity} x ${item.itemType} received and logged into system`
        }
      ]
    }));

    setItems(prev => [...newItems, ...prev]);
  };

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        if (updates.status && updates.status !== item.status) {
          updatedItem.statusHistory = [
            ...item.statusHistory,
            {
              status: updates.status,
              timestamp: new Date().toISOString(),
              notes: updates.statusNotes || `Status changed to ${updates.status}`
            }
          ];
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const archiveItem = (id) => {
    const itemToArchive = items.find(item => item.id === id);
    if (itemToArchive) {
      // Add archived timestamp
      const archivedItem = {
        ...itemToArchive,
        archivedAt: new Date().toISOString(),
        statusHistory: [
          ...itemToArchive.statusHistory,
          {
            status: 'archived',
            timestamp: new Date().toISOString(),
            notes: 'Service order archived'
          }
        ]
      };

      setArchivedItems(prev => [archivedItem, ...prev]);
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handlePrintReceipt = (item) => {
    setPrintItem(item);
  };

  const closePrintReceipt = () => {
    setPrintItem(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-neutral-200">
        <Navbar />
        <motion.main
          className="pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={<Dashboard items={items} onPrintReceipt={handlePrintReceipt} />} 
            />
            <Route 
              path="/intake" 
              element={<ItemIntake onAddItem={addItem} />} 
            />
            <Route 
              path="/tracking" 
              element={
                <TrackingView 
                  items={items} 
                  archivedItems={archivedItems} 
                  onArchiveItem={archiveItem} 
                />
              } 
            />
            <Route 
              path="/item/:id" 
              element={
                <ItemDetails 
                  items={[...items, ...archivedItems]} 
                  onUpdateItem={updateItem}
                  onPrintReceipt={handlePrintReceipt}
                />
              } 
            />
          </Routes>
        </motion.main>

        {/* Print Receipt Modal */}
        {printItem && (
          <PrintReceipt 
            item={printItem} 
            onClose={closePrintReceipt} 
          />
        )}
      </div>
    </Router>
  );
}

export default App;