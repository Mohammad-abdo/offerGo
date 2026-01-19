import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiMessageSquare, FiSend, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchSupports()
  }, [])

  useEffect(() => {
    if (selectedSupport && isChatModalOpen) {
      fetchChatHistory(selectedSupport.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchChatHistory(selectedSupport.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedSupport, isChatModalOpen])

  const fetchSupports = async () => {
    try {
      const response = await api.get('/customer-support')
      if (response.data.success) {
        setSupports(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customer supports:', error)
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
        setSelectedSupport({ ...selectedSupport, status })
      }
      showSuccess('Status updated successfully')
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
          if (selectedSupport?.id === id) {
            handleCloseChat()
          }
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
        return <FiCheckCircle className="text-green-500" size={16} />
      case 'inreview':
        return <FiClock className="text-yellow-500" size={16} />
      default:
        return <FiXCircle className="text-gray-500" size={16} />
    }
  }

  const filteredSupports = supports.filter(support => {
    const matchesSearch = !searchTerm || 
      support.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${support.user?.firstName} ${support.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || support.status === statusFilter
    return matchesSearch && matchesStatus
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('customerSupport', language) || 'Customer Support'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer support tickets and chat</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          New Support Ticket
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('search', language) + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="pending">Pending</option>
              <option value="inreview">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Support Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('actions', language)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSupports.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiMessageSquare size={48} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSupports.map((support) => (
                <tr key={support.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 dark:hover:from-blue-900/10 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {support.user?.firstName} {support.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{support.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                      {support.supportType || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {support.message || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(support.status)}
                      <span className="text-sm text-gray-900 dark:text-white capitalize">{support.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenChat(support)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors duration-200"
                        title="Open Chat"
                      >
                        <FiMessageSquare size={18} />
                      </button>
                      <ActionButtons
                        onDelete={() => handleDelete(support.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Support Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Support Ticket"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Support Type</label>
            <select
              value={formData.supportType}
              onChange={(e) => setFormData({ ...formData, supportType: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Type</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
              <option value="complaint">Complaint</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows="5"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
              {t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal */}
      {selectedSupport && (
        <Modal
          isOpen={isChatModalOpen}
          onClose={handleCloseChat}
          title={`Support Ticket #${selectedSupport.id} - ${selectedSupport.supportType || 'General'}`}
          size="lg"
        >
          <div className="flex flex-col h-[600px]">
            {/* Status Actions */}
            <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedSupport.status)}
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedSupport.status}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateStatus(selectedSupport.id, 'inreview')}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800"
                >
                  Mark In Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSupport.id, 'resolved')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderType === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </Modal>
      )}

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

export default CustomerSupport


