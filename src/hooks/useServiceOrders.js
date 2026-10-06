import { useContext } from 'react'
import { ServiceOrdersContext } from '../contexts/ServiceOrdersContext'

export const useServiceOrders = () => {
  const context = useContext(ServiceOrdersContext)
  if (!context) {
    throw new Error('useServiceOrders must be used within ServiceOrdersProvider')
  }
  return context
}
