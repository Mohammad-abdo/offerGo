import { useState, useEffect } from 'react'
import api from '../../utils/api'

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/get-setting')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
        {settings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Name
              </label>
              <input
                type="text"
                value={settings.appName || 'Tovo'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={settings.currency || 'USD'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance Unit
              </label>
              <input
                type="text"
                value={settings.distanceUnit || 'km'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No settings found</p>
        )}
      </div>
    </div>
  )
}

export default Settings

