import { useState, useEffect } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import ResponsiveTable from '../../components/ResponsiveTable'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi'

const Regions = () => {
  const { language } = useLanguage()
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState(null)
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
      showError(error.response?.data?.message || t('failed', language) || 'Operation failed')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('regions', language)}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('manage_regions', language) || 'Manage and monitor all regions'}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={18} />
          <span className="hidden sm:inline">{t('add', language)} {t('regions', language)}</span>
          <span className="sm:hidden">{t('add', language)}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ResponsiveTable>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <TableHeader language={language}>{t('name', language)}</TableHeader>
              <TableHeader language={language} className="hidden sm:table-cell">{t('distanceUnit', language) || 'Distance Unit'}</TableHeader>
              <TableHeader language={language} className="hidden md:table-cell">{t('timezone', language) || 'Timezone'}</TableHeader>
              <TableHeader language={language}>{t('status', language)}</TableHeader>
              <TableHeader language={language}>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {regions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FiMapPin className="text-gray-400 dark:text-gray-500 mb-2" size={40} />
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
                  </div>
                </td>
              </tr>
            ) : (
              regions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center min-w-0">
                      <FiMapPin className="mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block truncate">
                          {language === 'ar' && region.nameAr ? region.nameAr : region.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                          {region.distanceUnit || 'km'} • {region.timezone || 'UTC'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{region.distanceUnit || 'km'}</span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{region.timezone || 'UTC'}</span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      region.status === 1 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                    }`}>
                      {region.status === 1 ? t('active', language) : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleOpenModal(region)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title={t('edit', language)}
                      >
                        <FiEdit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(region.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('delete', language)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
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

