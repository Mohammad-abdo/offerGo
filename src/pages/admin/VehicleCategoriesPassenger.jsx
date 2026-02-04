import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { FiPlus, FiUsers } from 'react-icons/fi'

const SERVICE_CATEGORY_PASSENGER_ID = 1

const VehicleCategoriesPassenger = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    service_category_id: String(SERVICE_CATEGORY_PASSENGER_ID),
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    icon: '',
    capacity: '',
    status: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vehicle-categories', {
        params: { service_category_id: SERVICE_CATEGORY_PASSENGER_ID },
      })
      if (response.data.success) {
        setCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching passenger categories:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        service_category_id: String(category.serviceCategoryId || SERVICE_CATEGORY_PASSENGER_ID),
        name: category.name || '',
        name_ar: category.nameAr || '',
        slug: category.slug || '',
        description: category.description || '',
        description_ar: category.descriptionAr || '',
        icon: category.icon || '',
        capacity: category.capacity ?? '',
        status: category.status ?? 1,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        service_category_id: String(SERVICE_CATEGORY_PASSENGER_ID),
        name: '',
        name_ar: '',
        slug: '',
        description: '',
        description_ar: '',
        icon: '',
        capacity: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, capacity: formData.capacity ? Number(formData.capacity) : null }
      if (editingCategory) {
        await api.put(`/vehicle-categories/${editingCategory.id}`, payload)
        showSuccess(t('updated', language))
      } else {
        await api.post('/vehicle-categories', payload)
        showSuccess(t('saved', language))
      }
      fetchCategories()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving category:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/vehicle-categories/${id}`)
          fetchCategories()
          showSuccess(t('deleted', language))
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  const filteredCategories = categories.filter((cat) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (cat.name || '').toLowerCase().includes(search) ||
      (cat.nameAr || '').toLowerCase().includes(search) ||
      (cat.slug || '').toLowerCase().includes(search)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (cat.status === 1 || cat.status === '1')) ||
      (statusFilter === 'inactive' && (cat.status === 0 || cat.status === '0'))
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('vehicleCategoriesPassenger', language)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('managePassengerVehicleCategories', language)}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={20} />
          {t('addVehicleCategory', language)}
        </button>
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
              <TableHeader language={language}>{t('capacity', language)}</TableHeader>
              <TableHeader language={language}>{t('features', language)}</TableHeader>
              <TableHeader language={language}>{t('zones', language)}</TableHeader>
              <TableHeader language={language}>{t('pricing', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-gray-400 dark:text-gray-500 mb-2" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {t('noPassengerCategoriesFound', language)}
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
              filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {category.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {category.icon && (
                        <span className="text-xl" role="img" aria-hidden>{category.icon}</span>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)}
                        </div>
                        {category.slug && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{category.slug}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                      {category.capacity ?? '-'} {t('seats', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {category.features?.length ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {category.zones?.length ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        category.pricingRules?.length > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {category.pricingRules?.length > 0 ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        category.status === 1 || category.status === '1'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {category.status === 1 || category.status === '1'
                        ? t('active', language)
                        : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onView={() => navigate(`/vehicle-categories/${category.id}`)}
                      onEdit={() => handleOpenModal(category)}
                      onDelete={() => handleDelete(category.id)}
                      showView={true}
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
        title={editingCategory ? t('editVehicleCategory', language) : t('addVehicleCategory', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('slug', language)}</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('capacity', language)} ({t('seats', language)})
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🚗"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description', language)} ({t('english', language)})
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description', language)} ({t('arabic', language)})
            </label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              rows="2"
              dir="rtl"
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
              {editingCategory ? t('update', language) : t('create', language)}
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

export default VehicleCategoriesPassenger
