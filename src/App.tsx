import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { AuthForm } from './components/AuthForm'
import { Dashboard } from './components/Dashboard'
import { DataCollectionForm } from './components/DataCollectionForm'
import { RecordsView } from './components/RecordsView'
import { Chatbot } from './components/Chatbot'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'collection':
        return <DataCollectionForm />
      case 'records':
        return <RecordsView />
      case 'chatbot':
        return <Chatbot />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App