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
import {
  FiPlus,
  FiRefreshCw,
  FiList,
  FiGrid,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'

const SERVICE_CATEGORY_CARGO_ID = 2

const VehicleCategoriesCargo = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    service_category_id: String(SERVICE_CATEGORY_CARGO_ID),
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    icon: '',
    capacity: '',
    max_load: '',
    status: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vehicle-categories', {
        params: { service_category_id: SERVICE_CATEGORY_CARGO_ID },
      })
      if (response.data.success) {
        setCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching cargo categories:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        service_category_id: String(category.serviceCategoryId || SERVICE_CATEGORY_CARGO_ID),
        name: category.name || '',
        name_ar: category.nameAr || '',
        slug: category.slug || '',
        description: category.description || '',
        description_ar: category.descriptionAr || '',
        icon: category.icon || '',
        capacity: category.capacity ?? '',
        max_load: category.maxLoad ?? '',
        status: category.status ?? 1,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        service_category_id: String(SERVICE_CATEGORY_CARGO_ID),
        name: '',
        name_ar: '',
        slug: '',
        description: '',
        description_ar: '',
        icon: '',
        capacity: '',
        max_load: '',
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
      const payload = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        max_load: formData.max_load ? Number(formData.max_load) : null,
      }
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

  const totalCount = categories.length
  const activeCount = categories.filter((c) => c.status === 1 || c.status === '1').length
  const inactiveCount = categories.filter((c) => c.status === 0 || c.status === '0').length
  const withPricingCount = categories.filter((c) => (c.pricingRules?.length || 0) > 0).length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي الفئات' : 'Total categories', value: totalCount, icon: FiPackage, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-600 dark:text-gray-400', borderColor: 'border-gray-200 dark:border-gray-700' },
    { label: t('pricing', language), value: withPricingCount, icon: FiCheckCircle, bgLight: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800' },
  ]

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('vehicleCategoriesCargo', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageCargoVehicleCategories', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCategories()} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:-translate-y-0.5">
            <FiPlus size={18} />
            {t('addVehicleCategory', language)}
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
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiPackage className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noCargoCategoriesFound', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">{searchTerm ? t('tryAdjustingYourSearch', language) : (language === 'ar' ? 'لا توجد فئات شحن حتى الآن.' : 'No cargo categories yet.')}</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => (
              <div key={category.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {category.icon && <span className="text-2xl shrink-0" role="img" aria-hidden>{category.icon}</span>}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{category.slug || '—'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${category.status === 1 || category.status === '1' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                    {category.status === 1 || category.status === '1' ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">{category.capacity ?? '-'} {t('crew', language)}</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">{category.maxLoad ?? '-'} kg</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${category.pricingRules?.length > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{category.pricingRules?.length > 0 ? '✓ ' + t('pricing', language) : '—'}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <button type="button" onClick={() => navigate(`/vehicle-categories/${category.id}`)} className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline">
                    {t('viewFullDetails', language)}
                  </button>
                  <ActionButtons onView={() => navigate(`/vehicle-categories/${category.id}`)} onEdit={() => handleOpenModal(category)} onDelete={() => handleDelete(category.id)} showView={true} showEdit={true} showDelete={true} forceShowIcons={true} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <TableHeader language={language}>ID</TableHeader>
                  <TableHeader language={language}>{t('name', language)}</TableHeader>
                  <TableHeader language={language}>{t('crew', language)}</TableHeader>
                  <TableHeader language={language}>{t('maxLoad', language)}</TableHeader>
                  <TableHeader language={language}>{t('zones', language)}</TableHeader>
                  <TableHeader language={language}>{t('pricing', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{category.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {category.icon && <span className="text-xl shrink-0" role="img" aria-hidden>{category.icon}</span>}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)}</div>
                          {category.slug && <div className="text-xs text-gray-500 dark:text-gray-400">{category.slug}</div>}
                          <button type="button" onClick={() => navigate(`/vehicle-categories/${category.id}`)} className="mt-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline">{t('viewFullDetails', language)}</button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">{category.capacity ?? '-'} {t('crew', language)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">{category.maxLoad ?? '-'} kg</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{category.zones?.length ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${category.pricingRules?.length > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{category.pricingRules?.length > 0 ? '✓' : '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${category.status === 1 || category.status === '1' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}>
                        {category.status === 1 || category.status === '1' ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons onView={() => navigate(`/vehicle-categories/${category.id}`)} onEdit={() => handleOpenModal(category)} onDelete={() => handleDelete(category.id)} showView={true} showEdit={true} showDelete={true} forceShowIcons={true} />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🚚"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('capacity', language)} ({t('crew', language)})
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Driver + helpers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maxLoad', language)} (kg)
              </label>
              <input
                type="number"
                value={formData.max_load}
                onChange={(e) => setFormData({ ...formData, max_load: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="500, 1000, 3000..."
              />
            </div>
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
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800">
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

export default VehicleCategoriesCargo
