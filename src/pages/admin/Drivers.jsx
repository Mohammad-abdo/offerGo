import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import BulkActions from '../../components/BulkActions'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiPlus } from 'react-icons/fi'

const Drivers = () => {
  const { language } = useLanguage()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
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
  const [selectedDrivers, setSelectedDrivers] = useState([])

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/users/user-list?userType=driver')
      if (response.data.success) {
        setDrivers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver)
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        email: driver.email || '',
        contactNumber: driver.contactNumber || '',
        password: '',
        address: '',
        status: driver.status || 'active',
      })
    } else {
      setEditingDriver(null)
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
    setEditingDriver(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingDriver) {
        const { password, ...updateData } = formData
        if (!password) {
          delete updateData.password
        }
        await api.put(`/users/${editingDriver.id}`, updateData)
      } else {
        await api.post('/users', { ...formData, userType: 'driver' })
      }
      fetchDrivers()
      handleCloseModal()
      showSuccess(editingDriver ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving driver:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/users/${id}`)
          fetchDrivers()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting driver:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/bulk-operations/drivers/delete', { ids })
      fetchDrivers()
    } catch (error) {
      console.error('Error bulk deleting drivers:', error)
      throw error
    }
  }

  const handleBulkStatusUpdate = async (ids, status) => {
    try {
      await api.post('/bulk-operations/users/update-status', { ids, status })
      fetchDrivers()
    } catch (error) {
      console.error('Error bulk updating status:', error)
      throw error
    }
  }

  const handleSelectAll = () => {
    if (selectedDrivers.length === filteredDrivers.length) {
      setSelectedDrivers([])
    } else {
      setSelectedDrivers(filteredDrivers.map(d => d.id))
    }
  }

  const handleSelectDriver = (id) => {
    setSelectedDrivers(prev => 
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

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = !searchTerm || 
      `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.contactNumber?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('drivers', language)}</h1>
          <p className="text-gray-600 mt-1">{t('manageAndMonitorAllDrivers', language)}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={20} />
          {t('addDriver', language)}
        </button>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDrivers}
        onBulkDelete={handleBulkDelete}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onSelectionChange={setSelectedDrivers}
        showDelete={true}
        showStatusUpdate={true}
        showExport={true}
        exportEndpoint="/users/export?userType=driver"
      />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search', language) + '...'}
            language={language}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            language={language}
          >
            <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
            <option value="active">{t('active', language)}</option>
            <option value="pending">{t('pending', language)}</option>
            <option value="inactive">{t('inactive', language)}</option>
          </FilterSelect>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>
                <input
                  type="checkbox"
                  checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHeader>
              <TableHeader>{t('name', language)}</TableHeader>
              <TableHeader>{t('email', language)}</TableHeader>
              <TableHeader>{t('contactNumber', language)}</TableHeader>
              <TableHeader>{t('status', language)}</TableHeader>
              <TableHeader>{t('online', language)}</TableHeader>
              <TableHeader>{t('available', language)}</TableHeader>
              <TableHeader>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiSearch size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver.id)}
                      onChange={() => handleSelectDriver(driver.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {(driver.firstName?.[0] || '').toUpperCase()}{(driver.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {driver.firstName || ''} {driver.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500">{t('id', language)}: {driver.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{driver.contactNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        driver.status === 'active'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : driver.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {(() => {
                        const status = driver.status || 'pending'
                        return t(status, language) || status
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        driver.isOnline
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {driver.isOnline ? t('online', language) : t('offline', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        driver.isAvailable
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {driver.isAvailable ? t('available', language) : t('busy', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(driver)}
                      onDelete={() => handleDelete(driver.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDriver ? t('editDriver', language) : t('addDriver', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName', language)}</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName', language)}</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email', language)}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactNumber', language)}</label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {!editingDriver && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password', language)}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingDriver}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {editingDriver && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password', language)} ({t('optional', language)})</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address', language)}</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingDriver ? t('update', language) : t('create', language)}
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

export default Drivers

