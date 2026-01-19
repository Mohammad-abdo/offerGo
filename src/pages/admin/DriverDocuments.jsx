import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiSearch, FiPlus, FiFileText, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'

const DriverDocuments = () => {
  const { language } = useLanguage()
  const [documents, setDocuments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [formData, setFormData] = useState({
    driverId: '',
    documentId: '',
    expireDate: '',
    isVerified: false,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchDriverDocuments()
    fetchDrivers()
    fetchDocumentTypes()
  }, [])

  const fetchDriverDocuments = async () => {
    try {
      const response = await api.get('/driver-documents/driver-document-list')
      if (response.data.success) {
        setDocuments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching driver documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/users/user-list?userType=driver')
      if (response.data.success) {
        setDrivers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
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

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDocument(doc)
      setFormData({
        driverId: doc.driverId?.toString() || '',
        documentId: doc.documentId?.toString() || '',
        expireDate: doc.expireDate ? new Date(doc.expireDate).toISOString().split('T')[0] : '',
        isVerified: doc.isVerified || false,
      })
    } else {
      setEditingDocument(null)
      setFormData({
        driverId: '',
        documentId: '',
        expireDate: '',
        isVerified: false,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDocument(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingDocument) {
        await api.post(`/driver-documents/driver-document-update/${editingDocument.id}`, formData)
      } else {
        await api.post('/driver-documents/driver-document-save', formData)
      }
      fetchDriverDocuments()
      handleCloseModal()
      showSuccess(editingDocument ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving driver document:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.post(`/driver-documents/driver-document-delete/${id}`)
          fetchDriverDocuments()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting driver document:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const handleVerify = async (id, isVerified) => {
    try {
      await api.post(`/driver-documents/driver-document-update/${id}`, { isVerified: !isVerified })
      fetchDriverDocuments()
      showSuccess(isVerified ? 'Document unverified' : 'Document verified')
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      `${doc.driver?.firstName} ${doc.driver?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && doc.isVerified) ||
      (statusFilter === 'unverified' && !doc.isVerified)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('driverDocuments', language)}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage driver documents and verifications</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className="mr-2" size={20} />
          Add Document
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
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
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
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Document Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Expiry Date
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
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiFileText size={48} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noData', language)}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 dark:hover:from-blue-900/10 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {(doc.driver?.firstName?.[0] || '').toUpperCase()}{(doc.driver?.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {doc.driver?.firstName || ''} {doc.driver?.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('id', language)}: {doc.driverId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiFileText className="mr-2 text-blue-600 dark:text-blue-400" size={18} />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.document?.name || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FiClock className="mr-2" size={16} />
                      {doc.expireDate ? new Date(doc.expireDate).toLocaleDateString() : 'No expiry'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleVerify(doc.id, doc.isVerified)}
                      className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border transition-all ${
                        doc.isVerified
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                      }`}
                    >
                      {doc.isVerified ? (
                        <>
                          <FiCheckCircle className="mr-1" size={12} />
                          Verified
                        </>
                      ) : (
                        <>
                          <FiXCircle className="mr-1" size={12} />
                          Unverified
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(doc)}
                      onDelete={() => handleDelete(doc.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDocument ? 'Edit Driver Document' : 'Add Driver Document'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Driver</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
            <select
              value={formData.documentId}
              onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Document Type</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expiry Date</label>
            <input
              type="date"
              value={formData.expireDate}
              onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {editingDocument && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified</span>
              </label>
            </div>
          )}

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
              {editingDocument ? t('update', language) : t('create', language)}
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

export default DriverDocuments
