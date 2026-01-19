import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiTrendingUp, FiMapPin, FiSettings } from 'react-icons/fi'

const SurgePrices = () => {
  const { language } = useLanguage()
  const [surgePrices, setSurgePrices] = useState([])
  const [regions, setRegions] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState(null)
  const [formData, setFormData] = useState({
    region_id: '',
    service_id: '',
    day: [],
    type: 'percentage',
    value: '',
    from_time: { hour: 0, minute: 0 },
    to_time: { hour: 23, minute: 59 },
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    fetchSurgePrices()
    fetchRegions()
    fetchServices()
  }, [])

  const fetchSurgePrices = async () => {
    try {
      const response = await api.get('/surge-prices')
      if (response.data.success) {
        setSurgePrices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching surge prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions/region-list')
      if (response.data.success) {
        setRegions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/service-list')
      if (response.data.success) {
        setServices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleOpenModal = (price = null) => {
    if (price) {
      setEditingPrice(price)
      setFormData({
        region_id: price.regionId?.toString() || '',
        service_id: price.serviceId?.toString() || '',
        day: price.day || [],
        type: price.type || 'percentage',
        value: price.value?.toString() || '',
        from_time: price.fromTime || { hour: 0, minute: 0 },
        to_time: price.toTime || { hour: 23, minute: 59 },
      })
    } else {
      setEditingPrice(null)
      setFormData({
        region_id: '',
        service_id: '',
        day: [],
        type: 'percentage',
        value: '',
        from_time: { hour: 0, minute: 0 },
        to_time: { hour: 23, minute: 59 },
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrice(null)
  }

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      day: formData.day.includes(day)
        ? formData.day.filter(d => d !== day)
        : [...formData.day, day]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        day: JSON.stringify(formData.day),
        from_time: JSON.stringify(formData.from_time),
        to_time: JSON.stringify(formData.to_time),
      }
      if (editingPrice) {
        await api.put(`/surge-prices/${editingPrice.id}`, submitData)
      } else {
        await api.post('/surge-prices', submitData)
      }
      fetchSurgePrices()
      handleCloseModal()
      showSuccess(editingPrice ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving surge price:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/surge-prices/${id}`)
          fetchSurgePrices()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting surge price:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredPrices = surgePrices.filter(price => {
    return !searchTerm || 
      price.region?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('surgePrices', language)}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage surge pricing for regions and services</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          Add Surge Price
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search', language) + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('actions', language)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPrices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiTrendingUp size={48} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 dark:hover:from-blue-900/10 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 text-blue-600 dark:text-blue-400" size={18} />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {price.region?.name || 'All Regions'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {price.service?.name || 'All Services'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                      {price.type || 'percentage'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {price.type === 'percentage' ? `${price.value}%` : `$${price.value}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {price.day && price.day.length > 0 ? price.day.join(', ') : 'All days'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(price)}
                      onDelete={() => handleDelete(price.id)}
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
        title={editingPrice ? 'Edit Surge Price' : 'Add Surge Price'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Region</label>
              <select
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Regions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Service</label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Days</label>
            <div className="grid grid-cols-4 gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    formData.day.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">From Time</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.from_time.hour}
                  onChange={(e) => setFormData({
                    ...formData,
                    from_time: { ...formData.from_time, hour: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Hour"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.from_time.minute}
                  onChange={(e) => setFormData({
                    ...formData,
                    from_time: { ...formData.from_time, minute: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Minute"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">To Time</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.to_time.hour}
                  onChange={(e) => setFormData({
                    ...formData,
                    to_time: { ...formData.to_time, hour: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Hour"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.to_time.minute}
                  onChange={(e) => setFormData({
                    ...formData,
                    to_time: { ...formData.to_time, minute: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Minute"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {editingPrice ? t('update', language) : t('create', language)}
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

export default SurgePrices
