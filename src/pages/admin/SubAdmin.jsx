import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiGrid,
  FiList,
} from 'react-icons/fi'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { showSuccess, showError } from '../../utils/toast'

const SubAdmin = () => {
  const { language } = useLanguage()
  const [subAdmins, setSubAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubAdmin, setEditingSubAdmin] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    countryCode: '+1',
    userType: 'sub_admin',
  })

  useEffect(() => {
    fetchSubAdmins()
  }, [])

  const fetchSubAdmins = async () => {
    try {
      setLoading(true)
      const response = await api.get('/sub-admin')
      if (response.data.success) {
        setSubAdmins(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching sub-admins:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (subAdmin = null) => {
    if (subAdmin) {
      setEditingSubAdmin(subAdmin)
      setFormData({
        firstName: subAdmin.firstName || '',
        lastName: subAdmin.lastName || '',
        email: subAdmin.email || '',
        password: '',
        contactNumber: subAdmin.contactNumber || '',
        countryCode: subAdmin.countryCode || '+1',
        userType: subAdmin.userType || 'sub_admin',
      })
    } else {
      setEditingSubAdmin(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        contactNumber: '',
        countryCode: '+1',
        userType: 'sub_admin',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSubAdmin(null)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSubAdmin) {
        await api.put(`/sub-admin/${editingSubAdmin.id}`, formData)
        showSuccess(t('updated', language))
      } else {
        await api.post('/sub-admin', formData)
        showSuccess(t('saved', language))
      }
      await fetchSubAdmins()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving sub-admin:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/sub-admin/${id}`)
          await fetchSubAdmins()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting sub-admin:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredSubAdmins = subAdmins.filter((subAdmin) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      subAdmin.firstName?.toLowerCase().includes(search) ||
      subAdmin.lastName?.toLowerCase().includes(search) ||
      subAdmin.email?.toLowerCase().includes(search) ||
      subAdmin.contactNumber?.includes(search)
    const matchesStatus = statusFilter === 'all' || subAdmin.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCount = subAdmins.length
  const activeCount = subAdmins.filter((s) => s.status === 'active').length
  const inactiveCount = subAdmins.filter((s) => s.status !== 'active').length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي المسؤولين الفرعيين' : 'Total sub admins', value: totalCount, icon: FiUsers, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
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
            {language === 'ar' ? 'المسؤولون الفرعيون' : 'Sub Admins'}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar' ? 'إدارة حسابات المسؤولين الفرعيين والمديرين والدعم.' : 'Manage sub-admin, manager, and support user accounts.'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus size={18} />
          {language === 'ar' ? 'إضافة مسؤول فرعي' : 'Add Sub Admin'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Search, Filter + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search', language) + '...'} language={language} />
            </div>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} language={language}>
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="active">{t('active', language)}</option>
              <option value="inactive">{t('inactive', language)}</option>
            </FilterSelect>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button type="button" onClick={() => setViewMode('cards')} className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'بطاقات' : 'Cards'}><FiGrid size={20} /></button>
            <button type="button" onClick={() => setViewMode('table')} className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'جدول' : 'Table'}><FiList size={20} /></button>
          </div>
        </div>
      </div>

      {/* Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {filteredSubAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiSearch className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">{searchTerm ? (t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters.') : (language === 'ar' ? 'لا يوجد مسؤولون فرعيون حتى الآن.' : 'No sub admins yet.')}</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSubAdmins.map((subAdmin) => (
              <div key={subAdmin.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
                      {subAdmin.firstName?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{subAdmin.firstName} {subAdmin.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subAdmin.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${subAdmin.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
                    {subAdmin.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{subAdmin.countryCode} {subAdmin.contactNumber}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">{subAdmin.userType}</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons onEdit={() => handleOpenModal(subAdmin)} onDelete={() => handleDelete(subAdmin.id)} size="sm" forceShowIcons />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <TableHeader language={language}>{language === 'ar' ? 'الاسم' : 'Name'}</TableHeader>
                  <TableHeader language={language}>{t('email', language)}</TableHeader>
                  <TableHeader language={language}>{t('contact', language)}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'الدور' : 'Role'}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubAdmins.map((subAdmin) => (
                  <tr key={subAdmin.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {subAdmin.firstName?.[0] || 'S'}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subAdmin.firstName} {subAdmin.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{subAdmin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{subAdmin.countryCode} {subAdmin.contactNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">{subAdmin.userType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${subAdmin.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
                        {subAdmin.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons onEdit={() => handleOpenModal(subAdmin)} onDelete={() => handleDelete(subAdmin.id)} forceShowIcons />
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
        title={editingSubAdmin ? (language === 'ar' ? 'تعديل المسؤول الفرعي' : 'Edit Sub Admin') : (language === 'ar' ? 'إضافة مسؤول فرعي' : 'Add Sub Admin')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'الاسم الأول' : 'First Name'} *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'اسم العائلة' : 'Last Name'} *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('email', language)} *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{!editingSubAdmin && (language === 'ar' ? 'كلمة المرور *' : 'Password *')} {editingSubAdmin && (language === 'ar' ? 'كلمة المرور (اتركها فارغة للإبقاء)' : 'Password (leave blank to keep current)')}</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingSubAdmin} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'رمز الدولة' : 'Country Code'}</label>
              <input type="text" name="countryCode" value={formData.countryCode} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('contactNumber', language)}</label>
              <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'نوع المستخدم' : 'User Type'}</label>
            <select name="userType" value={formData.userType} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="sub_admin">Sub Admin</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200">
              {t('cancel', language)}
            </button>
            <button type="submit" className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
              {t('save', language)}
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

export default SubAdmin
