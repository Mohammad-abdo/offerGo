import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'
import { showSuccess, showError } from '../../utils/toast'

const ManageZonePrices = () => {
  const { language } = useLanguage()
  const [zonePrices, setZonePrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
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
        showSuccess(t('updated', language))
      } else {
        await api.post('/manage-zones/zone-prices', formData)
        showSuccess(t('saved', language))
      }
      await fetchZonePrices()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving zone price:', error)
      showError(error.response?.data?.message || 'Failed to save zone price')
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/manage-zones/zone-prices/${id}`)
          showSuccess(t('deleted', language))
          await fetchZonePrices()
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredPrices = zonePrices.filter((p) => !searchTerm || (p.zone?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'جاري تحميل أسعار المناطق...' : 'Loading zone prices...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{language === 'ar' ? 'أسعار المناطق' : 'Zone Prices'}</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">{language === 'ar' ? 'إدارة التسعير حسب المناطق والخدمات.' : 'Manage pricing for different zones and services.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchZonePrices} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button type="button" onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors">
            <FiPlus size={18} />
            {language === 'ar' ? 'إضافة سعر منطقة' : 'Add Zone Price'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/30">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إجمالي أسعار المناطق' : 'Total zone prices'}</span>
            <FiDollarSign className="text-slate-600 dark:text-slate-400" size={28} />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{zonePrices.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search', language) + '...'} language={language} />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button type="button" onClick={() => setViewMode('cards')} className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'بطاقات' : 'Cards'}>
              <FiGrid size={20} />
            </button>
            <button type="button" onClick={() => setViewMode('table')} className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'جدول' : 'Table'}>
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiDollarSign className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة أسعار المناطق' : 'Zone prices list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredPrices.length} {language === 'ar' ? 'سعر' : 'price(s)'}</p>
        </div>

        {filteredPrices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiDollarSign className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">{language === 'ar' ? 'أضف أسعار مناطق.' : 'Add zone prices to configure pricing.'}</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPrices.map((price) => (
              <div key={price.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <h3 className="font-semibold text-gray-900 dark:text-white">{price.zone?.name || 'N/A'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{price.service?.name || 'N/A'}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p><span className="text-gray-500 dark:text-gray-400">Base:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{price.baseFare ?? '0.00'} SAR</span></p>
                  <p><span className="text-gray-500 dark:text-gray-400">Per KM:</span> {price.perKm ?? '0.00'} SAR</p>
                  <p><span className="text-gray-500 dark:text-gray-400">Per min:</span> {price.perMinute ?? '0.00'} SAR</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  <button type="button" onClick={() => handleOpenModal(price)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title={t('edit', language)}><FiEdit size={18} /></button>
                  <button type="button" onClick={() => handleDelete(price.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}><FiTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/70">
              <tr>
                <TableHeader language={language}>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableHeader>
                <TableHeader language={language}>{language === 'ar' ? 'الخدمة' : 'Service'}</TableHeader>
                <TableHeader language={language}>Base Fare</TableHeader>
                <TableHeader language={language}>Per KM</TableHeader>
                <TableHeader language={language}>Per Minute</TableHeader>
                <TableHeader language={language}>{t('actions', language)}</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{price.zone?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{price.service?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">{price.baseFare ?? '0.00'} SAR</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{price.perKm ?? '0.00'} SAR</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{price.perMinute ?? '0.00'} SAR</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleOpenModal(price)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"><FiEdit size={18} /></button>
                      <button type="button" onClick={() => handleDelete(price.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><FiTrash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {t('save', language)}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })} onConfirm={confirmDialog.onConfirm || (() => {})} message={confirmDialog.message} type="danger" />
    </div>
  )
}

export default ManageZonePrices




