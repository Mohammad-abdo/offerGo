import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiUser, FiStar } from 'react-icons/fi'

const ClientTestimonials = () => {
  const { language } = useLanguage()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    subtitle: '',
    subtitleAr: '',
    description: '',
    descriptionAr: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/frontend-data?type=client_testimonials')
      if (response.data.success) {
        setTestimonials(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching client testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (testimonial = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial)
      setFormData({
        title: testimonial.title || '',
        titleAr: testimonial.titleAr || '',
        subtitle: testimonial.subtitle || '',
        subtitleAr: testimonial.subtitleAr || '',
        description: testimonial.description || '',
        descriptionAr: testimonial.descriptionAr || '',
      })
    } else {
      setEditingTestimonial(null)
      setFormData({
        title: '',
        titleAr: '',
        subtitle: '',
        subtitleAr: '',
        description: '',
        descriptionAr: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTestimonial(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        type: 'client_testimonials',
      }
      if (editingTestimonial) {
        await api.put(`/frontend-data/${editingTestimonial.id}`, submitData)
      } else {
        await api.post('/frontend-data', submitData)
      }
      fetchTestimonials()
      handleCloseModal()
      showSuccess(editingTestimonial ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving testimonial:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/frontend-data/${id}`)
          fetchTestimonials()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting testimonial:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredTestimonials = testimonials.filter(testimonial => {
    return !searchTerm || 
      testimonial.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.description?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('clientTestimonials', language) || 'Client Testimonials'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage client testimonials</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          Add Testimonial
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search', language) + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-2">
              <FiUser size={48} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 animate-scale-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    <FiUser size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'ar' ? testimonial.titleAr || testimonial.title : testimonial.title}
                    </h3>
                    {testimonial.subtitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? testimonial.subtitleAr || testimonial.subtitle : testimonial.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={16} fill="currentColor" />
                  ))}
                </div>
              </div>

              {testimonial.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4 italic">
                  "{language === 'ar' ? testimonial.descriptionAr || testimonial.description : testimonial.description}"
                </p>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <ActionButtons
                  onEdit={() => handleOpenModal(testimonial)}
                  onDelete={() => handleDelete(testimonial.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTestimonial ? 'Edit Client Testimonial' : 'Add Client Testimonial'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client Name (EN)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client Name (AR)</label>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Position/Company (EN)</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Position/Company (AR)</label>
              <input
                type="text"
                value={formData.subtitleAr}
                onChange={(e) => setFormData({ ...formData, subtitleAr: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Testimonial (EN)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="5"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Testimonial (AR)</label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows="5"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {editingTestimonial ? t('update', language) : t('create', language)}
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

export default ClientTestimonials


