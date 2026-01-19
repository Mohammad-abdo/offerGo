import { useState, useEffect, useRef } from 'react'
import { FiTrash2, FiCheckCircle, FiXCircle, FiDownload, FiUpload } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/translations'
import { showSuccess, showError } from '../utils/toast'
import ConfirmDialog from './ConfirmDialog'

const BulkActions = ({
  selectedItems = [],
  onBulkDelete,
  onBulkStatusUpdate,
  onExport,
  onImport,
  showDelete = true,
  showStatusUpdate = true,
  showExport = false,
  showImport = false,
  exportEndpoint,
  importEndpoint,
  importAccept = '.csv,.xlsx,.xls',
  onSelectionChange,
}) => {
  const { language } = useLanguage()
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [isImporting, setIsImporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const exportMenuRef = useRef(null)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false)
      }
    }

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      showError(t('selectItems', language) || 'Please select items')
      return
    }

    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await onBulkDelete(selectedItems)
          onSelectionChange?.([])
          showSuccess(t('deleted', language))
        } catch (error) {
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('bulkDeleteConfirm', language) || `Are you sure you want to delete ${selectedItems.length} item(s)?`,
    })
  }

  const handleBulkStatusUpdate = async (status) => {
    if (selectedItems.length === 0) {
      showError(t('selectItems', language) || 'Please select items')
      return
    }

    try {
      await onBulkStatusUpdate(selectedItems, status)
      onSelectionChange?.([])
      showSuccess(t('updated', language))
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleExport = async (format = 'excel') => {
    if (!exportEndpoint) {
      showError('Export endpoint not configured')
      return
    }

    setIsExporting(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const queryParams = new URLSearchParams({ format })
      
      const response = await fetch(`${apiUrl}${exportEndpoint}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = `export_${new Date().getTime()}`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        } else {
          // Default filename based on format
          const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx'
          filename = `export_${Date.now()}.${extension}`
        }
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess(t('exported', language) || 'Data exported successfully')
        setShowExportMenu(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Export failed')
      }
    } catch (error) {
      showError(error.message || t('failed', language))
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!importEndpoint) {
      showError('Import endpoint not configured')
      return
    }

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    fetch(`${import.meta.env.VITE_API_URL}${importEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
      .then(async (response) => {
        const data = await response.json()
        if (response.ok) {
          showSuccess(data.message || t('imported', language) || 'Data imported successfully')
          onImport?.(data)
        } else {
          throw new Error(data.message || 'Import failed')
        }
      })
      .catch((error) => {
        showError(error.message || t('failed', language))
      })
      .finally(() => {
        setIsImporting(false)
        e.target.value = '' // Reset file input
      })
  }

  if (selectedItems.length === 0 && !showExport && !showImport) {
    return null
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.length > 0 && `${selectedItems.length} ${t('selected', language) || 'selected'}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedItems.length > 0 && (
              <>
                {showDelete && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FiTrash2 className="mr-1.5" size={16} />
                    {t('bulkDelete', language) || 'Delete Selected'}
                  </button>
                )}

                {showStatusUpdate && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleBulkStatusUpdate('active')}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiCheckCircle className="mr-1.5" size={16} />
                      {t('activate', language) || 'Activate'}
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('inactive')}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <FiXCircle className="mr-1.5" size={16} />
                      {t('deactivate', language) || 'Deactivate'}
                    </button>
                  </div>
                )}
              </>
            )}

            {showExport && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload className="mr-1.5" size={16} />
                  {isExporting ? (t('exporting', language) || 'Exporting...') : (t('export', language) || 'Export')}
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('exportExcel', language) || 'Export as Excel'}
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('exportPDF', language) || 'Export as PDF'}
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('exportCSV', language) || 'Export as CSV'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {showImport && (
              <label className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                <FiUpload className="mr-1.5" size={16} />
                {isImporting ? (t('importing', language) || 'Importing...') : (t('import', language) || 'Import')}
                <input
                  type="file"
                  accept={importAccept}
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })}
        onConfirm={confirmDialog.onConfirm}
        message={confirmDialog.message}
      />
    </>
  )
}

export default BulkActions

