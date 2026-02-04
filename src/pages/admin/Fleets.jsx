import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import {
  FiPlus,
  FiRefreshCw,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiGrid,
  FiList,
  FiUsers,
} from 'react-icons/fi'

const Fleets = () => {
  const { language } = useLanguage()
  const [fleets, setFleets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editingFleet, setEditingFleet] = useState(null)
  const [selectedFleet, setSelectedFleet] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    address: '',
    status: 'active',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchFleets()
  }, [])

  const fetchFleets = async () => {
    try {
      setLoading(true)
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await api.get('/fleets', { params: { ...params, per_page: 500 } })
      if (response.data.success) {
        setFleets(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching fleets:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (fleet = null) => {
    if (fleet) {
      setEditingFleet(fleet)
      setFormData({
        firstName: fleet.firstName || '',
        lastName: fleet.lastName || '',
        email: fleet.email || '',
        contactNumber: fleet.contactNumber || '',
        password: '',
        address: fleet.address || '',
        status: fleet.status || 'active',
      })
    } else {
      setEditingFleet(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        address: '',
        status: 'active',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFleet(null)
  }

  const handleViewDetails = async (fleet) => {
    setSelectedFleet(fleet)
    setViewModalOpen(true)
    try {
      const res = await api.get(`/fleets/${fleet.id}`)
      if (res.data.success && res.data.data) setSelectedFleet(res.data.data)
    } catch (_) {}
  }

  const handleCloseViewModal = () => {
    setViewModalOpen(false)
    setSelectedFleet(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingFleet) {
        const { password, ...updateData } = formData
        if (!password) delete updateData.password
        await api.put(`/fleets/${editingFleet.id}`, updateData)
        showSuccess(t('updated', language))
      } else {
        await api.post('/fleets', formData)
        showSuccess(t('saved', language))
      }
      fetchFleets()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving fleet:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/fleets/${id}`)
          fetchFleets()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting fleet:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  if (loading && fleets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  const filteredFleets = fleets.filter((fleet) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      `${fleet.firstName || ''} ${fleet.lastName || ''}`.toLowerCase().includes(search) ||
      fleet.email?.toLowerCase().includes(search) ||
      fleet.contactNumber?.includes(searchTerm) ||
      fleet.displayName?.toLowerCase().includes(search)
    const matchesStatus = statusFilter === 'all' || fleet.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = fleets.length
  const activeCount = fleets.filter((f) => f.status === 'active').length
  const pendingCount = fleets.filter((f) => f.status === 'pending').length
  const inactiveCount = fleets.filter((f) => f.status === 'inactive').length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي الأساطيل' : 'Total fleets', value: totalCount, icon: FiTruck, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('pending', language), value: pendingCount, icon: FiClock, bgLight: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800' },
  ]

  const fleetTableRows = filteredFleets.map((fleet) => (
    <tr
      key={fleet.id}
      className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
            {(fleet.firstName?.[0] || 'F').toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {fleet.firstName || ''} {fleet.lastName || ''}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {fleet.displayName || t('individualFleet', language)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <div className="text-sm text-gray-900 dark:text-gray-200">{fleet.email || '-'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{fleet.contactNumber || '-'}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700">
          {fleet.drivers?.length || 0} {t('driversCount', language)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
            fleet.status === 'active'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
              : fleet.status === 'pending'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
          }`}
        >
          {t(fleet.status || 'pending', language) || fleet.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ActionButtons
          onView={() => handleViewDetails(fleet)}
          onEdit={() => handleOpenModal(fleet)}
          onDelete={() => handleDelete(fleet.id)}
          showView={true}
          showEdit={true}
          showDelete={true}
          forceShowIcons={true}
        />
      </td>
    </tr>
  ))

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('fleets', language)}</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">{t('manageAndMonitorAllFleets', language)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchFleets()} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:-translate-y-0.5">
            <FiPlus size={18} />
            {t('addFleet', language)}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.borderColor} overflow-hidden shadow-sm ${stat.bgLight}`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</span>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search, Filter + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search', language) + '...'} language={language} />
            </div>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="active">{t('active', language)}</option>
              <option value="pending">{t('pending', language)}</option>
              <option value="inactive">{t('inactive', language)}</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button type="button" onClick={() => setViewMode('cards')} className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'بطاقات' : 'Cards'}><FiGrid size={20} /></button>
            <button type="button" onClick={() => setViewMode('table')} className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'جدول' : 'Table'}><FiList size={20} /></button>
          </div>
        </div>
      </div>

      {/* Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {filteredFleets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiTruck className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noFleetsFound', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">{searchTerm ? t('tryAdjustingYourSearch', language) : (language === 'ar' ? 'لا توجد أساطيل حتى الآن.' : 'No fleets yet.')}</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFleets.map((fleet) => (
              <div key={fleet.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
                      {(fleet.firstName?.[0] || 'F').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{fleet.firstName || ''} {fleet.lastName || ''}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{fleet.displayName || t('individualFleet', language)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${fleet.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : fleet.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
                    {t(fleet.status || 'pending', language) || fleet.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FiUsers size={16} className="shrink-0" />
                  <span>{fleet.drivers?.length || 0} {t('driversCount', language)}</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons onView={() => handleViewDetails(fleet)} onEdit={() => handleOpenModal(fleet)} onDelete={() => handleDelete(fleet.id)} showView={true} showEdit={true} showDelete={true} forceShowIcons={true} />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <TableHeader language={language}>{t('name', language)}</TableHeader>
              <TableHeader language={language}>{t('contact', language)}</TableHeader>
              <TableHeader language={language}>{t('driversCount', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {fleetTableRows}
          </tbody>
        </table>
        </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFleet ? t('editFleet', language) : t('addFleet', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('firstName', language)}
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('lastName', language)}
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email', language)}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('contactNumber', language)}
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          {!editingFleet && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('password', language)}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingFleet}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
          {editingFleet && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('password', language)} ({t('optional', language)})
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('address', language)}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('status', language)}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="active">{t('active', language)}</option>
              <option value="pending">{t('pending', language)}</option>
              <option value="inactive">{t('inactive', language)}</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
              {editingFleet ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        title={t('fleetDetails', language)}
        size="lg"
      >
        {selectedFleet && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                  {(selectedFleet.firstName?.[0] || 'F').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFleet.firstName} {selectedFleet.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFleet.displayName || t('individualFleet', language)}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  selectedFleet.status === 'active'
                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
                    : selectedFleet.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
                    : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
                }`}
              >
                {t(selectedFleet.status, language)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">
                  {t('name', language)} / {t('contact', language)}
                </h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">{t('email', language)}</dt>
                    <dd className="text-gray-900 dark:text-white">{selectedFleet.email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">{t('contactNumber', language)}</dt>
                    <dd className="text-gray-900 dark:text-white">{selectedFleet.contactNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">{t('address', language)}</dt>
                    <dd className="text-gray-900 dark:text-white">{selectedFleet.address || '-'}</dd>
                  </div>
                </dl>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">
                  {t('driversCount', language)}
                </h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {selectedFleet.drivers?.length || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('totalDrivers', language)}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                {t('close', language)}
              </button>
            </div>
          </div>
        )}
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

export default Fleets
