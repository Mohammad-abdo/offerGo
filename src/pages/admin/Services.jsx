import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import { useLanguage } from '../../contexts/LanguageContext'
import { t, getLocalizedName, getLocalizedDescription } from '../../utils/translations'

const Services = () => {
  const { language } = useLanguage()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    region_id: '',
    capacity: '',
    base_fare: '',
    minimum_fare: '',
    minimum_distance: '',
    per_distance: '',
    per_minute_drive: '',
    per_minute_wait: '',
    waiting_time_limit: '',
    payment_method: '',
    commission_type: '',
    admin_commission: '',
    fleet_commission: '',
    cancellation_fee: '',
    description: '',
    description_ar: '',
    status: 1,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/service-list')
      if (response.data.success) {
        setServices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name || '',
        name_ar: service.nameAr || '',
        region_id: service.regionId || '',
        capacity: service.capacity || '',
        base_fare: service.baseFare || '',
        minimum_fare: service.minimumFare || '',
        minimum_distance: service.minimumDistance || '',
        per_distance: service.perDistance || '',
        per_minute_drive: service.perMinuteDrive || '',
        per_minute_wait: service.perMinuteWait || '',
        waiting_time_limit: service.waitingTimeLimit || '',
        payment_method: service.paymentMethod || '',
        commission_type: service.commissionType || '',
        admin_commission: service.adminCommission || '',
        fleet_commission: service.fleetCommission || '',
        cancellation_fee: service.cancellationFee || '',
        description: service.description || '',
        description_ar: service.descriptionAr || '',
        status: service.status || 1,
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        name_ar: '',
        region_id: '',
        capacity: '',
        base_fare: '',
        minimum_fare: '',
        minimum_distance: '',
        per_distance: '',
        per_minute_drive: '',
        per_minute_wait: '',
        waiting_time_limit: '',
        payment_method: '',
        commission_type: '',
        admin_commission: '',
        fleet_commission: '',
        cancellation_fee: '',
        description: '',
        description_ar: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData)
      } else {
        await api.post('/services', formData)
      }
      fetchServices()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving service:', error)
      alert(error.response?.data?.message || 'Failed to save service')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return
    }
    try {
      await api.delete(`/services/${id}`)
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Failed to delete service')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('services', language)}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + {t('addService', language)}
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No services found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {getLocalizedName(service, language) || t('unnamedService', language)}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    {t('edit', language)}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    {t('delete', language)}
                  </button>
                </div>
              </div>
              {getLocalizedDescription(service, language) && (
                <p className="text-gray-600 mb-4 text-sm">{getLocalizedDescription(service, language)}</p>
              )}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('baseFare', language)}:</span>
                  <span className="text-sm font-medium">${(service.baseFare || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('perDistance', language)}:</span>
                  <span className="text-sm font-medium">
                    ${(service.perDistance || 0).toFixed(2)}/km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('perMinute', language)}:</span>
                  <span className="text-sm font-medium">
                    ${(service.perMinuteDrive || 0).toFixed(2)}/min
                  </span>
                </div>
                <div className="mt-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.status === 1 || service.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.status === 1 || service.status === 'active' ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingService ? t('editService', language) : t('addService', language)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name', language)} ({t('english', language)})</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name', language)} ({t('arabic', language)})</label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare</label>
              <input
                type="number"
                step="0.01"
                value={formData.base_fare}
                onChange={(e) => setFormData({ ...formData, base_fare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Fare</label>
              <input
                type="number"
                step="0.01"
                value={formData.minimum_fare}
                onChange={(e) => setFormData({ ...formData, minimum_fare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Distance</label>
              <input
                type="number"
                step="0.01"
                value={formData.per_distance}
                onChange={(e) => setFormData({ ...formData, per_distance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Minute Drive</label>
              <input
                type="number"
                step="0.01"
                value={formData.per_minute_drive}
                onChange={(e) => setFormData({ ...formData, per_minute_drive: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description', language)} ({t('english', language)})</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description', language)} ({t('arabic', language)})</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
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
              {editingService ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Services

