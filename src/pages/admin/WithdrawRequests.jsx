import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiFilter, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const WithdrawRequests = () => {
  const { language } = useLanguage()
  const [withdrawRequests, setWithdrawRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
  })
  const [statusFormData, setStatusFormData] = useState({
    status: 0,
  })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchWithdrawRequests()
  }, [])

  const fetchWithdrawRequests = async () => {
    try {
      const response = await api.get('/withdraw-requests/withdrawrequest-list')
      if (response.data.success) {
        setWithdrawRequests(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching withdraw requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (request = null) => {
    if (request) {
      setEditingRequest(request)
      setFormData({
        amount: request.amount || '',
        currency: request.currency || 'USD',
      })
    } else {
      setEditingRequest(null)
      setFormData({
        amount: '',
        currency: 'USD',
      })
    }
    setIsModalOpen(true)
  }

  const handleOpenStatusModal = (request) => {
    setSelectedRequest(request)
    setStatusFormData({
      status: request.status || 0,
    })
    setIsStatusModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRequest(null)
  }

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false)
    setSelectedRequest(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRequest) {
        await api.put(`/withdraw-requests/${editingRequest.id}`, formData)
      } else {
        await api.post('/withdraw-requests/save-withdrawrequest', formData)
      }
      fetchWithdrawRequests()
      handleCloseModal()
      showSuccess(editingRequest ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving withdraw request:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/withdraw-requests/update-status/${selectedRequest.id}`, statusFormData)
      fetchWithdrawRequests()
      handleCloseStatusModal()
      showSuccess(t('updated', language))
    } catch (error) {
      console.error('Error updating status:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/withdraw-requests/${id}`)
          fetchWithdrawRequests()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting withdraw request:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return t('pending', language)
      case 1:
        return t('approved', language)
      case 2:
        return t('rejected', language)
      default:
        return t('pending', language)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return 'bg-yellow-100 text-yellow-800'
      case 1:
        return 'bg-green-100 text-green-800'
      case 2:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = withdrawRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      `${request.user?.firstName} ${request.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status.toString() === statusFilter
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
          <h1 className="text-3xl font-bold text-gray-900">{t('withdrawRequests', language)}</h1>
          <p className="text-gray-600 mt-1">Manage withdrawal requests from drivers</p>
        </div>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="0">{t('pending', language)}</option>
              <option value="1">{t('approved', language)}</option>
              <option value="2">{t('rejected', language)}</option>
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
                {t('name', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('email', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('amount', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('currency', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('requestDate', language)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions', language)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiDollarSign size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {(request.user?.firstName?.[0] || '').toUpperCase()}{(request.user?.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {request.user?.firstName || ''} {request.user?.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500">{request.user?.email || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{request.user?.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiDollarSign className="text-green-600 mr-1" size={16} />
                      <div className="text-sm font-semibold text-gray-900">
                        {parseFloat(request.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono">{request.currency || 'USD'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status === 1 && <FiCheckCircle className="mr-1" size={12} />}
                      {request.status === 2 && <FiXCircle className="mr-1" size={12} />}
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenStatusModal(request)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 group relative"
                        title="Update Status"
                      >
                        <FiCheckCircle size={18} />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Status
                        </span>
                      </button>
                      <ActionButtons
                        onEdit={() => handleOpenModal(request)}
                        onDelete={() => handleDelete(request.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRequest ? t('edit', language) + ' ' + t('withdrawRequests', language) : t('add', language) + ' ' + t('withdrawRequests', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount', language)}</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency', language)}</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
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
              {editingRequest ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        title={t('update', language) + ' ' + t('status', language)}
        size="md"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status', language)}</label>
            <select
              value={statusFormData.status}
              onChange={(e) => setStatusFormData({ ...statusFormData, status: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={0}>{t('pending', language)}</option>
              <option value={1}>{t('approved', language)}</option>
              <option value={2}>{t('rejected', language)}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseStatusModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('update', language)}
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

export default WithdrawRequests
