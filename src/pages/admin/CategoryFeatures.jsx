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
  FiList,
  FiGrid,
  FiStar,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'

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
  const [viewMode, setViewMode] = useState('cards')
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

  const totalCount = features.length
  const activeCount = features.filter((f) => f.status === 1 || f.status === '1').length
  const inactiveCount = features.filter((f) => f.status === 0 || f.status === '0').length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي المميزات' : 'Total features', value: totalCount, icon: FiStar, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-600 dark:text-gray-400', borderColor: 'border-gray-200 dark:border-gray-700' },
  ]

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('categoryFeatures', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageCategoryFeatures', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchVehicleCategories(); fetchFeatures(); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:-translate-y-0.5">
            <FiPlus size={18} />
            {t('addFeature', language)}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Info box */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 text-sm text-blue-800 dark:text-blue-200">
        {t('categoryFeaturesInfo', language)}
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
        {filteredFeatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiStar className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noCategoryFeaturesFound', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">{searchTerm ? t('tryAdjustingYourSearch', language) : (language === 'ar' ? 'لا توجد مميزات فئات حتى الآن.' : 'No category features yet.')}</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFeatures.map((feature) => (
              <div key={feature.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {feature.icon && <span className="text-2xl shrink-0" role="img" aria-hidden>{feature.icon}</span>}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{language === 'ar' ? (feature.nameAr || feature.name) : (feature.name || feature.nameAr)}</p>
                      {feature.nameAr && feature.name && <p className="text-sm text-gray-500 dark:text-gray-400 truncate" dir="rtl">{language === 'ar' ? feature.name : feature.nameAr}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${feature.status === 1 || feature.status === '1' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                    {feature.status === 1 || feature.status === '1' ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                    {language === 'ar' ? (feature.vehicleCategory?.nameAr || feature.vehicleCategory?.name || '—') : (feature.vehicleCategory?.name || feature.vehicleCategory?.nameAr || '—')}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons onEdit={() => handleOpenModal(feature)} onDelete={() => handleDelete(feature.id)} showView={false} showEdit={true} showDelete={true} forceShowIcons={true} size="sm" />
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
                  <TableHeader language={language}>{t('vehicleCategory', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFeatures.map((feature) => (
                  <tr key={feature.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{feature.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {feature.icon && <span className="text-xl" role="img" aria-hidden>{feature.icon}</span>}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? (feature.nameAr || feature.name) : (feature.name || feature.nameAr)}</div>
                          {feature.nameAr && feature.name && <div className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? feature.name : feature.nameAr}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                        {language === 'ar' ? (feature.vehicleCategory?.nameAr || feature.vehicleCategory?.name || '—') : (feature.vehicleCategory?.name || feature.vehicleCategory?.nameAr || '—')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${feature.status === 1 || feature.status === '1' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}>
                        {feature.status === 1 || feature.status === '1' ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons onEdit={() => handleOpenModal(feature)} onDelete={() => handleDelete(feature.id)} showView={false} showEdit={true} showDelete={true} forceShowIcons={true} />
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
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800">
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
