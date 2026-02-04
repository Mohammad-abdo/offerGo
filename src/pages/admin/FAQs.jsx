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
  FiHelpCircle,
  FiPlus,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiMessageCircle,
  FiUser,
} from 'react-icons/fi'

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
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/faqs/faq-list')
      if (response.data.success) {
        setFaqs(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const filteredFaqs = faqs.filter((faq) => {
    const search = searchTerm.toLowerCase()
    const question = (faq.question || '').toLowerCase()
    const answer = (faq.answer || '').toLowerCase()
    const matchesSearch =
      !searchTerm || question.includes(search) || answer.includes(search) || String(faq.id).includes(search)
    const matchesType = typeFilter === 'all' || faq.type === typeFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (faq.status === 1 || faq.status === '1')) ||
      (statusFilter === 'inactive' && (faq.status === 0 || faq.status === '0'))
    return matchesSearch && matchesType && matchesStatus
  })

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq)
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        type: faq.type || 'rider',
        status: faq.status ?? 1,
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
        showSuccess(t('updated', language))
      } else {
        await api.post('/faqs', formData)
        showSuccess(t('saved', language))
      }
      fetchFaqs()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/faqs/${id}`)
          fetchFaqs()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting FAQ:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const totalCount = faqs.length
  const riderCount = faqs.filter((f) => f.type === 'rider').length
  const driverCount = faqs.filter((f) => f.type === 'driver').length
  const activeCount = faqs.filter((f) => f.status === 1 || f.status === '1').length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الأسئلة' : 'Total FAQs',
      value: totalCount,
      icon: FiHelpCircle,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'للركاب' : 'For riders',
      value: riderCount,
      icon: FiUser,
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: language === 'ar' ? 'للسائقين' : 'For drivers',
      value: driverCount,
      icon: FiMessageCircle,
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  ]

  if (loading && faqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل الأسئلة الشائعة...' : 'Loading FAQs...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('faqs', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('manageFrequentlyAskedQuestions', language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchFaqs}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
          >
            <FiPlus size={18} />
            {t('addFAQ', language)}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border ${stat.borderColor} overflow-hidden shadow-sm ${stat.bgLight}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search', language) + '...'}
                language={language}
              />
            </div>
            <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} language={language}>
              <option value="all">{t('type', language)}: {t('viewAll', language)}</option>
              <option value="rider">{t('rider', language)}</option>
              <option value="driver">{t('driver', language)}</option>
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="active">{t('active', language)}</option>
              <option value="inactive">{t('inactive', language)}</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'بطاقات' : 'Cards'}
            >
              <FiGrid size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'جدول' : 'Table'}
            >
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* FAQs: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiHelpCircle className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة الأسئلة الشائعة' : 'FAQs list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredFaqs.length} {language === 'ar' ? 'سؤال' : 'question(s)'}
          </p>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiHelpCircle className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noData', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {language === 'ar'
                ? 'لا توجد أسئلة شائعة. أضف أسئلة للركاب أو السائقين.'
                : 'No FAQs yet. Add questions for riders or drivers.'}
            </p>
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                {t('tryAdjustingYourSearch', language)}
              </p>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1" title={faq.question}>
                    #{faq.id} — {faq.question}
                  </p>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      faq.type === 'rider'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                    }`}
                  >
                    {faq.type === 'rider' ? t('rider', language) : t('driver', language)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{faq.answer}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                      faq.status === 1 || faq.status === '1'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {faq.status === 1 || faq.status === '1' ? t('active', language) : t('inactive', language)}
                  </span>
                  <div className="flex items-center gap-1">
                    <ActionButtons
                      onEdit={() => handleOpenModal(faq)}
                      onDelete={() => handleDelete(faq.id)}
                      showView={false}
                      showEdit={true}
                      showDelete={true}
                      forceShowIcons={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>#</TableHeader>
                  <TableHeader language={language}>{t('question', language)}</TableHeader>
                  <TableHeader language={language}>{t('answer', language)}</TableHeader>
                  <TableHeader language={language}>{t('type', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredFaqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{faq.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white max-w-xs truncate">{faq.question}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">{faq.answer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          faq.type === 'rider'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                        }`}
                      >
                        {faq.type === 'rider' ? t('rider', language) : t('driver', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                          faq.status === 1 || faq.status === '1'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {faq.status === 1 || faq.status === '1' ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionButtons
                        onEdit={() => handleOpenModal(faq)}
                        onDelete={() => handleDelete(faq.id)}
                        showView={false}
                        showEdit={true}
                        showDelete={true}
                        forceShowIcons={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit FAQ */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFaq ? t('editFAQ', language) : t('addFAQ', language)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('type', language)}
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="rider">{t('rider', language)}</option>
              <option value="driver">{t('driver', language)}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('question', language)}
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('answer', language)}
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('status', language)}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              {editingFaq ? t('update', language) : t('create', language)}
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

export default FAQs
