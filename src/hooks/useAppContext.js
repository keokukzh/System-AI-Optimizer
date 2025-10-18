import { useContext } from 'react'
import AppContext from '../context/AppContext'

/**
 * useAppContext - Easy access to global app state
 * Provides a clean interface to the AppContext without prop drilling
 */
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export default useAppContext
