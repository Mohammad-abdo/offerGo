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
import { FiPlus, FiStar } from 'react-icons/fi'

const CategoryFeatures = () => {
  const { language } = useLanguage()
  const [features, setFeatures] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)
  const [formData, setFormData] = useState({
    vehicle_category_id: '',
    name: '',
    name_ar: '',
    icon: '',
    status: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchVehicleCategories()
    fetchFeatures()
  }, [])

  const fetchVehicleCategories = async () => {
    try {
      const response = await api.get('/vehicle-categories')
      if (response.data.success) {
        setVehicleCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching vehicle categories:', error)
    }
  }

  const fetchFeatures = async () => {
    try {
      setLoading(true)
      const response = await api.get('/category-features')
      if (response.data.success) {
        setFeatures(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (feature = null) => {
    if (feature) {
      setEditingFeature(feature)
      setFormData({
        vehicle_category_id: String(feature.vehicleCategoryId || ''),
        name: feature.name || '',
        name_ar: feature.nameAr || '',
        icon: feature.icon || '',
        status: feature.status ?? 1,
      })
    } else {
      setEditingFeature(null)
      setFormData({
        vehicle_category_id: '',
        name: '',
        name_ar: '',
        icon: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFeature(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, vehicle_category_id: Number(formData.vehicle_category_id) }
      if (editingFeature) {
        await api.put(`/category-features/${editingFeature.id}`, payload)
        showSuccess(t('updated', language))
      } else {
        await api.post('/category-features', payload)
        showSuccess(t('saved', language))
      }
      fetchFeatures()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving feature:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/category-features/${id}`)
          fetchFeatures()
          showSuccess(t('deleted', language))
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  if (loading && features.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  const filteredFeatures = features.filter((f) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (f.name || '').toLowerCase().includes(search) ||
      (f.nameAr || '').toLowerCase().includes(search) ||
      (f.vehicleCategory?.name || '').toLowerCase().includes(search) ||
      (f.vehicleCategory?.nameAr || '').toLowerCase().includes(search)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (f.status === 1 || f.status === '1')) ||
      (statusFilter === 'inactive' && (f.status === 0 || f.status === '0'))
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('categoryFeatures', language)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('manageCategoryFeatures', language)}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={20} />
          {t('addFeature', language)}
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        {t('categoryFeaturesInfo', language)}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
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
            <option value="inactive">{t('inactive', language)}</option>
          </FilterSelect>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <TableHeader language={language}>ID</TableHeader>
              <TableHeader language={language}>{t('name', language)}</TableHeader>
              <TableHeader language={language}>{t('vehicleCategory', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFeatures.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FiStar className="text-gray-400 dark:text-gray-500 mb-2" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {t('noCategoryFeaturesFound', language)}
                    </p>
                    {searchTerm && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {t('tryAdjustingYourSearch', language)}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredFeatures.map((feature) => (
                <tr
                  key={feature.id}
                  className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {feature.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {feature.icon && (
                        <span className="text-xl" role="img" aria-hidden>{feature.icon}</span>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'ar' ? (feature.nameAr || feature.name) : (feature.name || feature.nameAr)}
                        </div>
                        {feature.nameAr && feature.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? feature.name : feature.nameAr}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                      {language === 'ar'
                        ? (feature.vehicleCategory?.nameAr || feature.vehicleCategory?.name || '—')
                        : (feature.vehicleCategory?.name || feature.vehicleCategory?.nameAr || '—')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        feature.status === 1 || feature.status === '1'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {feature.status === 1 || feature.status === '1'
                        ? t('active', language)
                        : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(feature)}
                      onDelete={() => handleDelete(feature.id)}
                      showView={false}
                      showEdit={true}
                      showDelete={true}
                      forceShowIcons={true}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFeature ? t('editFeature', language) : t('addFeature', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('vehicleCategory', language)}
            </label>
            <select
              value={formData.vehicle_category_id}
              onChange={(e) => setFormData({ ...formData, vehicle_category_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">{t('selectCategory', language)}...</option>
              {vehicleCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.nameAr ? `/ ${cat.nameAr}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('name', language)} ({t('english', language)})
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. WiFi, AC"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('name', language)} ({t('arabic', language)})
              </label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="❄️"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
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
              {editingFeature ? t('update', language) : t('create', language)}
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

export default CategoryFeatures
