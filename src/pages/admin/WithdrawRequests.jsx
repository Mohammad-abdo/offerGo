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
  FiSearch,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiCreditCard,
  FiCalendar,
} from 'react-icons/fi'

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
  const [viewMode, setViewMode] = useState('cards')

  useEffect(() => {
    fetchWithdrawRequests()
  }, [])

  const fetchWithdrawRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/withdraw-requests/withdrawrequest-list')
      if (response.data.success) {
        setWithdrawRequests(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching withdraw requests:', error)
      showError(error.response?.data?.message || t('failed', language))
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
      status: request.status ?? 0,
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
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      case 1:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      case 2:
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredRequests = withdrawRequests.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(request.amount || '').includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || request.status?.toString() === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = withdrawRequests.length
  const pendingCount = withdrawRequests.filter((r) => r.status === 0).length
  const approvedCount = withdrawRequests.filter((r) => r.status === 1).length
  const rejectedCount = withdrawRequests.filter((r) => r.status === 2).length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الطلبات' : 'Total requests',
      value: totalCount,
      icon: FiCreditCard,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: t('pending', language),
      value: pendingCount,
      icon: FiClock,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: t('approved', language),
      value: approvedCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: t('rejected', language),
      value: rejectedCount,
      icon: FiXCircle,
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  ]

  if (loading && withdrawRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل طلبات السحب...' : 'Loading withdraw requests...'}
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
            {t('withdrawRequests', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar'
              ? 'إدارة طلبات السحب من السائقين — عرض الطلبات، الموافقة أو الرفض.'
              : 'Manage withdrawal requests from drivers — view, approve or reject requests.'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWithdrawRequests}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FiRefreshCw size={18} />
          {t('refresh', language)}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              language={language}
            >
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="0">{t('pending', language)}</option>
              <option value="1">{t('approved', language)}</option>
              <option value="2">{t('rejected', language)}</option>
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

      {/* Withdraw requests: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCreditCard className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة طلبات السحب' : 'Withdraw requests list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredRequests.length} {language === 'ar' ? 'طلب' : 'request(s)'}
          </p>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiDollarSign className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noData', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {language === 'ar' ? 'لا توجد طلبات سحب.' : 'No withdraw requests found.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
                      {(request.user?.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {request.user?.firstName || ''} {request.user?.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {request.user?.email || '-'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(request.status)}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-1.5">
                    <FiDollarSign className="text-emerald-500" size={18} />
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {parseFloat(request.amount || 0).toFixed(2)} {request.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(request)}
                      className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      title={t('update', language) + ' ' + t('status', language)}
                    >
                      <FiCheckCircle size={18} />
                    </button>
                    <ActionButtons
                      onEdit={() => handleOpenModal(request)}
                      onDelete={() => handleDelete(request.id)}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FiCalendar size={12} />
                  {request.createdAt
                    ? new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                    : '-'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>{t('name', language)}</TableHeader>
                  <TableHeader language={language}>{t('email', language)}</TableHeader>
                  <TableHeader language={language}>{t('amount', language)}</TableHeader>
                  <TableHeader language={language}>{t('currency', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('requestDate', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
                          {(request.user?.firstName?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.user?.firstName || ''} {request.user?.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{request.user?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {request.user?.email || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(request.amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {request.currency || 'USD'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(request.status)}`}
                      >
                        {request.status === 1 && <FiCheckCircle size={12} />}
                        {request.status === 2 && <FiXCircle size={12} />}
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(request)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title={t('update', language) + ' ' + t('status', language)}
                        >
                          <FiCheckCircle size={18} />
                        </button>
                        <ActionButtons
                          onEdit={() => handleOpenModal(request)}
                          onDelete={() => handleDelete(request.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingRequest
            ? t('edit', language) + ' ' + t('withdrawRequests', language)
            : t('add', language) + ' ' + t('withdrawRequests', language)
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('amount', language)} *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('currency', language)}
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
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
        <form onSubmit={handleStatusSubmit} className="space-y-5">
          {selectedRequest && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'الطلب' : 'Request'}
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {selectedRequest.user?.firstName} {selectedRequest.user?.lastName} — {parseFloat(selectedRequest.amount || 0).toFixed(2)} {selectedRequest.currency || 'USD'}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('status', language)}
            </label>
            <select
              value={statusFormData.status}
              onChange={(e) => setStatusFormData({ ...statusFormData, status: parseInt(e.target.value, 10) })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value={0}>{t('pending', language)}</option>
              <option value={1}>{t('approved', language)}</option>
              <option value={2}>{t('rejected', language)}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseStatusModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
            >
              {t('update', language)}
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

export default WithdrawRequests
