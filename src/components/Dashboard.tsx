import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Database, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

interface DashboardStats {
  totalRecords: number
  todayRecords: number
  syncStatus: 'synced' | 'pending' | 'error'
  lastSync: string
}

interface FieldData {
  field: string
  count: number
  value: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    todayRecords: 0,
    syncStatus: 'synced',
    lastSync: new Date().toISOString()
  })
  const [recentRecords, setRecentRecords] = useState<FieldData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Get total records
      const { count: totalRecords } = await supabase
        .from('field_records')
        .select('*', { count: 'exact', head: true })

      // Get today's records
      const today = new Date().toISOString().split('T')[0]
      const { count: todayRecords } = await supabase
        .from('field_records')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today)

      // Get recent records grouped by field
      const { data: fieldData } = await supabase
        .from('field_records')
        .select('field, value')
        .order('timestamp', { ascending: false })
        .limit(10)

      const groupedData = fieldData?.reduce((acc: Record<string, FieldData>, record) => {
        if (!acc[record.field]) {
          acc[record.field] = {
            field: record.field,
            count: 0,
            value: record.value
          }
        }
        acc[record.field].count += 1
        return acc
      }, {}) || {}

      setStats({
        totalRecords: totalRecords || 0,
        todayRecords: todayRecords || 0,
        syncStatus: 'synced',
        lastSync: new Date().toISOString()
      })

      setRecentRecords(Object.values(groupedData).slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setStats(prev => ({ ...prev, syncStatus: 'error' }))
      setLoading(false)
    }
  }

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const { data: records } = await supabase
        .from('field_records')
        .select('*')
        .order('timestamp', { ascending: false })

      if (!records) return

      let content = ''
      let filename = ''
      let mimeType = ''

      if (format === 'csv') {
        const headers = ['ID', 'Field', 'Value', 'Location', 'Timestamp']
        const csvContent = [
          headers.join(','),
          ...records.map(record => 
            [record.id, record.field, record.value, record.location, record.timestamp].join(',')
          )
        ].join('\n')
        
        content = csvContent
        filename = `field_data_${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      } else {
        content = JSON.stringify(records, null, 2)
        filename = `field_data_${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your field data collection</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportData('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportData('json')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            {stats.syncStatus === 'synced' ? (
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            ) : stats.syncStatus === 'pending' ? (
              <Clock className="h-8 w-8 text-amber-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sync Status</p>
              <p className="text-lg font-semibold capitalize text-gray-900">{stats.syncStatus}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Sync</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(stats.lastSync).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Data Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Field Data</h2>
          <div className="space-y-4">
            {recentRecords.length > 0 ? (
              recentRecords.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.field}</p>
                    <p className="text-sm text-gray-500">{item.count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No data collected yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={loadDashboardData}
              className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium text-blue-900">Refresh Data</div>
              <div className="text-sm text-blue-700">Update dashboard with latest information</div>
            </button>
            <button
              onClick={() => exportData('csv')}
              className="w-full text-left px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <div className="font-medium text-emerald-900">Generate Report</div>
              <div className="text-sm text-emerald-700">Export current data as CSV report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}