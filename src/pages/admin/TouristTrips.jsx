import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t, getLocalizedName } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import {
  FiPlus,
  FiRefreshCw,
  FiBriefcase,
  FiUserPlus,
  FiGrid,
  FiList,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiMapPin,
  FiFileText,
} from 'react-icons/fi'

const TouristTrips = () => {
  const { language } = useLanguage()
  const [trips, setTrips] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [riders, setRiders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [tripDetail, setTripDetail] = useState(null)
  const [editingTrip, setEditingTrip] = useState(null)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [formData, setFormData] = useState({
    rider_id: '',
    driver_id: '',
    vehicle_category_id: '',
    service_id: '',
    start_date: '',
    end_date: '',
    start_location: '',
    start_latitude: '',
    start_longitude: '',
    destinations: '',
    total_amount: '',
    payment_status: 'pending',
    payment_type: 'cash',
    requires_dedicated_driver: false,
    notes: '',
    notes_ar: '',
    status: 'pending',
  })
  const [assignData, setAssignData] = useState({ driver_id: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchVehicleCategories()
    fetchRiders()
    fetchDrivers()
    fetchTrips()
  }, [])

  const fetchVehicleCategories = async () => {
    try {
      const response = await api.get('/vehicle-categories')
      if (response.data.success) {
        setVehicleCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchRiders = async () => {
    try {
      const response = await api.get('/users/user-list', { params: { userType: 'rider', per_page: 500 } })
      if (response.data.success) {
        setRiders(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/users/user-list', { params: { userType: 'driver', per_page: 500 } })
      if (response.data.success) {
        setDrivers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await api.get('/tourist-trips')
      if (response.data.success) {
        setTrips(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (trip = null) => {
    if (trip) {
      setEditingTrip(trip)
      setFormData({
        rider_id: trip.riderId || '',
        driver_id: trip.driverId || '',
        vehicle_category_id: trip.vehicleCategoryId || '',
        service_id: trip.serviceId || '',
        start_date: trip.startDate ? trip.startDate.split('T')[0] : '',
        end_date: trip.endDate ? trip.endDate.split('T')[0] : '',
        start_location: trip.startLocation || '',
        start_latitude: trip.startLatitude || '',
        start_longitude: trip.startLongitude || '',
        destinations: typeof trip.destinations === 'string' ? trip.destinations : JSON.stringify(trip.destinations || []),
        total_amount: trip.totalAmount || '',
        payment_status: trip.paymentStatus || 'pending',
        payment_type: trip.paymentType || 'cash',
        requires_dedicated_driver: trip.requiresDedicatedDriver || false,
        notes: trip.notes || '',
        notes_ar: trip.notesAr || '',
        status: trip.status || 'pending',
      })
    } else {
      setEditingTrip(null)
      setFormData({
        rider_id: '',
        driver_id: '',
        vehicle_category_id: '',
        service_id: '',
        start_date: '',
        end_date: '',
        start_location: '',
        start_latitude: '',
        start_longitude: '',
        destinations: '',
        total_amount: '',
        payment_status: 'pending',
        payment_type: 'cash',
        requires_dedicated_driver: false,
        notes: '',
        notes_ar: '',
        status: 'pending',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTrip(null)
  }

  const handleOpenDetail = (trip) => {
    setTripDetail(trip)
    setDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setTripDetail(null)
  }

  const handleAssignDriver = (trip) => {
    setSelectedTrip(trip)
    setAssignData({ driver_id: trip.driverId || '' })
    setAssignModalOpen(true)
  }

  const handleSubmitAssign = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/tourist-trips/${selectedTrip.id}/assign-driver`, assignData)
      fetchTrips()
      setAssignModalOpen(false)
      showSuccess(t('updated', language))
    } catch (error) {
      console.error('Error assigning driver:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTrip) {
        await api.put(`/tourist-trips/${editingTrip.id}`, formData)
        showSuccess(t('updated', language))
      } else {
        await api.post('/tourist-trips', formData)
        showSuccess(t('saved', language))
      }
      fetchTrips()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving trip:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/tourist-trips/${id}`)
          fetchTrips()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting trip:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleStatusChange = async (trip, newStatus) => {
    try {
      await api.put(`/tourist-trips/${trip.id}/status`, { status: newStatus })
      fetchTrips()
      showSuccess(t('updated', language))
    } catch (error) {
      console.error('Error updating status:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
      case 'completed':
        return 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200'
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
      default:
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const search = searchTerm.toLowerCase()
    const riderName = trip.rider?.displayName || trip.rider?.firstName || ''
    const driverName = trip.driver?.displayName || trip.driver?.firstName || ''
    const catName = getLocalizedName(trip.vehicleCategory, language) || ''
    const matchesSearch =
      !searchTerm ||
      riderName.toLowerCase().includes(search) ||
      driverName.toLowerCase().includes(search) ||
      catName.toLowerCase().includes(search) ||
      String(trip.id).includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = trips.length
  const pendingCount = trips.filter((t) => t.status === 'pending').length
  const completedCount = trips.filter((t) => t.status === 'completed').length
  const cancelledCount = trips.filter((t) => t.status === 'cancelled').length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الرحلات' : 'Total trips',
      value: totalCount,
      icon: FiBriefcase,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: t('pending', language),
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

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

  if (loading && trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل الرحلات السياحية...' : 'Loading tourist trips...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('touristTrips', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageTouristTrips', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTrips}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors"
          >
            <FiPlus size={20} />
            {t('addTrip', language)}
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

      {/* Info */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-sm text-blue-800 dark:text-blue-200">
        {t('touristTripsInfo', language)}
      </div>

      {/* Search + filter + view toggle */}
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
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="pending">{t('pending', language)}</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">{t('completed', language)}</option>
              <option value="cancelled">{t('cancelled', language)}</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'بطاقات' : 'Cards'}
            >
              <FiGrid size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'جدول' : 'Table'}
            >
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Trips: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBriefcase className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة الرحلات السياحية' : 'Tourist trips list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredTrips.length} {language === 'ar' ? 'رحلة' : 'trip(s)'}
          </p>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiBriefcase className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noTouristTripsFound', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm ? (t('tryAdjustingYourSearch', language) || 'Try adjusting your search') : (language === 'ar' ? 'أضف رحلة سياحية جديدة.' : 'Add a new tourist trip.')}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{trip.id}</span>
                  <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-gray-900 dark:text-white truncate">
                  {trip.rider?.displayName || trip.rider?.firstName || '-'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {trip.driver
                    ? (trip.driver.displayName || trip.driver.firstName)
                    : (language === 'ar' ? 'لم يُعيَّن سائق' : 'No driver assigned')}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {getLocalizedName(trip.vehicleCategory, language) || '-'}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-gray-400" size={16} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {trip.startDate && trip.endDate
                        ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`
                        : '-'}
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {trip.totalAmount} SAR
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(trip)}
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title={language === 'ar' ? 'عرض التفاصيل الكاملة' : 'Show full details'}
                  >
                    <FiEye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignDriver(trip)}
                    className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    title={t('assignDriver', language)}
                  >
                    <FiUserPlus size={18} />
                  </button>
                  <ActionButtons
                    onEdit={() => handleOpenModal(trip)}
                    onDelete={() => handleDelete(trip.id)}
                    showView={false}
                    showEdit={true}
                    showDelete={true}
                    forceShowIcons={true}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>ID</TableHeader>
                  <TableHeader language={language}>{t('riders', language)}</TableHeader>
                  <TableHeader language={language}>{t('drivers', language)}</TableHeader>
                  <TableHeader language={language}>{t('vehicleCategory', language)}</TableHeader>
                  <TableHeader language={language}>{t('date', language)}</TableHeader>
                  <TableHeader language={language}>{t('totalAmount', language)}</TableHeader>
                  <TableHeader language={language}>{t('paymentStatus', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {trip.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {trip.rider?.displayName || trip.rider?.firstName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trip.driver ? (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {trip.driver.displayName || trip.driver.firstName}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                          {t('notAssigned', language)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {getLocalizedName(trip.vehicleCategory, language) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {trip.startDate && trip.endDate
                        ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {trip.totalAmount} SAR
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          trip.paymentStatus === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        {trip.paymentStatus === 'paid' ? t('paid', language) : trip.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(trip)}
                          className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title={language === 'ar' ? 'عرض التفاصيل الكاملة' : 'Show full details'}
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignDriver(trip)}
                          className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                          title={t('assignDriver', language)}
                        >
                          <FiUserPlus size={18} />
                        </button>
                        <ActionButtons
                          onEdit={() => handleOpenModal(trip)}
                          onDelete={() => handleDelete(trip.id)}
                          showView={false}
                          showEdit={true}
                          showDelete={true}
                          forceShowIcons={true}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTrip ? t('editTrip', language) : t('addTrip', language)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('riders', language)}</label>
              <select
                value={formData.rider_id}
                onChange={(e) => setFormData({ ...formData, rider_id: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">{t('selectRider', language)}</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName || r.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('vehicleCategory', language)}</label>
              <select
                value={formData.vehicle_category_id}
                onChange={(e) => setFormData({ ...formData, vehicle_category_id: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">{t('selectCategory', language)}</option>
                {vehicleCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getLocalizedName(cat, language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('startDate', language)}</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('endDate', language)}</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('startLocation', language)}</label>
            <input
              type="text"
              value={formData.start_location}
              onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('totalAmount', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('paymentType', language)}</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className={inputClass}
              >
                <option value="cash">{t('cash', language)}</option>
                <option value="card">{t('card', language)}</option>
                <option value="wallet">{t('wallet', language)}</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('notesAr', language)}</label>
            <textarea
              value={formData.notes_ar}
              onChange={(e) => setFormData({ ...formData, notes_ar: e.target.value })}
              rows={2}
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
            >
              {editingTrip ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Trip full details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        title={language === 'ar' ? `تفاصيل الرحلة #${tripDetail?.id || ''}` : `Trip details #${tripDetail?.id || ''}`}
        size="lg"
      >
        {tripDetail && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </p>
                <span className={`mt-1 inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-lg ${getStatusColor(tripDetail.status)}`}>
                  {tripDetail.status}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('totalAmount', language)}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {tripDetail.totalAmount} SAR
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiUserPlus size={16} />
                  {language === 'ar' ? 'الراكب / السائق' : 'Rider & Driver'}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('riders', language)}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tripDetail.rider?.displayName || tripDetail.rider?.firstName || tripDetail.rider?.email || '-'}
                  </p>
                  {tripDetail.rider?.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tripDetail.rider.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('drivers', language)}</p>
                  {tripDetail.driver ? (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tripDetail.driver.displayName || tripDetail.driver.firstName}
                      </p>
                      {tripDetail.driver.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tripDetail.driver.email}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">{t('notAssigned', language)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('vehicleCategory', language)}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getLocalizedName(tripDetail.vehicleCategory, language) || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiCalendar size={16} />
                  {language === 'ar' ? 'التواريخ والمكان' : 'Dates & location'}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('startDate', language)}</p>
                    <p className="text-gray-900 dark:text-white">
                      {tripDetail.startDate ? new Date(tripDetail.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('endDate', language)}</p>
                    <p className="text-gray-900 dark:text-white">
                      {tripDetail.endDate ? new Date(tripDetail.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                    </p>
                  </div>
                </div>
                {tripDetail.startLocation && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiMapPin size={12} />
                      {t('startLocation', language)}
                    </p>
                    <p className="text-gray-900 dark:text-white">{tripDetail.startLocation}</p>
                  </div>
                )}
                {(() => {
                  const dest = tripDetail.destinations
                  if (!dest) return null
                  const parsed = typeof dest === 'string' ? (() => { try { return JSON.parse(dest) } catch { return dest } })() : dest
                  const list = Array.isArray(parsed) ? parsed : (typeof parsed === 'object' ? Object.values(parsed) : [String(parsed)])
                  if (!list.length) return null
                  return (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {language === 'ar' ? 'الوجهات' : 'Destinations'}
                      </p>
                      <ul className="list-disc list-inside text-gray-900 dark:text-white space-y-0.5">
                        {list.map((item, i) => (
                          <li key={i}>{typeof item === 'object' ? (item.name || item.address || JSON.stringify(item)) : String(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('paymentStatus', language)}</p>
                <span className={`mt-1 inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-lg ${
                  tripDetail.paymentStatus === 'paid'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                }`}>
                  {tripDetail.paymentStatus === 'paid' ? t('paid', language) : tripDetail.paymentStatus}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('paymentType', language)}</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white capitalize">{tripDetail.paymentType || '-'}</p>
              </div>
            </div>

            {(tripDetail.notes || tripDetail.notesAr) && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiFileText size={16} />
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {tripDetail.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes (EN)</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{tripDetail.notes}</p>
                    </div>
                  )}
                  {tripDetail.notesAr && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes (AR)</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap" dir="rtl">{tripDetail.notesAr}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                {t('close', language)}
              </button>
              <button
                type="button"
                onClick={() => { handleCloseDetail(); handleAssignDriver(tripDetail) }}
                className="px-5 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-medium inline-flex items-center gap-2"
              >
                <FiUserPlus size={18} />
                {t('assignDriver', language)}
              </button>
              <button
                type="button"
                onClick={() => { handleCloseDetail(); handleOpenModal(tripDetail) }}
                className="px-5 py-2.5 rounded-xl bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-500 font-medium"
              >
                {t('edit', language)}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={t('assignDriver', language)}
        size="sm"
      >
        <form onSubmit={handleSubmitAssign} className="space-y-5">
          {selectedTrip && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'الرحلة' : 'Trip'} #{selectedTrip.id}
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {selectedTrip.rider?.displayName || selectedTrip.rider?.firstName} — {selectedTrip.totalAmount} SAR
              </p>
            </div>
          )}
          <div>
            <label className={labelClass}>{t('drivers', language)}</label>
            <select
              value={assignData.driver_id}
              onChange={(e) => setAssignData({ driver_id: e.target.value })}
              className={inputClass}
            >
              <option value="">{t('selectDriver', language)}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.displayName || d.firstName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
            >
              {t('assignDriver', language)}
            </button>
          </div>
        </form>
      </Modal>

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

export default TouristTrips
