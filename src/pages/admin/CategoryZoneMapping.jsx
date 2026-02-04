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
import { FiPlus, FiLink, FiLayers, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi'

const CategoryZoneMapping = () => {
  const { language } = useLanguage()
  const [mappings, setMappings] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('cards')
  const [formData, setFormData] = useState({
    vehicle_category_id: '',
    geographic_zone_id: '',
    status: 1,
  })
  const [bulkFormData, setBulkFormData] = useState({
    vehicle_category_id: '',
    zone_ids: [],
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchVehicleCategories()
    fetchZones()
    fetchMappings()
  }, [])

  const fetchVehicleCategories = async () => {
    try {
      const response = await api.get('/vehicle-categories')
      if (response.data.success) setVehicleCategories(response.data.data || [])
    } catch (error) {
      console.error('Error fetching vehicle categories:', error)
    }
  }

  const fetchZones = async () => {
    try {
      const response = await api.get('/geographic-zones')
      if (response.data.success) setZones(response.data.data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
    }
  }

  const fetchMappings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/category-zones')
      if (response.data.success) setMappings(response.data.data || [])
    } catch (error) {
      console.error('Error fetching mappings:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({ vehicle_category_id: '', geographic_zone_id: '', status: 1 })
    setIsModalOpen(true)
  }

  const handleOpenBulkModal = () => {
    setBulkFormData({ vehicle_category_id: '', zone_ids: [] })
    setIsBulkModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/category-zones/assign', {
        ...formData,
        vehicle_category_id: Number(formData.vehicle_category_id),
        geographic_zone_id: Number(formData.geographic_zone_id),
      })
      showSuccess(t('saved', language))
      fetchMappings()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error creating mapping:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    if (!bulkFormData.vehicle_category_id || bulkFormData.zone_ids.length === 0) {
      showError('Select category and at least one zone')
      return
    }
    try {
      await api.post('/category-zones/bulk-assign', {
        vehicle_category_id: Number(bulkFormData.vehicle_category_id),
        zone_ids: bulkFormData.zone_ids.map(Number),
        status: 1,
      })
      showSuccess(t('saved', language))
      fetchMappings()
      setIsBulkModalOpen(false)
    } catch (error) {
      console.error('Error bulk assigning:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleZoneToggle = (zoneId) => {
    setBulkFormData((prev) => ({
      ...prev,
      zone_ids: prev.zone_ids.includes(zoneId)
        ? prev.zone_ids.filter((id) => id !== zoneId)
        : [...prev.zone_ids, zoneId],
    }))
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/category-zones/${id}`)
          fetchMappings()
          showSuccess(t('deleted', language))
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  if (loading && mappings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  const filteredMappings = mappings.filter((m) => {
    const search = searchTerm.toLowerCase()
    const catName = (m.vehicleCategory?.name || '').toLowerCase()
    const catNameAr = (m.vehicleCategory?.nameAr || '').toLowerCase()
    const zoneName = (m.geographicZone?.name || '').toLowerCase()
    const zoneNameAr = (m.geographicZone?.nameAr || '').toLowerCase()
    const matchesSearch =
      !searchTerm || catName.includes(search) || catNameAr.includes(search) || zoneName.includes(search) || zoneNameAr.includes(search)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (m.status === 1 || m.status === '1')) ||
      (statusFilter === 'inactive' && (m.status === 0 || m.status === '0'))
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('categoryZoneMapping', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageCategoryZoneMapping', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchMappings} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button type="button" onClick={handleOpenBulkModal} className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500 text-orange-600 dark:text-orange-400 px-5 py-2.5 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
            <FiLink size={18} />
            {t('bulkAssign', language)}
          </button>
          <button type="button" onClick={handleOpenModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors">
            <FiPlus size={20} />
            {t('addMapping', language)}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/30">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إجمالي الربط' : 'Total mappings'}</span>
            <FiLayers className="text-slate-600 dark:text-slate-400" size={28} />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{mappings.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-sm text-blue-800 dark:text-blue-200">
        {t('zoneMappingInfo', language)}
      </div>

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
            <FiLayers className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة ربط الفئات بالمناطق' : 'Category–zone mappings list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredMappings.length} {language === 'ar' ? 'ربط' : 'mapping(s)'}</p>
        </div>

        {filteredMappings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiLayers className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noMappingsFound', language)}</h3>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMappings.map((mapping) => (
              <div key={mapping.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {language === 'ar' ? (mapping.vehicleCategory?.nameAr || mapping.vehicleCategory?.name || '—') : (mapping.vehicleCategory?.name || mapping.vehicleCategory?.nameAr || '—')}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ar' ? (mapping.geographicZone?.nameAr || mapping.geographicZone?.name || '—') : (mapping.geographicZone?.name || mapping.geographicZone?.nameAr || '—')}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{mapping.geographicZone?.radius != null ? `${mapping.geographicZone.radius} km` : '—'}</p>
                <span className={`mt-2 inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg ${mapping.status === 1 || mapping.status === '1' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {mapping.status === 1 || mapping.status === '1' ? t('active', language) : t('inactive', language)}
                </span>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <ActionButtons onDelete={() => handleDelete(mapping.id)} showView={false} showEdit={false} showDelete={true} forceShowIcons={true} />
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
              <TableHeader language={language}>{t('vehicleCategory', language)}</TableHeader>
              <TableHeader language={language}>{t('serviceType', language)}</TableHeader>
              <TableHeader language={language}>{t('geographicZones', language)}</TableHeader>
              <TableHeader language={language}>{t('radius', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMappings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FiLayers className="text-gray-400 dark:text-gray-500 mb-2" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noMappingsFound', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('tryAdjustingYourSearch', language)}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMappings.map((mapping) => (
                <tr
                  key={mapping.id}
                  className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{mapping.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {language === 'ar'
                        ? (mapping.vehicleCategory?.nameAr || mapping.vehicleCategory?.name || '—')
                        : (mapping.vehicleCategory?.name || mapping.vehicleCategory?.nameAr || '—')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                      {language === 'ar'
                        ? (mapping.vehicleCategory?.serviceCategory?.nameAr || mapping.vehicleCategory?.serviceCategory?.name || '—')
                        : (mapping.vehicleCategory?.serviceCategory?.name || mapping.vehicleCategory?.serviceCategory?.nameAr || '—')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {language === 'ar'
                      ? (mapping.geographicZone?.nameAr || mapping.geographicZone?.name || '—')
                      : (mapping.geographicZone?.name || mapping.geographicZone?.nameAr || '—')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {mapping.geographicZone?.radius != null ? `${mapping.geographicZone.radius} km` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        mapping.status === 1 || mapping.status === '1'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {mapping.status === 1 || mapping.status === '1' ? t('active', language) : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onDelete={() => handleDelete(mapping.id)}
                      showView={false}
                      showEdit={false}
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
        )}
      </div>

      {/* Single mapping modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('addMapping', language)} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('vehicleCategory', language)}</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('geographicZones', language)}</label>
            <select
              value={formData.geographic_zone_id}
              onChange={(e) => setFormData({ ...formData, geographic_zone_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">{t('selectZone', language)}...</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} {zone.nameAr ? `/ ${zone.nameAr}` : ''} ({zone.radius ?? '—'} km)
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk assign modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title={t('bulkAssign', language)} size="md">
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('vehicleCategory', language)}</label>
            <select
              value={bulkFormData.vehicle_category_id}
              onChange={(e) => setBulkFormData({ ...bulkFormData, vehicle_category_id: e.target.value })}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectZonesToAssign', language)}</label>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2 bg-gray-50 dark:bg-gray-700/30">
              {zones.map((zone) => (
                <label key={zone.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={bulkFormData.zone_ids.includes(zone.id)}
                    onChange={() => handleZoneToggle(zone.id)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {zone.name} {zone.nameAr ? `/ ${zone.nameAr}` : ''} ({zone.radius ?? '—'} km)
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {t('bulkAssign', language)} ({bulkFormData.zone_ids.length} {t('zones', language)})
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

export default CategoryZoneMapping
