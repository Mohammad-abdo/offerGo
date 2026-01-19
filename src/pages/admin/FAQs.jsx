import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi'

const FAQs = () => {
  const { language } = useLanguage()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    type: 'rider',
    status: 1,
  })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const response = await api.get('/faqs/faq-list')
      if (response.data.success) {
        setFaqs(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq)
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        type: faq.type || 'rider',
        status: faq.status || 1,
      })
    } else {
      setEditingFaq(null)
      setFormData({
        question: '',
        answer: '',
        type: 'rider',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFaq(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingFaq) {
        await api.put(`/faqs/${editingFaq.id}`, formData)
      } else {
        await api.post('/faqs', formData)
      }
      fetchFaqs()
      handleCloseModal()
      showSuccess(editingFaq ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving FAQ:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/faqs/${id}`)
          fetchFaqs()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting FAQ:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = !searchTerm || 
      faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || faq.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('faqs', language)}</h1>
          <p className="text-gray-600 mt-1">{t('manageFrequentlyAskedQuestions', language)}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          {t('addFAQ', language)}
        </button>
      </div>

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
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">{t('type', language)}: {t('viewAll', language)}</option>
              <option value="rider">{t('rider', language)}</option>
              <option value="driver">{t('driver', language)}</option>
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
                {t('question', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('answer', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('type', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions', language)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFaqs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiSearch size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredFaqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{faq.question || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-md truncate">{faq.answer || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {faq.type === 'rider' ? t('rider', language) : t('driver', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        faq.status === 1
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {faq.status === 1 ? t('active', language) : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(faq)}
                      onDelete={() => handleDelete(faq.id)}
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
        title={editingFaq ? t('editFAQ', language) : t('addFAQ', language)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('type', language)}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="rider">{t('rider', language)}</option>
              <option value="driver">{t('driver', language)}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('question', language)}</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('answer', language)}</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status', language)}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingFaq ? t('update', language) : t('create', language)}
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

export default FAQs
