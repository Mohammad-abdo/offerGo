import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiBell, FiSend, FiTrash2, FiGrid, FiList, FiRefreshCw } from 'react-icons/fi'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'

const Notifications = () => {
  const { language } = useLanguage()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    userType: 'all',
    userId: '',
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/push-notifications')
      if (response.data.success) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    try {
      await api.post('/push-notifications', {
        title: formData.title,
        message: formData.message,
        user_type: formData.userType,
        user_ids: formData.userId ? [formData.userId] : null,
      })
      await fetchNotifications()
      setIsModalOpen(false)
      setFormData({ title: '', message: '', userType: 'all', userId: '' })
      showSuccess(language === 'ar' ? 'تم إرسال الإشعار' : 'Notification sent')
    } catch (error) {
      console.error('Error sending notification:', error)
      showError(error.response?.data?.message || 'Failed to send notification')
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/push-notifications/${id}`)
          await fetchNotifications()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting notification:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredNotifications = notifications.filter((n) => {
    const search = searchTerm.toLowerCase()
    return !searchTerm || (n.title || '').toLowerCase().includes(search) || (n.message || '').toLowerCase().includes(search) || (n.userType || '').toLowerCase().includes(search)
  })

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
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
            {t('notifications', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar' ? 'إدارة الإشعارات الدفعية وإرسالها للمستخدمين.' : 'Manage and send push notifications to users.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchNotifications}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors"
          >
            <FiSend size={18} />
            {language === 'ar' ? 'إرسال إشعار' : 'Send Notification'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/30">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'إجمالي الإشعارات المرسلة' : 'Total notifications sent'}
              </span>
              <FiBell className="text-slate-600 dark:text-slate-400" size={28} />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
          </div>
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search', language) + '...'}
              language={language}
            />
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

      {/* Notifications list: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBell className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة الإشعارات' : 'Notifications list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredNotifications.length} {language === 'ar' ? 'إشعار' : 'notification(s)'}</p>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiBell className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm ? (t('tryAdjustingYourSearch', language) || 'Try adjusting your search') : (language === 'ar' ? 'لم يتم إرسال أي إشعارات بعد.' : 'No notifications sent yet.')}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{notification.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{notification.message}</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200">
                    {notification.userType || 'All'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => handleDelete(notification.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}>
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>{language === 'ar' ? 'العنوان' : 'Title'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'الرسالة' : 'Message'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'الهدف' : 'Target'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{notification.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">{notification.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200">
                        {notification.userType || 'All'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button type="button" onClick={() => handleDelete(notification.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}>
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={language === 'ar' ? 'إرسال إشعار دفعي' : 'Send Push Notification'} size="md">
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'العنوان' : 'Title'} *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'الرسالة' : 'Message'} *</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={4} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'المستخدمون المستهدفون' : 'Target Users'}</label>
            <select value={formData.userType} onChange={(e) => setFormData({ ...formData, userType: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500">
              <option value="all">All Users</option>
              <option value="rider">Riders Only</option>
              <option value="driver">Drivers Only</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">{t('cancel', language)}</button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">{language === 'ar' ? 'إرسال الإشعار' : 'Send Notification'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })} onConfirm={confirmDialog.onConfirm || (() => {})} message={confirmDialog.message} type="danger" />
    </div>
  )
}

export default Notifications
