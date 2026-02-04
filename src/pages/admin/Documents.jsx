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
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiUser,
} from 'react-icons/fi'

const Documents = () => {
  const { language } = useLanguage()
  const [driverDocuments, setDriverDocuments] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [showTypesSection, setShowTypesSection] = useState(false)
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'

  const [driverDocModal, setDriverDocModal] = useState({ open: false, item: null })
  const [driverDocForm, setDriverDocForm] = useState({ expireDate: '', isVerified: false })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    name_ar: '',
    type: '',
    status: 1,
    is_required: false,
    has_expiry_date: false,
  })

  useEffect(() => {
    fetchDriverDocuments()
    fetchDocumentTypes()
  }, [])

  const fetchDriverDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/driver-documents/driver-document-list')
      if (response.data.success) {
        setDriverDocuments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching driver documents:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/document-list')
      if (response.data.success) {
        setDocumentTypes(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching document types:', error)
    }
  }

  const filteredDriverDocs = driverDocuments.filter((doc) => {
    const driverName = `${doc.driver?.firstName || ''} ${doc.driver?.lastName || ''}`.trim().toLowerCase()
    const docName = (doc.document?.name || '').toLowerCase()
    const matchesSearch =
      !searchTerm ||
      driverName.includes(searchTerm.toLowerCase()) ||
      docName.includes(searchTerm.toLowerCase()) ||
      String(doc.driverId).includes(searchTerm)
    const matchesType =
      documentTypeFilter === 'all' || String(doc.documentId) === documentTypeFilter
    const matchesVerified =
      verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && doc.isVerified) ||
      (verifiedFilter === 'unverified' && !doc.isVerified)
    return matchesSearch && matchesType && matchesVerified
  })

  const handleOpenDriverDocModal = (item = null) => {
    if (item) {
      setDriverDocModal({ open: true, item })
      setDriverDocForm({
        expireDate: item.expireDate ? new Date(item.expireDate).toISOString().split('T')[0] : '',
        isVerified: !!item.isVerified,
      })
    } else {
      setDriverDocModal({ open: false, item: null })
    }
  }

  const handleCloseDriverDocModal = () => setDriverDocModal({ open: false, item: null })

  const handleSaveDriverDoc = async (e) => {
    e.preventDefault()
    const { item } = driverDocModal
    if (!item) return
    try {
      await api.post(`/driver-documents/driver-document-update/${item.id}`, {
        expireDate: driverDocForm.expireDate || null,
        isVerified: driverDocForm.isVerified,
      })
      showSuccess(t('updated', language))
      fetchDriverDocuments()
      handleCloseDriverDocModal()
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleVerifyDriverDoc = async (id, currentVerified) => {
    try {
      await api.post(`/driver-documents/driver-document-update/${id}`, { isVerified: !currentVerified })
      showSuccess(currentVerified ? t('documentUnverified', language) : t('documentVerified', language))
      fetchDriverDocuments()
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDeleteDriverDoc = (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.post(`/driver-documents/driver-document-delete/${id}`)
          showSuccess(t('deleted', language))
          fetchDriverDocuments()
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleOpenTypeModal = (doc = null) => {
    if (doc) {
      setEditingType(doc)
      setTypeFormData({
        name: doc.name || '',
        name_ar: doc.nameAr || '',
        type: doc.type || '',
        status: doc.status ?? 1,
        is_required: !!doc.isRequired,
        has_expiry_date: !!doc.hasExpiryDate,
      })
    } else {
      setEditingType(null)
      setTypeFormData({
        name: '', name_ar: '', type: '', status: 1,
        is_required: false, has_expiry_date: false,
      })
    }
    setTypeModalOpen(true)
  }

  const handleCloseTypeModal = () => { setTypeModalOpen(false); setEditingType(null) }

  const handleSubmitType = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: typeFormData.name,
        nameAr: typeFormData.name_ar || null,
        type: typeFormData.type || null,
        status: typeFormData.status,
        isRequired: typeFormData.is_required,
        hasExpiryDate: typeFormData.has_expiry_date,
      }
      if (editingType) {
        await api.put(`/documents/${editingType.id}`, payload)
        showSuccess(t('updated', language))
      } else {
        await api.post('/documents', payload)
        showSuccess(t('saved', language))
      }
      fetchDocumentTypes()
      handleCloseTypeModal()
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDeleteType = (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/documents/${id}`)
          showSuccess(t('deleted', language))
          fetchDocumentTypes()
          fetchDriverDocuments()
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const totalCount = driverDocuments.length
  const verifiedCount = driverDocuments.filter((d) => d.isVerified).length
  const unverifiedCount = totalCount - verifiedCount

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي المستندات' : 'Total documents',
      value: totalCount,
      icon: FiFileText,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'موثق' : 'Verified',
      value: verifiedCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: language === 'ar' ? 'في انتظار التوثيق' : 'Pending verification',
      value: unverifiedCount,
      icon: FiXCircle,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ]

  if (loading && driverDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل المستندات...' : 'Loading documents...'}
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
            {t('documents', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar'
              ? 'إدارة كامل ملفات السائقين المرفوعة عند التسجيل في المنصة — عرض، توثيق، وتعديل المستندات.'
              : 'Manage all driver files uploaded at registration — view, verify, and edit documents.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { fetchDriverDocuments(); fetchDocumentTypes() }}
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
            <FilterSelect
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              language={language}
            >
              <option value="all">{language === 'ar' ? 'نوع المستند: الكل' : 'Document type: All'}</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {language === 'ar' ? (dt.nameAr || dt.name) : (dt.name || dt.nameAr)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              language={language}
            >
              <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
              <option value="verified">{language === 'ar' ? 'موثق' : 'Verified'}</option>
              <option value="unverified">{language === 'ar' ? 'غير موثق' : 'Unverified'}</option>
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

      {/* Driver documents: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiUser className="text-orange-500" size={24} />
            {language === 'ar' ? 'ملفات السائقين المرفوعة' : 'Driver uploaded documents'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredDriverDocs.length} {language === 'ar' ? 'مستند' : 'document(s)'}
          </p>
        </div>

        {filteredDriverDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiFileText className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {language === 'ar' ? 'لا توجد مستندات سائقين' : 'No driver documents yet'}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {language === 'ar'
                ? 'سيظهر هنا كل ما يرفعه السائقون عند التسجيل في المنصة. تأكد من تفعيل أنواع المستندات المطلوبة أدناه.'
                : 'Documents uploaded by drivers at registration will appear here. Make sure required document types are set below.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDriverDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
                      {(doc.driver?.firstName?.[0] || '?').toUpperCase()}
                      {(doc.driver?.lastName?.[0] || '').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {doc.driver?.firstName} {doc.driver?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {language === 'ar'
                          ? (doc.document?.nameAr || doc.document?.name)
                          : (doc.document?.name || doc.document?.nameAr)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyDriverDoc(doc.id, doc.isVerified)}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      doc.isVerified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    }`}
                  >
                    {doc.isVerified ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                    {doc.isVerified ? (language === 'ar' ? 'موثق' : 'Verified') : (language === 'ar' ? 'غير موثق' : 'Unverified')}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar size={14} />
                    {doc.expireDate ? new Date(doc.expireDate).toLocaleDateString() : t('noExpiry', language)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiClock size={14} />
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ActionButtons
                    onView={() => handleOpenDriverDocModal(doc)}
                    onEdit={() => handleOpenDriverDocModal(doc)}
                    onDelete={() => handleDeleteDriverDoc(doc.id)}
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
                  <TableHeader language={language}>{t('driver', language)}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'نوع المستند' : 'Document type'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry'}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredDriverDocs.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
                          {(doc.driver?.firstName?.[0] || '?').toUpperCase()}{(doc.driver?.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{doc.driver?.firstName} {doc.driver?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? (doc.document?.nameAr || doc.document?.name) : (doc.document?.name || doc.document?.nameAr)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {doc.expireDate ? new Date(doc.expireDate).toLocaleDateString() : t('noExpiry', language)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleVerifyDriverDoc(doc.id, doc.isVerified)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          doc.isVerified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        {doc.isVerified ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                        {doc.isVerified ? (language === 'ar' ? 'موثق' : 'Verified') : (language === 'ar' ? 'غير موثق' : 'Unverified')}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <ActionButtons
                        onView={() => handleOpenDriverDocModal(doc)}
                        onEdit={() => handleOpenDriverDocModal(doc)}
                        onDelete={() => handleDeleteDriverDoc(doc.id)}
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

      {/* Document types */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTypesSection(!showTypesSection)}
          className="w-full flex items-center justify-between px-6 py-5 text-left bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700"
        >
          <span className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiLayers className="text-orange-500" size={24} />
            {language === 'ar' ? 'أنواع المستندات المطلوبة' : 'Required document types'}
          </span>
          {showTypesSection ? <FiChevronUp size={24} className="text-gray-500" /> : <FiChevronDown size={24} className="text-gray-500" />}
        </button>
        {showTypesSection && (
          <div className="p-6">
            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => handleOpenTypeModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
              >
                <FiPlus size={18} />
                {language === 'ar' ? 'إضافة نوع مستند' : 'Add document type'}
              </button>
            </div>
            {documentTypes.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'لا توجد أنواع مستندات. أضف نوعاً ليتسنى للسائقين رفع المستندات.' : 'No document types. Add one so drivers can upload documents.'}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documentTypes.map((dt) => (
                  <div
                    key={dt.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 flex items-center justify-between gap-4 hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {language === 'ar' ? (dt.nameAr || dt.name) : (dt.name || dt.nameAr)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dt.isRequired && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                            {language === 'ar' ? 'مطلوب' : 'Required'}
                          </span>
                        )}
                        {dt.hasExpiryDate && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            {language === 'ar' ? 'انتهاء' : 'Expiry'}
                          </span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${dt.status === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                          {dt.status === 1 ? t('active', language) : t('inactive', language)}
                        </span>
                      </div>
                    </div>
                    <ActionButtons
                      onEdit={() => handleOpenTypeModal(dt)}
                      onDelete={() => handleDeleteType(dt.id)}
                      showView={false}
                      showEdit={true}
                      showDelete={true}
                      forceShowIcons={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Edit driver document */}
      <Modal isOpen={driverDocModal.open} onClose={handleCloseDriverDocModal} title={language === 'ar' ? 'تعديل المستند' : 'Edit document'} size="md">
        {driverDocModal.item && (
          <form onSubmit={handleSaveDriverDoc} className="space-y-5">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">
                {driverDocModal.item.driver?.firstName} {driverDocModal.item.driver?.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <FiFileText size={14} className="text-orange-500" />
                {language === 'ar' ? (driverDocModal.item.document?.nameAr || driverDocModal.item.document?.name) : (driverDocModal.item.document?.name || driverDocModal.item.document?.nameAr)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry date'}</label>
              <input
                type="date"
                value={driverDocForm.expireDate}
                onChange={(e) => setDriverDocForm({ ...driverDocForm, expireDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <input type="checkbox" id="isVerified" checked={driverDocForm.isVerified} onChange={(e) => setDriverDocForm({ ...driverDocForm, isVerified: e.target.checked })} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4" />
              <label htmlFor="isVerified" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">{language === 'ar' ? 'موثق' : 'Verified'}</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCloseDriverDocModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">{t('cancel', language)}</button>
              <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">{t('update', language)}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Add/Edit document type */}
      <Modal isOpen={typeModalOpen} onClose={handleCloseTypeModal} title={editingType ? (language === 'ar' ? 'تعديل نوع المستند' : 'Edit document type') : (language === 'ar' ? 'إضافة نوع مستند' : 'Add document type')} size="md">
        <form onSubmit={handleSubmitType} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('name', language)} ({t('english', language)})</label>
            <input type="text" value={typeFormData.name} onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('name', language)} ({t('arabic', language)})</label>
            <input type="text" value={typeFormData.name_ar} onChange={(e) => setTypeFormData({ ...typeFormData, name_ar: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" dir="rtl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('type', language)}</label>
            <input type="text" value={typeFormData.type} onChange={(e) => setTypeFormData({ ...typeFormData, type: e.target.value })} placeholder="e.g. license, id_card" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={typeFormData.is_required} onChange={(e) => setTypeFormData({ ...typeFormData, is_required: e.target.checked })} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'مطلوب' : 'Required'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={typeFormData.has_expiry_date} onChange={(e) => setTypeFormData({ ...typeFormData, has_expiry_date: e.target.checked })} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'له تاريخ انتهاء' : 'Has expiry date'}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('status', language)}</label>
            <select value={typeFormData.status} onChange={(e) => setTypeFormData({ ...typeFormData, status: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500">
              <option value={1}>{t('active', language)}</option>
              <option value={0}>{t('inactive', language)}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseTypeModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">{t('cancel', language)}</button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">{editingType ? t('update', language) : t('create', language)}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })} onConfirm={confirmDialog.onConfirm || (() => {})} message={confirmDialog.message} type="danger" />
    </div>
  )
}

export default Documents
