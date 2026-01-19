import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi'
import Modal from '../../components/Modal'

const ManageZonePrices = () => {
  const { language } = useLanguage()
  const [zonePrices, setZonePrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState(null)
  const [formData, setFormData] = useState({
    zoneId: '',
    serviceId: '',
    baseFare: '',
    perKm: '',
    perMinute: '',
    status: 1,
  })
  const [zones, setZones] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchZonePrices()
    fetchZones()
    fetchServices()
  }, [])

  const fetchZonePrices = async () => {
    try {
      // This endpoint may need to be created
      const response = await api.get('/manage-zones/zone-prices')
      if (response.data.success) {
        setZonePrices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching zone prices:', error)
      setZonePrices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchZones = async () => {
    try {
      const response = await api.get('/manage-zones/managezone-list')
      if (response.data.success) {
        setZones(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
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
        zoneId: price.zoneId || '',
        serviceId: price.serviceId || '',
        baseFare: price.baseFare || '',
        perKm: price.perKm || '',
        perMinute: price.perMinute || '',
        status: price.status || 1,
      })
    } else {
      setEditingPrice(null)
      setFormData({
        zoneId: '',
        serviceId: '',
        baseFare: '',
        perKm: '',
        perMinute: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPrice) {
        await api.put(`/manage-zones/zone-prices/${editingPrice.id}`, formData)
      } else {
        await api.post('/manage-zones/zone-prices', formData)
      }
      await fetchZonePrices()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving zone price:', error)
      alert(error.response?.data?.message || 'Failed to save zone price')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zone Prices</h1>
          <p className="text-gray-600 mt-1">Manage pricing for different zones</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Zone Price
        </button>
      </div>

      {zonePrices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FiDollarSign className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No zone prices found. Add zone prices to configure pricing.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Fare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per KM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Minute</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {zonePrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {price.zone?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {price.service?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${price.baseFare || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${price.perKm || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${price.perMinute || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(price)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPrice ? 'Edit Zone Price' : 'Add Zone Price'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone *</label>
            <select
              name="zoneId"
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare</label>
              <input
                type="number"
                step="0.01"
                name="baseFare"
                value={formData.baseFare}
                onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Per KM</label>
              <input
                type="number"
                step="0.01"
                name="perKm"
                value={formData.perKm}
                onChange={(e) => setFormData({ ...formData, perKm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Per Minute</label>
              <input
                type="number"
                step="0.01"
                name="perMinute"
                value={formData.perMinute}
                onChange={(e) => setFormData({ ...formData, perMinute: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('save', language)}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ManageZonePrices



