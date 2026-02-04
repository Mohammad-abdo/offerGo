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
  FiAlertTriangle,
  FiPhone,
  FiGrid,
  FiList,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'

const SOS = () => {
  const { language } = useLanguage()
  const [sosContacts, setSosContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSos, setEditingSos] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    status: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchSosContacts()
  }, [])

  const fetchSosContacts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/sos/sos-list')
      if (response.data.success) {
        setSosContacts(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching SOS contacts:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (sos = null) => {
    if (sos) {
      setEditingSos(sos)
      setFormData({
        name: sos.name || '',
        contactNumber: sos.contactNumber || '',
        status: sos.status ?? 1,
      })
    } else {
      setEditingSos(null)
      setFormData({
        name: '',
        contactNumber: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSos(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSos) {
        await api.post(`/sos/sos-update/${editingSos.id}`, formData)
      } else {
        await api.post('/sos/save-sos', formData)
      }
      fetchSosContacts()
      handleCloseModal()
      showSuccess(editingSos ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving SOS contact:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.post(`/sos/sos-delete/${id}`)
          fetchSosContacts()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting SOS contact:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredContacts = sosContacts.filter((contact) => {
    const matchesSearch =
      !searchTerm ||
      (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.contactNumber || '').includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || String(contact.status) === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = sosContacts.length
  const activeCount = sosContacts.filter((c) => c.status === 1).length
  const inactiveCount = sosContacts.filter((c) => c.status !== 1).length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي جهات الاتصال' : 'Total contacts',
      value: totalCount,
      icon: FiAlertTriangle,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: t('active', language),
      value: activeCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: t('inactive', language),
      value: inactiveCount,
      icon: FiXCircle,
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  ]

  if (loading && sosContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل جهات اتصال الطوارئ...' : 'Loading SOS contacts...'}
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
            {t('sos', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar' ? 'إدارة جهات اتصال الطوارئ (SOS).' : 'Manage emergency SOS contacts.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSosContacts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-lg transition-colors"
          >
            <FiPlus size={20} />
            {language === 'ar' ? 'إضافة جهة اتصال' : 'Add SOS Contact'}
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

      {/* Search + filter + view toggle */}
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
              <option value="1">{t('active', language)}</option>
              <option value="0">{t('inactive', language)}</option>
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

      {/* SOS list: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" size={24} />
            {language === 'ar' ? 'قائمة جهات اتصال الطوارئ' : 'SOS contacts list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredContacts.length} {language === 'ar' ? 'جهة اتصال' : 'contact(s)'}
          </p>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <FiAlertTriangle className="text-red-500 dark:text-red-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noData', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm ? (t('tryAdjustingYourSearch', language) || 'Try adjusting your search') : (language === 'ar' ? 'أضف جهة اتصال طوارئ.' : 'Add an SOS contact.')}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">
                      <FiAlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {contact.name || (language === 'ar' ? 'بدون اسم' : 'Unnamed')}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">SOS Contact</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                      contact.status === 1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {contact.status === 1 ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
                  <FiPhone className="text-red-600 dark:text-red-400 shrink-0" size={18} />
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {contact.contactNumber || '-'}
                  </p>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                  <ActionButtons
                    onEdit={() => handleOpenModal(contact)}
                    onDelete={() => handleDelete(contact.id)}
                    size="sm"
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
                  <TableHeader language={language}>{t('name', language)}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'رقم الاتصال' : 'Contact Number'}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">
                          <FiAlertTriangle size={18} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {contact.name || (language === 'ar' ? 'بدون اسم' : 'Unnamed')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {contact.contactNumber || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                          contact.status === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {contact.status === 1 ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionButtons
                        onEdit={() => handleOpenModal(contact)}
                        onDelete={() => handleDelete(contact.id)}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSos ? (language === 'ar' ? 'تعديل جهة اتصال' : 'Edit SOS Contact') : (language === 'ar' ? 'إضافة جهة اتصال' : 'Add SOS Contact')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'ar' ? 'اسم جهة الاتصال' : 'Contact Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'ar' ? 'رقم الاتصال' : 'Contact Number'}
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('status', language)}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value, 10) })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
            >
              {editingSos ? t('update', language) : t('create', language)}
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

export default SOS
