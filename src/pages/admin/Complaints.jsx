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
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiUser,
  FiMessageSquare,
  FiCalendar,
} from 'react-icons/fi'

const Complaints = () => {
  const { language } = useLanguage()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [complaintByFilter, setComplaintByFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [detailModal, setDetailModal] = useState({ open: false, item: null })
  const [statusInModal, setStatusInModal] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const response = await api.get('/complaints')
      if (response.data.success) {
        setComplaints(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    const search = searchTerm.toLowerCase()
    const subject = (c.subject || '').toLowerCase()
    const description = (c.description || '').toLowerCase()
    const by = (c.complaintBy || '').toLowerCase()
    const riderName = c.rider ? `${c.rider.firstName || ''} ${c.rider.lastName || ''}`.toLowerCase() : ''
    const driverName = c.driver ? `${c.driver.firstName || ''} ${c.driver.lastName || ''}`.toLowerCase() : ''
    const matchesSearch =
      !searchTerm ||
      subject.includes(search) ||
      description.includes(search) ||
      by.includes(search) ||
      riderName.includes(search) ||
      driverName.includes(search) ||
      String(c.id).includes(search)
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    const matchesBy = complaintByFilter === 'all' || c.complaintBy === complaintByFilter
    return matchesSearch && matchesStatus && matchesBy
  })

  const handleOpenDetail = (item) => {
    setDetailModal({ open: true, item })
    setStatusInModal(item?.status || 'pending')
  }

  const handleCloseDetail = () => setDetailModal({ open: false, item: null })

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status })
      showSuccess(t('updated', language))
      fetchComplaints()
      if (detailModal.item?.id === id) {
        setDetailModal((prev) => (prev.item ? { ...prev, item: { ...prev.item, status } } : prev))
        setStatusInModal(status)
      }
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/complaints/${id}`)
          showSuccess(t('deleted', language))
          fetchComplaints()
          handleCloseDetail()
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const getStatusStyle = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
      resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    }
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const totalCount = complaints.length
  const pendingCount = complaints.filter((c) => c.status === 'pending').length
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الشكاوى' : 'Total complaints',
      value: totalCount,
      icon: FiMessageSquare,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      value: pendingCount,
      icon: FiClock,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: language === 'ar' ? 'تم الحل' : 'Resolved',
      value: resolvedCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
  ]

  if (loading && complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل الشكاوى...' : 'Loading complaints...'}
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
            {t('complaints', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar'
              ? 'إدارة شكاوى الركاب والسائقين — عرض التفاصيل، تحديث الحالة، والرد على الشكاوى.'
              : 'Manage rider and driver complaints — view details, update status, and respond to complaints.'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchComplaints}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FiRefreshCw size={18} />
          {t('refresh', language)}
        </button>
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
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="in_progress">{language === 'ar' ? 'قيد المعالجة' : 'In Progress'}</option>
              <option value="resolved">{language === 'ar' ? 'تم الحل' : 'Resolved'}</option>
              <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
            </FilterSelect>
            <FilterSelect value={complaintByFilter} onChange={(e) => setComplaintByFilter(e.target.value)} language={language}>
              <option value="all">{t('complaintBy', language)}: {t('viewAll', language)}</option>
              <option value="rider">{t('rider', language)}</option>
              <option value="driver">{t('driver', language)}</option>
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

      {/* Complaints: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAlertCircle className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة الشكاوى' : 'Complaints list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredComplaints.length} {language === 'ar' ? 'شكوى' : 'complaint(s)'}
          </p>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiMessageSquare className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {language === 'ar' ? 'لا توجد شكاوى' : 'No complaints yet'}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {language === 'ar'
                ? 'ستظهر هنا الشكاوى المقدمة من الركاب أو السائقين.'
                : 'Complaints submitted by riders or drivers will appear here.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate" title={c.subject}>
                      #{c.id} — {c.subject}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(c.status)}`}>
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1 capitalize">
                    <FiUser size={14} />
                    {c.complaintBy === 'rider' ? t('rider', language) : t('driver', language)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar size={14} />
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                {(c.rider || c.driver) && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {c.rider && `${c.rider.firstName || ''} ${c.rider.lastName || ''}`}
                    {c.driver && `${c.driver.firstName || ''} ${c.driver.lastName || ''}`}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons
                    onView={() => handleOpenDetail(c)}
                    onEdit={() => handleOpenDetail(c)}
                    onDelete={() => handleDelete(c.id)}
                    showView={true}
                    showEdit={true}
                    showDelete={true}
                    forceShowIcons={true}
                  />
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
                  <TableHeader language={language}>{t('subject', language)}</TableHeader>
                  <TableHeader language={language}>{t('complaintBy', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{c.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{c.subject}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{c.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">{c.complaintBy}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(c.status)}`}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <ActionButtons
                        onView={() => handleOpenDetail(c)}
                        onEdit={() => handleOpenDetail(c)}
                        onDelete={() => handleDelete(c.id)}
                        showView={true}
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

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={handleCloseDetail}
        title={language === 'ar' ? 'تفاصيل الشكوى' : 'Complaint details'}
        size="lg"
      >
        {detailModal.item && (
          <div className="space-y-5">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('subject', language)}</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{detailModal.item.subject}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('description', language)}</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailModal.item.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('complaintBy', language)}</p>
                <p className="mt-0.5 font-medium text-gray-900 dark:text-white capitalize">{detailModal.item.complaintBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('status', language)}</p>
                <select
                  value={statusInModal}
                  onChange={(e) => {
                    const v = e.target.value
                    setStatusInModal(v)
                    handleUpdateStatus(detailModal.item.id, v)
                  }}
                  className="mt-0.5 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                  <option value="in_progress">{language === 'ar' ? 'قيد المعالجة' : 'In Progress'}</option>
                  <option value="resolved">{language === 'ar' ? 'تم الحل' : 'Resolved'}</option>
                  <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
                </select>
              </div>
            </div>
            {(detailModal.item.rider || detailModal.item.driver) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailModal.item.rider && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('rider', language)}</p>
                    <p className="mt-0.5 font-medium text-gray-900 dark:text-white">
                      {detailModal.item.rider.firstName} {detailModal.item.rider.lastName}
                    </p>
                    {detailModal.item.rider.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{detailModal.item.rider.email}</p>
                    )}
                  </div>
                )}
                {detailModal.item.driver && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('driver', language)}</p>
                    <p className="mt-0.5 font-medium text-gray-900 dark:text-white">
                      {detailModal.item.driver.firstName} {detailModal.item.driver.lastName}
                    </p>
                    {detailModal.item.driver.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{detailModal.item.driver.email}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {detailModal.item.rideRequest && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الرحلة' : 'Ride'}</p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                  {detailModal.item.rideRequest.startAddress || '-'} → {detailModal.item.rideRequest.endAddress || '-'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleDelete(detailModal.item.id)}
                className="px-5 py-2.5 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                {t('delete', language)}
              </button>
              <button type="button" onClick={handleCloseDetail} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}
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

export default Complaints
