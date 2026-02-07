import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import BulkActions from '../../components/BulkActions'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import {
  FiRefreshCw,
  FiList,
  FiGrid,
  FiSearch,
  FiNavigation,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi'

const RideRequests = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [rideRequests, setRideRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRides, setSelectedRides] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchRideRequests()
  }, [])

  const fetchRideRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/ride-requests/riderequest-list')
      if (response.data.success) {
        setRideRequests(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/bulk-operations/ride-requests/delete', { ids })
      fetchRideRequests()
      setSelectedRides([])
      showSuccess(t('deleted', language))
    } catch (error) {
      console.error('Error bulk deleting ride requests:', error)
      showError(error.response?.data?.message || t('failed', language))
      throw error
    }
  }

  const handleSelectAll = () => {
    if (selectedRides.length === filteredRides.length) {
      setSelectedRides([])
    } else {
      setSelectedRides(filteredRides.map((r) => r.id))
    }
  }

  const handleSelectRide = (id) => {
    setSelectedRides((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
      accepted: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700',
      in_progress: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'pending',
      accepted: 'accepted',
      in_progress: 'inProgress',
      completed: 'completed',
      cancelled: 'cancelled',
    }
    return t(statusMap[status] || status, language) || status
  }

  const filteredRides = rideRequests.filter((ride) => {
    const matchesSearch =
      !searchTerm ||
      ride.startAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.endAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${ride.rider?.firstName || ''} ${ride.rider?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading && rideRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  const totalCount = rideRequests.length
  const pendingCount = rideRequests.filter(
    (r) => r.status === 'pending' || r.status === 'accepted' || r.status === 'in_progress'
  ).length
  const completedCount = rideRequests.filter((r) => r.status === 'completed').length
  const cancelledCount = rideRequests.filter((r) => r.status === 'cancelled').length
  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الطلبات' : 'Total requests',
      value: totalCount,
      icon: FiNavigation,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'قيد الانتظار / قيد التنفيذ' : 'Pending / In progress',
      value: pendingCount,
      icon: FiClock,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: t('completed', language),
      value: completedCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: t('cancelled', language),
      value: cancelledCount,
      icon: FiXCircle,
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  ]

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('rideRequests', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageAndMonitorAllRideRequests', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRideRequests()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border ${stat.borderColor} overflow-hidden shadow-sm ${stat.bgLight}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedRides}
        onBulkDelete={handleBulkDelete}
        onSelectionChange={setSelectedRides}
        showDelete={true}
        showStatusUpdate={false}
        showExport={true}
        exportEndpoint="/ride-requests/export"
      />

      {/* Search, Filter + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search', language) + '...'}
                language={language}
              />
            </div>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              language={language}
            >
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="pending">{t('pending', language)}</option>
              <option value="accepted">{t('accepted', language) || 'Accepted'}</option>
              <option value="in_progress">{t('inProgress', language)}</option>
              <option value="completed">{t('completed', language)}</option>
              <option value="cancelled">{t('cancelled', language)}</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={language === 'ar' ? 'بطاقات' : 'Cards'}
            >
              <FiGrid size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={language === 'ar' ? 'جدول' : 'Table'}
            >
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {filteredRides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiSearch className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noData', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm ? t('tryAdjustingYourSearch', language) : (language === 'ar' ? 'لا توجد طلبات رحلات حتى الآن.' : 'No ride requests yet.')}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRides.map((ride) => (
              <div
                key={ride.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      #{ride.id} · {(ride.totalAmount || 0).toFixed(2)} $
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      ride.status || 'pending'
                    )}`}
                  >
                    {getStatusLabel(ride.status || 'pending')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{t('rider', language)}:</span>
                    <span className="text-gray-900 dark:text-white truncate">
                      {ride.rider ? `${ride.rider.firstName || ''} ${ride.rider.lastName || ''}`.trim() || '—' : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{t('driver', language)}:</span>
                    <span className="text-gray-900 dark:text-white truncate">
                      {ride.driver ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || '—' : '—'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{t('from', language)}:</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{ride.startAddress || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{t('to', language)}:</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{ride.endAddress || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-green-600 dark:text-green-400 shrink-0" size={16} />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${(ride.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons
                    onView={() => navigate(`/ride-requests/${ride.id}`)}
                    showView={true}
                    showEdit={false}
                    showDelete={false}
                    forceShowIcons={true}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <TableHeader language={language}>
                    <input
                      type="checkbox"
                      checked={selectedRides.length === filteredRides.length && filteredRides.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                    />
                  </TableHeader>
                  <TableHeader language={language}>{t('rider', language)}</TableHeader>
                  <TableHeader language={language}>{t('driver', language)}</TableHeader>
                  <TableHeader language={language}>{t('from', language)}</TableHeader>
                  <TableHeader language={language}>{t('to', language)}</TableHeader>
                  <TableHeader language={language}>{t('amount', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('date', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRides.map((ride) => (
                  <tr
                    key={ride.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRides.includes(ride.id)}
                        onChange={() => handleSelectRide(ride.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {ride.rider ? `${ride.rider.firstName || ''} ${ride.rider.lastName || ''}`.trim() || '—' : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {ride.driver ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || '—' : '—'}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {ride.startAddress || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {ride.endAddress || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      ${(ride.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusColor(
                          ride.status || 'pending'
                        )}`}
                      >
                        {getStatusLabel(ride.status || 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons
                        onView={() => navigate(`/ride-requests/${ride.id}`)}
                        showView={true}
                        showEdit={false}
                        showDelete={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  )
}

export default RideRequests
