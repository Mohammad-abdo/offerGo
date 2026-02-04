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
import { FiPlus, FiMapPin, FiRefreshCw, FiGrid, FiList, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const GeographicZones = () => {
  const { language } = useLanguage()
  const [zones, setZones] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    region_id: '',
    center_lat: '',
    center_lng: '',
    radius: '',
    status: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchRegions()
    fetchZones()
  }, [])

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions')
      if (response.data.success) setRegions(response.data.data || [])
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const fetchZones = async () => {
    try {
      setLoading(true)
      const response = await api.get('/geographic-zones')
      if (response.data.success) setZones(response.data.data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({
        name: zone.name || '',
        name_ar: zone.nameAr || '',
        region_id: zone.regionId ? String(zone.regionId) : '',
        center_lat: zone.centerLat ?? '',
        center_lng: zone.centerLng ?? '',
        radius: zone.radius ?? '',
        status: zone.status ?? 1,
      })
    } else {
      setEditingZone(null)
      setFormData({
        name: '',
        name_ar: '',
        region_id: '',
        center_lat: '',
        center_lng: '',
        radius: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingZone(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        region_id: formData.region_id ? Number(formData.region_id) : null,
        center_lat: formData.center_lat ? Number(formData.center_lat) : null,
        center_lng: formData.center_lng ? Number(formData.center_lng) : null,
        radius: formData.radius ? Number(formData.radius) : null,
        status: Number(formData.status),
      }
      if (editingZone) {
        await api.put(`/geographic-zones/${editingZone.id}`, payload)
        showSuccess(t('updated', language))
      } else {
        await api.post('/geographic-zones', payload)
        showSuccess(t('saved', language))
      }
      fetchZones()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving zone:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/geographic-zones/${id}`)
          fetchZones()
          showSuccess(t('deleted', language))
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const totalCount = zones.length
  const activeCount = zones.filter((z) => z.status === 1 || z.status === '1').length
  const inactiveCount = zones.filter((z) => z.status !== 1 && z.status !== '1').length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي المناطق' : 'Total zones', value: totalCount, icon: FiMapPin, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800' },
  ]

  if (loading && zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'جاري تحميل المناطق الجغرافية...' : 'Loading geographic zones...'}</p>
      </div>
    )
  }

  const filteredZones = zones.filter((z) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (z.name || '').toLowerCase().includes(search) ||
      (z.nameAr || '').toLowerCase().includes(search) ||
      (z.region?.name || '').toLowerCase().includes(search)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (z.status === 1 || z.status === '1')) ||
      (statusFilter === 'inactive' && (z.status === 0 || z.status === '0'))
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('geographicZones', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageGeographicZones', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchZones} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button type="button" onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors">
            <FiPlus size={20} />
            {t('addZone', language)}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-sm text-blue-800 dark:text-blue-200">
        {t('geographicZonesInfo', language)}
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
            <FiMapPin className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة المناطق الجغرافية' : 'Geographic zones list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredZones.length} {language === 'ar' ? 'منطقة' : 'zone(s)'}</p>
        </div>

        {filteredZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiMapPin className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noZonesFound', language)}</h3>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{language === 'ar' ? (zone.nameAr || zone.name) : (zone.name || zone.nameAr)}</h3>
                  <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${zone.status === 1 || zone.status === '1' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {zone.status === 1 || zone.status === '1' ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{zone.region ? (language === 'ar' ? (zone.region.nameAr || zone.region.name) : (zone.region.name || zone.region.name)) : '—'}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{zone.centerLat != null && zone.centerLng != null ? `${Number(zone.centerLat).toFixed(4)}, ${Number(zone.centerLng).toFixed(4)}` : '—'} • {zone.radius != null ? `${zone.radius} km` : '—'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <ActionButtons onEdit={() => handleOpenModal(zone)} onDelete={() => handleDelete(zone.id)} showView={false} showEdit={true} showDelete={true} forceShowIcons={true} />
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
              <TableHeader language={language}>{t('region', language)}</TableHeader>
              <TableHeader language={language}>{t('centerCoordinates', language)}</TableHeader>
              <TableHeader language={language}>{t('radius', language)}</TableHeader>
              <TableHeader language={language}>{t('vehicleCategoriesCount', language)}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredZones.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FiMapPin className="text-gray-400 dark:text-gray-500 mb-2" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noZonesFound', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('tryAdjustingYourSearch', language)}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredZones.map((zone) => (
                <tr
                  key={zone.id}
                  className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{zone.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {language === 'ar' ? (zone.nameAr || zone.name) : (zone.name || zone.nameAr)}
                      </div>
                      {zone.nameAr && zone.name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? zone.name : zone.nameAr}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {zone.region ? (language === 'ar' ? (zone.region.nameAr || zone.region.name) : (zone.region.name || zone.region.nameAr)) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                    {zone.centerLat != null && zone.centerLng != null
                      ? `${Number(zone.centerLat).toFixed(4)}, ${Number(zone.centerLng).toFixed(4)}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                      {zone.radius != null ? `${zone.radius} km` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {zone.categoryZones?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        zone.status === 1 || zone.status === '1'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {zone.status === 1 || zone.status === '1' ? t('active', language) : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(zone)}
                      onDelete={() => handleDelete(zone.id)}
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
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingZone ? t('editZone', language) : t('addZone', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name', language)} ({t('english', language)})</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name', language)} ({t('arabic', language)})</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('region', language)}</label>
            <select
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">{t('selectRegion', language)}...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{language === 'ar' ? (r.nameAr || r.name) : (r.name || r.nameAr)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('latitude', language)}</label>
              <input
                type="number"
                step="any"
                value={formData.center_lat}
                onChange={(e) => setFormData({ ...formData, center_lat: e.target.value })}
                required
                placeholder="e.g. 24.7136"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('longitude', language)}</label>
              <input
                type="number"
                step="any"
                value={formData.center_lng}
                onChange={(e) => setFormData({ ...formData, center_lng: e.target.value })}
                required
                placeholder="e.g. 46.6753"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('radius', language)} (km)</label>
              <input
                type="number"
                step="any"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {editingZone ? t('update', language) : t('create', language)}
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

export default GeographicZones
