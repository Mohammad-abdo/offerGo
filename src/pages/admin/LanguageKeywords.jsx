import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import BulkActions from '../../components/BulkActions'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiGlobe } from 'react-icons/fi'

const LanguageKeywords = () => {
  const { language } = useLanguage()
  const [keywords, setKeywords] = useState([])
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState(null)
  const [formData, setFormData] = useState({
    languageId: '',
    keyword: '',
    value: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchKeywords()
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/language-lists')
      if (response.data.success) {
        setLanguages(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const fetchKeywords = async () => {
    try {
      const response = await api.get('/language-with-keywords')
      if (response.data.success) {
        setKeywords(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (keyword = null) => {
    if (keyword) {
      setEditingKeyword(keyword)
      setFormData({
        languageId: keyword.languageId?.toString() || '',
        keyword: keyword.keyword || '',
        value: keyword.value || '',
      })
    } else {
      setEditingKeyword(null)
      setFormData({
        languageId: '',
        keyword: '',
        value: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingKeyword(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingKeyword) {
        await api.put(`/language-with-keywords/${editingKeyword.id}`, formData)
      } else {
        await api.post('/language-with-keywords', formData)
      }
      fetchKeywords()
      handleCloseModal()
      showSuccess(editingKeyword ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving keyword:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/language-with-keywords/${id}`)
          fetchKeywords()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting keyword:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleImport = (data) => {
    if (data.success) {
      fetchKeywords()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = !searchTerm || 
      kw.keyword?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kw.value?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = languageFilter === 'all' || kw.languageId?.toString() === languageFilter
    return matchesSearch && matchesLanguage
  })

  const getLanguageName = (languageId) => {
    const lang = languages.find(l => l.id === parseInt(languageId))
    return lang?.name || languageId
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('languages', language)} - {t('keywords', language) || 'Keywords'}</h1>
          <p className="text-gray-600 mt-1">Manage translation keywords for all languages</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          {t('add', language)} {t('keyword', language) || 'Keyword'}
        </button>
      </div>

      {/* Bulk Actions with Import/Export */}
      <BulkActions
        selectedItems={[]}
        onBulkDelete={() => {}}
        onBulkStatusUpdate={() => {}}
        showDelete={false}
        showStatusUpdate={false}
        showExport={true}
        showImport={true}
        exportEndpoint="/language-with-keywords/export"
        importEndpoint="/language-with-keywords/import"
        importAccept=".csv"
        onImport={handleImport}
      />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('search', language) + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">{t('languages', language)}: {t('viewAll', language)}</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id.toString()}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('language', language) || 'Language'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('keyword', language) || 'Keyword'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('value', language) || 'Value'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions', language)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredKeywords.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiGlobe size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredKeywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{getLanguageName(kw.languageId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{kw.keyword || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-md truncate">{kw.value || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(kw)}
                      onDelete={() => handleDelete(kw.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingKeyword ? (t('edit', language) + ' ' + (t('keyword', language) || 'Keyword')) : (t('add', language) + ' ' + (t('keyword', language) || 'Keyword'))}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('language', language) || 'Language'}</label>
            <select
              value={formData.languageId}
              onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">{t('select', language) || 'Select Language'}</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id.toString()}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('keyword', language) || 'Keyword'}</label>
            <input
              type="text"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
              placeholder="e.g., dashboard, riders, drivers"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('value', language) || 'Value'}</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {editingKeyword ? t('update', language) : t('create', language)}
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

export default LanguageKeywords

