import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import {
  FiBarChart2,
  FiDollarSign,
  FiUsers,
  FiTruck,
  FiTrendingUp,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle
} from 'react-icons/fi'

const Reports = () => {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState('driver-report')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    rider_id: '',
    driver_id: '',
  })

  useEffect(() => {
    // Auto-load driver report on mount
    if (activeTab === 'driver-report') {
      fetchReport('driver-report')
    }
  }, [])

  const fetchReport = async (type) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.from_date) params.append('from_date', filters.from_date)
      if (filters.to_date) params.append('to_date', filters.to_date)
      if (filters.rider_id) params.append('rider_id', filters.rider_id)
      if (filters.driver_id) params.append('driver_id', filters.driver_id)

      const response = await api.get(`/reports/${type}?${params.toString()}`)
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchReport(activeTab)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setData(null)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      pending: { color: 'bg-blue-100 text-blue-800', icon: FiClock },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="mr-1" size={12} />
        {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
      </span>
    )
  }

  const renderDriverReport = () => {
    if (!data || !Array.isArray(data)) return null

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiTruck className="mr-2" />
              Driver Report
            </h2>
            <p className="text-sm text-gray-600 mt-1">Total Drivers: {data.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Online
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Rides
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((driver) => {
                  const totalRides = driver.driverRideRequests?.length || 0
                  const totalRevenue = driver.driverRideRequests?.reduce((sum, ride) => sum + (parseFloat(ride.totalAmount) || 0), 0) || 0
                  const completedRides = driver.driverRideRequests?.filter(r => r.status === 'completed').length || 0
                  
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                              {driver.firstName?.[0] || 'D'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{driver.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.contactNumber}</div>
                        <div className="text-sm text-gray-500">{driver.countryCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          driver.status === 'active' ? 'bg-green-100 text-green-800' :
                          driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {driver.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            driver.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="text-sm text-gray-900">
                            {driver.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {driver.isAvailable && (
                          <span className="text-xs text-green-600">Available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{totalRides}</div>
                        <div className="text-xs text-gray-500">{completedRides} completed</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${totalRevenue.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Details with Rides */}
        {data.map((driver) => {
          if (!driver.driverRideRequests || driver.driverRideRequests.length === 0) return null
          
          return (
            <div key={`rides-${driver.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900">
                  {driver.firstName} {driver.lastName} - Ride History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {driver.driverRideRequests.map((ride) => (
                      <tr key={ride.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{ride.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ride.datetime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {ride.startAddress}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {ride.endAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ride.distance} {ride.distanceUnit || 'km'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${parseFloat(ride.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ride.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderOtherReports = () => {
    if (!data) return null

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4">Report Data</h2>
        <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports', language)}</h1>
          <p className="text-gray-600 mt-1">View and analyze system reports</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => {
              const endpoint = activeTab === 'admin-earning' 
                ? '/reports/admin-earning/export' 
                : activeTab === 'driver-earning'
                ? '/reports/driver-earning/export'
                : null
              if (endpoint) {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                const token = localStorage.getItem('token')
                const params = new URLSearchParams()
                if (filters.from_date) params.append('from_date', filters.from_date)
                if (filters.to_date) params.append('to_date', filters.to_date)
                if (filters.rider_id) params.append('rider_id', filters.rider_id)
                if (filters.driver_id) params.append('driver_id', filters.driver_id)
                params.append('format', 'excel')
                
                window.open(`${apiUrl}${endpoint}?${params.toString()}`, '_blank')
              }
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="mr-2" />
            {t('exportReport', language) || 'Export Report'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'admin-earning', name: 'Admin Earning', icon: FiDollarSign },
              { id: 'driver-earning', name: 'Driver Earning', icon: FiTrendingUp },
              { id: 'service-wise', name: 'Service Wise', icon: FiBarChart2 },
              { id: 'driver-report', name: 'Driver Report', icon: FiUsers },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Filters */}
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <FiFilter className="mr-2 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                name="to_date"
                value={filters.to_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rider ID
              </label>
              <input
                type="text"
                name="rider_id"
                value={filters.rider_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID
              </label>
              <input
                type="text"
                name="driver_id"
                value={filters.driver_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Generate Report
          </button>
        </form>
      </div>

      {/* Report Data */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        </div>
      ) : data ? (
        activeTab === 'driver-report' ? renderDriverReport() : renderOtherReports()
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FiBarChart2 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Select a report type and click "Generate Report"</p>
        </div>
      )}
    </div>
  )
}

export default Reports
