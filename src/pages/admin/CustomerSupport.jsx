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
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiGrid,
  FiList,
  FiUser,
} from 'react-icons/fi'

const CustomerSupport = () => {
  const { language } = useLanguage()
  const [supports, setSupports] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [selectedSupport, setSelectedSupport] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [formData, setFormData] = useState({
    message: '',
    supportType: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchSupports()
  }, [])

  useEffect(() => {
    if (selectedSupport && isChatModalOpen) {
      fetchChatHistory(selectedSupport.id)
      const interval = setInterval(() => fetchChatHistory(selectedSupport.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedSupport, isChatModalOpen])

  const fetchSupports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/customer-support')
      if (response.data.success) {
        setSupports(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customer supports:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async (supportId) => {
    try {
      const response = await api.get(`/support-chat-history/${supportId}`)
      if (response.data.success) {
        setChatMessages(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const handleOpenModal = () => {
    setFormData({ message: '', supportType: '' })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleOpenChat = (support) => {
    setSelectedSupport(support)
    setIsChatModalOpen(true)
  }

  const handleCloseChat = () => {
    setIsChatModalOpen(false)
    setSelectedSupport(null)
    setChatMessages([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/customer-support', formData)
      fetchSupports()
      handleCloseModal()
      showSuccess(t('saved', language))
    } catch (error) {
      console.error('Error creating customer support:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      await api.post('/support-chat-history', {
        supportId: selectedSupport.id,
        message: newMessage,
      })
      setNewMessage('')
      fetchChatHistory(selectedSupport.id)
    } catch (error) {
      console.error('Error sending message:', error)
      showError(error.response?.data?.message || 'Failed to send message')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/customer-support/${id}/status`, { status })
      fetchSupports()
      if (selectedSupport?.id === id) {
        setSelectedSupport((prev) => (prev ? { ...prev, status } : null))
      }
      showSuccess(language === 'ar' ? 'تم تحديث الحالة' : 'Status updated successfully')
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/customer-support/${id}`)
          fetchSupports()
          if (selectedSupport?.id === id) handleCloseChat()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting customer support:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <FiCheckCircle className="text-emerald-500" size={16} />
      case 'inreview':
        return <FiClock className="text-amber-500" size={16} />
      default:
        return <FiXCircle className="text-gray-500" size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      case 'inreview':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredSupports = supports.filter((support) => {
    const matchesSearch =
      !searchTerm ||
      (support.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${support.user?.firstName || ''} ${support.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || support.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = supports.length
  const pendingCount = supports.filter((s) => s.status === 'pending').length
  const inReviewCount = supports.filter((s) => s.status === 'inreview').length
  const resolvedCount = supports.filter((s) => s.status === 'resolved').length

  const statCards = [
    { label: language === 'ar' ? 'إجمالي التذاكر' : 'Total tickets', value: totalCount, icon: FiMessageSquare, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', value: pendingCount, icon: FiClock, bgLight: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800' },
    { label: language === 'ar' ? 'قيد المراجعة' : 'In Review', value: inReviewCount, icon: FiMessageSquare, bgLight: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
    { label: language === 'ar' ? 'تم الحل' : 'Resolved', value: resolvedCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
  ]

  if (loading && supports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل تذاكر الدعم...' : 'Loading support tickets...'}
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
            {t('customerSupport', language) || 'Customer Support'}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar' ? 'إدارة تذاكر الدعم الفني والمحادثة.' : 'Manage customer support tickets and chat.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSupports}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors"
          >
            <FiPlus size={20} />
            {language === 'ar' ? 'تذكرة جديدة' : 'New Support Ticket'}
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

      {/* Search + filter + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search', language) + '...'} language={language} />
            </div>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="pending">Pending</option>
              <option value="inreview">In Review</option>
              <option value="resolved">Resolved</option>
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

      {/* Support list: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMessageSquare className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة التذاكر' : 'Support tickets list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredSupports.length} {language === 'ar' ? 'تذكرة' : 'ticket(s)'}</p>
        </div>

        {filteredSupports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiMessageSquare className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSupports.map((support) => (
              <div key={support.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                      <FiUser size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{support.user?.firstName} {support.user?.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{support.user?.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(support.status)}`}>{support.status}</span>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</p>
                <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 mb-3">{support.supportType || 'General'}</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{support.message || '-'}</p>
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button type="button" onClick={() => handleOpenChat(support)} className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors inline-flex items-center gap-1">
                    <FiMessageSquare size={16} />
                    {language === 'ar' ? 'محادثة' : 'Chat'}
                  </button>
                  <ActionButtons onDelete={() => handleDelete(support.id)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>{language === 'ar' ? 'المستخدم' : 'User'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'نوع الدعم' : 'Support Type'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'الرسالة' : 'Message'}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredSupports.map((support) => (
                  <tr key={support.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{support.user?.firstName} {support.user?.lastName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{support.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200">{support.supportType || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 dark:text-white truncate">{support.message || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(support.status)}
                        <span className={`text-sm font-medium capitalize ${getStatusColor(support.status)}`}>{support.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenChat(support)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title="Open Chat">
                          <FiMessageSquare size={18} />
                        </button>
                        <ActionButtons onDelete={() => handleDelete(support.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Support Ticket Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={language === 'ar' ? 'تذكرة دعم جديدة' : 'New Support Ticket'} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'نوع الدعم' : 'Support Type'}</label>
            <select value={formData.supportType} onChange={(e) => setFormData({ ...formData, supportType: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500">
              <option value="">Select Type</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
              <option value="complaint">Complaint</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={5} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">{t('cancel', language)}</button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">{t('create', language)}</button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal */}
      {selectedSupport && (
        <Modal isOpen={isChatModalOpen} onClose={handleCloseChat} title={`#${selectedSupport.id} - ${selectedSupport.supportType || 'General'}`} size="lg">
          <div className="flex flex-col h-[600px]">
            <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedSupport.status)}
                <span className={`text-sm font-medium capitalize ${getStatusColor(selectedSupport.status)}`}>{selectedSupport.status}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleUpdateStatus(selectedSupport.id, 'inreview')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800">
                  {language === 'ar' ? 'قيد المراجعة' : 'Mark In Review'}
                </button>
                <button type="button" onClick={() => handleUpdateStatus(selectedSupport.id, 'resolved')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                  {language === 'ar' ? 'تم الحل' : 'Mark Resolved'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderType === 'admin' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
              <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors">
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </Modal>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })} onConfirm={confirmDialog.onConfirm || (() => {})} message={confirmDialog.message} type="danger" />
    </div>
  )
}

export default CustomerSupport
