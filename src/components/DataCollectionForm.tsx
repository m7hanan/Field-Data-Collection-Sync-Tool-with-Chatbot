import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Calendar, Save, AlertCircle } from 'lucide-react'

interface FormData {
  field: string
  value: string
  location: string
}

interface FormErrors {
  field?: string
  value?: string
  location?: string
}

export function DataCollectionForm() {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    field: '',
    value: '',
    location: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.field.trim()) {
      newErrors.field = 'Field name is required'
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Value is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
          setFormData(prev => ({
            ...prev,
            location: 'Location unavailable'
          }))
        }
      )
    } else {
      console.error('Geolocation is not supported by this browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!user) return

    setLoading(true)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from('field_records')
        .insert([
          {
            field: formData.field.trim(),
            value: formData.value.trim(),
            location: formData.location.trim(),
            user_id: user.id,
            timestamp: new Date().toISOString()
          }
        ])

      if (error) throw error

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: user.id,
            action: 'DATA_ENTRY',
            details: `Added field record: ${formData.field} = ${formData.value}`,
            timestamp: new Date().toISOString()
          }
        ])

      setSuccess(true)
      setFormData({ field: '', value: '', location: '' })
      setErrors({})

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving record:', error)
      setErrors({ field: 'Failed to save record. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Data Collection Form</h2>
          <p className="text-gray-600 mt-1">Enter field measurements and observations</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-emerald-800">
                    Record saved successfully!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Field Name */}
          <div>
            <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-2">
              Field Name *
            </label>
            <input
              type="text"
              id="field"
              value={formData.field}
              onChange={(e) => handleInputChange('field', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.field ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Temperature, Humidity, Soil pH"
            />
            {errors.field && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.field}
              </p>
            )}
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            <input
              type="text"
              id="value"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.value ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 25.5°C, 60%, 7.2"
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.value}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Field A, GPS coordinates, or address"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Get current location"
              >
                <MapPin className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Timestamp Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timestamp
            </label>
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-700">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}