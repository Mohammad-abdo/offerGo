import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
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
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi'
import { exportToCSV } from '../../utils/exportUtils'

const Reports = () => {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState('driver-report')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    rider_id: '',
    driver_id: '',
  })

  const fetchReport = async (type) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.from_date) params.append('from_date', filters.from_date)
      if (filters.to_date) params.append('to_date', filters.to_date)
      if (filters.rider_id) params.append('rider_id', filters.rider_id)
      if (filters.driver_id) params.append('driver_id', filters.driver_id)

      const response = await api.get(`/reports/${type}?${params.toString()}`)
      if (response.data.success) {
        setData(response.data.data)
      } else {
        setData(null)
        showError(response.data?.message || t('failed', language))
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setData(null)
      const msg = err.response?.data?.message || err.message || t('failed', language)
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport(activeTab)
  }, [activeTab])

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchReport(activeTab)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setData(null)
    setError(null)
  }

  const handleExport = async () => {
    const exportEndpoints = ['admin-earning', 'driver-earning']
    if (exportEndpoints.includes(activeTab)) {
      setExporting(true)
      try {
        const params = new URLSearchParams()
        if (filters.from_date) params.append('from_date', filters.from_date)
        if (filters.to_date) params.append('to_date', filters.to_date)
        if (filters.rider_id) params.append('rider_id', filters.rider_id)
        if (filters.driver_id) params.append('driver_id', filters.driver_id)
        params.append('format', 'excel')

        const response = await api.get(`/reports/${activeTab}/export?${params.toString()}`, {
          responseType: 'blob',
        })
        const disposition = response.headers['content-disposition']
        const filenameMatch = disposition && disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : `report-${activeTab}-${Date.now()}.xlsx`
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        showSuccess(t('exportReport', language) || 'Export started')
      } catch (err) {
        showError(err.response?.data?.message || err.message || t('failed', language))
      } finally {
        setExporting(false)
      }
    } else if (activeTab === 'driver-report' && data && Array.isArray(data)) {
      const headers = [
        { key: 'driver', label: t('driver', language) },
        { key: 'email', label: t('email', language) },
        { key: 'contact', label: t('contact', language) },
        { key: 'status', label: t('status', language) },
        { key: 'totalRides', label: t('totalRides', language) },
        { key: 'totalRevenue', label: t('totalRevenue', language) },
      ]
      const exportData = data.map((d) => {
        const totalRides = d.driverRideRequests?.length || 0
        const totalRevenue = d.driverRideRequests?.reduce((s, r) => s + (parseFloat(r.totalAmount) || 0), 0) || 0
        return {
          driver: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
          email: d.email || '',
          contact: `${d.countryCode || ''} ${d.contactNumber || ''}`.trim(),
          status: d.status || '',
          totalRides,
          totalRevenue: totalRevenue.toFixed(2),
        }
      })
      exportToCSV(exportData, headers, `driver-report-${Date.now()}`)
      showSuccess(t('exportReport', language) || 'Export started')
    } else if (activeTab === 'service-wise' && data?.serviceStats) {
      const headers = [
        { key: 'serviceName', label: language === 'ar' ? 'الخدمة' : 'Service' },
        { key: 'totalRides', label: t('totalRides', language) },
        { key: 'totalAmount', label: t('totalRevenue', language) },
      ]
      exportToCSV(data.serviceStats, headers, `service-wise-${Date.now()}`)
      showSuccess(t('exportReport', language) || 'Export started')
    } else {
      showError(language === 'ar' ? 'لا يوجد بيانات للتصدير' : 'No data to export')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200', icon: FiCheckCircle },
      in_progress: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200', icon: FiClock },
      pending: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200', icon: FiClock },
      cancelled: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200', icon: FiXCircle },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="mr-1" size={12} />
        {status === 'completed' ? t('completed', language) : status === 'in_progress' ? t('inProgress', language) : status === 'pending' ? t('pending', language) : status === 'cancelled' ? t('cancelled', language) : status || ''}
      </span>
    )
  }

  const renderDriverReport = () => {
    if (!data || !Array.isArray(data)) return null

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiTruck className="mr-2 text-orange-500" />
              {t('driverReport', language)}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('totalDrivers', language)}: {data.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('driver', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contact', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('online', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('totalRides', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('totalRevenue', language)}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((driver) => {
                  const totalRides = driver.driverRideRequests?.length || 0
                  const totalRevenue = driver.driverRideRequests?.reduce((sum, ride) => sum + (parseFloat(ride.totalAmount) || 0), 0) || 0
                  const completedRides = driver.driverRideRequests?.filter((r) => r.status === 'completed').length || 0
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                            {driver.firstName?.[0] || 'D'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{driver.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {driver.countryCode} {driver.contactNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${driver.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : driver.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                          {driver.status === 'active' ? t('active', language) : driver.status === 'pending' ? t('pending', language) : t('inactive', language)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`w-2 h-2 rounded-full inline-block mr-1 ${driver.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-900 dark:text-white">{driver.isOnline ? t('online', language) : t('offline', language)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {totalRides} <span className="text-gray-500 dark:text-gray-400">({completedRides} {t('completed', language)})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ${totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {data.some((d) => d.driverRideRequests?.length) ? (
          data.map((driver) => {
            if (!driver.driverRideRequests?.length) return null
            return (
              <div key={`rides-${driver.id}`} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    {driver.firstName} {driver.lastName} – {t('rideHistory', language)}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('rideId', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('date', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('from', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('to', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('distance', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('amount', language)}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status', language)}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {driver.driverRideRequests.map((ride) => (
                        <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{ride.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(ride.datetime || ride.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{ride.startAddress || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{ride.endAddress || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {ride.distance != null ? `${ride.distance} ${ride.distanceUnit || 'km'}` : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                            ${parseFloat(ride.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ride.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        ) : null}
      </div>
    )
  }

  const renderAdminEarning = () => {
    if (!data || !data.rideRequests) return null
    const { rideRequests, totals } = data
    const list = Array.isArray(rideRequests) ? rideRequests : []

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-6">
          <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">{language === 'ar' ? 'الإجمالي' : 'Totals'}</h3>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
            ${(totals?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{list.length} {language === 'ar' ? 'رحلة' : 'rides'}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminEarning', language)} – {t('rideId', language)}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('rideId', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('date', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('rider', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('driver', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('amount', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status', language)}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {list.map((ride) => {
                  const amount = ride.payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) ?? (parseFloat(ride.totalAmount) || 0)
                  return (
                    <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{ride.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(ride.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ride.rider ? `${ride.rider.firstName || ''} ${ride.rider.lastName || ''}`.trim() : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ride.driver ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ride.status)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderDriverEarning = () => {
    if (!data || !data.rideRequests) return null
    const { rideRequests, totals } = data
    const list = Array.isArray(rideRequests) ? rideRequests : []

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">{language === 'ar' ? 'الإجمالي' : 'Totals'}</h3>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
            ${(totals?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{list.length} {language === 'ar' ? 'رحلة' : 'rides'}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('driverEarning', language)} – {t('rideId', language)}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('rideId', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('date', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('driver', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('from', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('to', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('amount', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status', language)}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {list.map((ride) => {
                  const amount = ride.payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) ?? (parseFloat(ride.totalAmount) || 0)
                  return (
                    <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{ride.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(ride.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ride.driver ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{ride.startAddress || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{ride.endAddress || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ride.status)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderServiceWise = () => {
    if (!data) return null
    const stats = data.serviceStats ? (Array.isArray(data.serviceStats) ? data.serviceStats : Object.values(data.serviceStats)) : []
    const rideRequests = data.rideRequests && Array.isArray(data.rideRequests) ? data.rideRequests : []

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('serviceWise', language)} – {language === 'ar' ? 'ملخص' : 'Summary'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('totalRides', language)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('totalRevenue', language)}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row.serviceName || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.totalRides ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">${(row.totalAmount ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {rideRequests.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'تفاصيل الرحلات' : 'Ride details'}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('date', language)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('amount', language)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status', language)}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rideRequests.slice(0, 100).map((ride) => {
                    const amount = ride.payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) ?? (parseFloat(ride.totalAmount) || 0)
                    return (
                      <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{ride.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(ride.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ride.service?.name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">${amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ride.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {rideRequests.length > 100 && (
                <p className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'عرض أول 100 رحلة فقط' : 'Showing first 100 rides only'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderReportContent = () => {
    if (activeTab === 'driver-report') return renderDriverReport()
    if (activeTab === 'admin-earning') return renderAdminEarning()
    if (activeTab === 'driver-earning') return renderDriverEarning()
    if (activeTab === 'service-wise') return renderServiceWise()
    return null
  }

  const hasData = data != null && (activeTab === 'driver-report' ? Array.isArray(data) && data.length >= 0 : true)
  const isEmpty = data != null && (activeTab === 'driver-report' ? (Array.isArray(data) && data.length === 0) : (activeTab === 'service-wise' ? !data?.serviceStats?.length && !data?.rideRequests?.length : !data?.rideRequests?.length && !data?.totals))

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('reports', language)}</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">{t('viewAndAnalyzeSystemReports', language)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReport(activeTab)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !hasData}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload size={18} className={exporting ? 'animate-pulse' : ''} />
            {exporting ? (language === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (t('exportReport', language) || 'Export Report')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <nav className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'admin-earning', name: t('adminEarning', language), icon: FiDollarSign },
            { id: 'driver-earning', name: t('driverEarning', language), icon: FiTrendingUp },
            { id: 'service-wise', name: t('serviceWise', language), icon: FiBarChart2 },
            { id: 'driver-report', name: t('driverReport', language), icon: FiUsers },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            )
          })}
        </nav>

        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-500 dark:text-gray-400" size={18} />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('filters', language)}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline mr-1" size={14} />
                {t('fromDate', language)}
              </label>
              <input
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline mr-1" size={14} />
                {t('toDate', language)}
              </label>
              <input
                type="date"
                name="to_date"
                value={filters.to_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('riderId', language)}</label>
              <input
                type="text"
                name="rider_id"
                value={filters.rider_id}
                onChange={handleFilterChange}
                placeholder={t('optional', language)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('driverId', language)}</label>
              <input
                type="text"
                name="driver_id"
                value={filters.driver_id}
                onChange={handleFilterChange}
                placeholder={t('optional', language)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : t('generateReport', language)}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{t('loadingReportData', language)}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
          <FiXCircle className="mx-auto text-red-500 dark:text-red-400 mb-4" size={48} />
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchReport(activeTab)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : hasData && !isEmpty ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden p-6">
          {renderReportContent()}
        </div>
      ) : hasData && isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <FiBarChart2 className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">{language === 'ar' ? 'لا توجد بيانات في النطاق المحدد.' : 'No data in the selected range.'}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <FiBarChart2 className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('selectReportTypeAndGenerate', language)}</p>
        </div>
      )}
    </div>
  )
}

export default Reports
