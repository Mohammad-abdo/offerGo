import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import BulkActions from '../../components/BulkActions'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import ResponsiveTable from '../../components/ResponsiveTable'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiPlus } from 'react-icons/fi'

const Riders = () => {
  const { language } = useLanguage()
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRider, setEditingRider] = useState(null)
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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [selectedRiders, setSelectedRiders] = useState([])

  useEffect(() => {
    fetchRiders()
  }, [])

  const fetchRiders = async () => {
    try {
      const response = await api.get('/users/user-list?userType=rider')
      if (response.data.success) {
        setRiders(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (rider = null) => {
    if (rider) {
      setEditingRider(rider)
      setFormData({
        firstName: rider.firstName || '',
        lastName: rider.lastName || '',
        email: rider.email || '',
        contactNumber: rider.contactNumber || '',
        password: '',
        address: '',
        status: rider.status || 'active',
      })
    } else {
      setEditingRider(null)
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
    setEditingRider(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRider) {
        const { password, ...updateData } = formData
        if (!password) {
          delete updateData.password
        }
        await api.put(`/users/${editingRider.id}`, updateData)
      } else {
        await api.post('/users', { ...formData, userType: 'rider' })
      }
      fetchRiders()
      handleCloseModal()
      showSuccess(editingRider ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving rider:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/users/${id}`)
          fetchRiders()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting rider:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/bulk-operations/riders/delete', { ids })
      fetchRiders()
    } catch (error) {
      console.error('Error bulk deleting riders:', error)
      throw error
    }
  }

  const handleBulkStatusUpdate = async (ids, status) => {
    try {
      await api.post('/bulk-operations/users/update-status', { ids, status })
      fetchRiders()
    } catch (error) {
      console.error('Error bulk updating status:', error)
      throw error
    }
  }

  const handleSelectAll = () => {
    if (selectedRiders.length === filteredRiders.length) {
      setSelectedRiders([])
    } else {
      setSelectedRiders(filteredRiders.map(r => r.id))
    }
  }

  const handleSelectRider = (id) => {
    setSelectedRiders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = !searchTerm || 
      `${rider.firstName} ${rider.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.contactNumber?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || rider.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('riders', language)}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('manageAndMonitorAllRiders', language)}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={18} />
          <span className="hidden sm:inline">{t('addRider', language)}</span>
          <span className="sm:hidden">{t('add', language) || 'Add'}</span>
        </button>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedRiders}
        onBulkDelete={handleBulkDelete}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onSelectionChange={setSelectedRiders}
        showDelete={true}
        showStatusUpdate={true}
        showExport={true}
        exportEndpoint="/users/export?userType=rider"
      />

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search', language) + '...'}
            language={language}
            className="w-full sm:flex-1"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            language={language}
            className="w-full sm:w-auto sm:min-w-[180px]"
          >
            <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
            <option value="active">{t('active', language)}</option>
            <option value="pending">{t('pending', language)}</option>
            <option value="inactive">{t('inactive', language)}</option>
          </FilterSelect>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ResponsiveTable>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <TableHeader language={language}>
                <input
                  type="checkbox"
                  checked={selectedRiders.length === filteredRiders.length && filteredRiders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                />
              </TableHeader>
              <TableHeader language={language}>{t('name', language)}</TableHeader>
              <TableHeader language={language} className="hidden md:table-cell">{t('email', language)}</TableHeader>
              <TableHeader language={language} className="hidden lg:table-cell">{t('contactNumber', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language} className="hidden sm:table-cell">{t('joined', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRiders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      <FiSearch size={40} className="sm:w-12 sm:h-12" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRiders.map((rider) => (
                <tr key={rider.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 dark:hover:from-blue-900/10 hover:to-transparent transition-colors duration-150">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRiders.includes(rider.id)}
                      onChange={() => handleSelectRider(rider.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm mr-2 sm:mr-3">
                        {(rider.firstName?.[0] || '').toUpperCase()}{(rider.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {rider.firstName || ''} {rider.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('id', language)}: {rider.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">{rider.email || '-'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden truncate">{rider.contactNumber || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{rider.email || '-'}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{rider.contactNumber || '-'}</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rider.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                          : rider.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                      }`}
                    >
                      {(() => {
                        const status = rider.status || 'pending'
                        return t(status, language) || status
                      })()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {rider.createdAt ? new Date(rider.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(rider)}
                      onDelete={() => handleDelete(rider.id)}
                      size="sm"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRider ? t('editRider', language) : t('addRider', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('firstName', language)}</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('lastName', language)}</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('email', language)}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('contactNumber', language)}</label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {!editingRider && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('password', language)}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingRider}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {editingRider && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('password', language)} ({t('optional', language)})</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('address', language)}</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">{t('active', language)}</option>
              <option value="pending">{t('pending', language)}</option>
              <option value="inactive">{t('inactive', language)}</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {editingRider ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
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

export default Riders

