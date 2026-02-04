import { useState, useEffect } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiRefreshCw, FiGrid, FiList, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const Regions = () => {
  const { language } = useLanguage()
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    distanceUnit: 'km',
    timezone: 'UTC',
    status: 1,
    coordinates: null
  })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions/region-list')
      if (response.data.success) {
        setRegions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      // Try alternative endpoint
      try {
        const altResponse = await api.get('/regions')
        if (altResponse.data.success) {
          setRegions(altResponse.data.data || [])
        }
      } catch (altError) {
        console.error('Error fetching regions from alternative endpoint:', altError)
        showError(t('failed', language) || 'Failed to fetch regions')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (region = null) => {
    if (region) {
      setEditingRegion(region)
      setFormData({
        name: region.name || '',
        nameAr: region.nameAr || '',
        distanceUnit: region.distanceUnit || 'km',
        timezone: region.timezone || 'UTC',
        status: region.status !== undefined ? region.status : 1,
        coordinates: region.coordinates || null
      })
    } else {
      setEditingRegion(null)
      setFormData({
        name: '',
        nameAr: '',
        distanceUnit: 'km',
        timezone: 'UTC',
        status: 1,
        coordinates: null
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRegion(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRegion) {
        await api.put(`/regions/${editingRegion.id}`, formData)
        showSuccess(t('updated', language) || 'Region updated successfully')
      } else {
        await api.post('/regions', formData)
        showSuccess(t('saved', language) || 'Region created successfully')
      }
      fetchRegions()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving region:', error)
      showError(error.response?.data?.message || t('failed', language) || t('operationFailed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/regions/${id}`)
          fetchRegions()
          showSuccess(t('deleted', language) || 'Region deleted successfully')
        } catch (error) {
          console.error('Error deleting region:', error)
          showError(error.response?.data?.message || t('failed', language) || 'Failed to delete region')
        }
      },
      message: t('deleteConfirm', language) || 'Are you sure you want to delete this region?',
    })
  }

  const filteredRegions = regions.filter((r) => {
    const name = (language === 'ar' && r.nameAr ? r.nameAr : r.name) || ''
    const nameAr = r.nameAr || ''
    const search = searchTerm.toLowerCase()
    return !searchTerm || name.toLowerCase().includes(search) || nameAr.toLowerCase().includes(search)
  })

  const totalCount = regions.length
  const activeCount = regions.filter((r) => r.status === 1).length
  const inactiveCount = regions.filter((r) => r.status !== 1).length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي المناطق' : 'Total regions', value: totalCount, icon: FiMapPin, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'جاري تحميل المناطق...' : 'Loading regions...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('regions', language)}</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">{t('manage_regions', language)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchRegions} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button type="button" onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors">
            <FiPlus size={18} />
            {t('add', language)} {t('regions', language)}
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
            <FiMapPin className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة المناطق' : 'Regions list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredRegions.length} {language === 'ar' ? 'منطقة' : 'region(s)'}</p>
        </div>

        {filteredRegions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiMapPin className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRegions.map((region) => (
              <div key={region.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                      <FiMapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{language === 'ar' && region.nameAr ? region.nameAr : region.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{region.distanceUnit || 'km'} • {region.timezone || 'UTC'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${region.status === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                    {region.status === 1 ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button type="button" onClick={() => handleOpenModal(region)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title={t('edit', language)}><FiEdit size={18} /></button>
                  <button type="button" onClick={() => handleDelete(region.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}><FiTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>{t('name', language)}</TableHeader>
                  <TableHeader language={language}>{t('distanceUnit', language) || 'Distance Unit'}</TableHeader>
                  <TableHeader language={language}>{t('timezone', language) || 'Timezone'}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredRegions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FiMapPin className="text-orange-600 dark:text-orange-400 shrink-0" size={18} />
                        <span className="font-medium text-gray-900 dark:text-white">{language === 'ar' && region.nameAr ? region.nameAr : region.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{region.distanceUnit || 'km'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{region.timezone || 'UTC'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${region.status === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                        {region.status === 1 ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleOpenModal(region)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title={t('edit', language)}><FiEdit size={18} /></button>
                        <button type="button" onClick={() => handleDelete(region.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}><FiTrash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRegion ? (t('editRegion', language) || 'Edit Region') : (t('addRegion', language) || 'Add Region')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('name', language)} ({t('english', language) || 'English'}) *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('enterRegionName', language) || 'Enter region name'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('name', language)} ({t('arabic', language) || 'Arabic'})
            </label>
            <input
              type="text"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('enterRegionNameAr', language) || 'Enter region name in Arabic'}
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('distanceUnit', language) || 'Distance Unit'}
              </label>
              <select
                value={formData.distanceUnit}
                onChange={(e) => setFormData({ ...formData, distanceUnit: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('timezone', language) || 'Timezone'}
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="UTC"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('status', language)}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {editingRegion ? t('update', language) : t('create', language)}
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

export default Regions


