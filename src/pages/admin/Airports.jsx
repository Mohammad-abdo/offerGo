import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import BulkActions from '../../components/BulkActions'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import { FiPlus, FiMapPin } from 'react-icons/fi'

const Airports = () => {
  const { language } = useLanguage()
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAirport, setEditingAirport] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    airportId: '',
    latitude: '',
    longitude: '',
  })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAirports()
  }, [])

  const fetchAirports = async () => {
    try {
      const response = await api.get('/airports/airport-list')
      if (response.data.success) {
        // Map latitudeDeg/longitudeDeg to latitude/longitude for display
        const mappedAirports = (response.data.data || []).map(airport => ({
          ...airport,
          latitude: airport.latitudeDeg?.toString() || '',
          longitude: airport.longitudeDeg?.toString() || '',
        }))
        setAirports(mappedAirports)
      }
    } catch (error) {
      console.error('Error fetching airports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (airport = null) => {
    if (airport) {
      setEditingAirport(airport)
      setFormData({
        name: airport.name || '',
        airportId: airport.airportId || '',
        latitude: airport.latitudeDeg?.toString() || airport.latitude || '',
        longitude: airport.longitudeDeg?.toString() || airport.longitude || '',
      })
    } else {
      setEditingAirport(null)
      setFormData({
        name: '',
        airportId: '',
        latitude: '',
        longitude: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAirport(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAirport) {
        await api.put(`/airports/${editingAirport.id}`, formData)
      } else {
        await api.post('/airports/airport-save', formData)
      }
      fetchAirports()
      handleCloseModal()
      showSuccess(editingAirport ? t('updated', language) : t('saved', language))
    } catch (error) {
      console.error('Error saving airport:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.post(`/airports/airport-delete/${id}`)
          fetchAirports()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting airport:', error)
          showError(t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredAirports = airports.filter(airport => {
    return !searchTerm || 
      airport.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.airportId?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">{t('airports', language)}</h1>
          <p className="text-gray-600 mt-1">Manage airport locations and information</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} size={20} />
          {t('addAirport', language)}
        </button>
      </div>

      {/* Bulk Actions with Import */}
      <BulkActions
        selectedItems={[]}
        onBulkDelete={() => {}}
        onBulkStatusUpdate={() => {}}
        showDelete={false}
        showStatusUpdate={false}
        showImport={true}
        importEndpoint="/airports/import-data"
        importAccept=".csv,.xlsx,.xls"
        onImport={(data) => {
          if (data.success) {
            fetchAirports()
          }
        }}
      />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search', language) + '...'}
          language={language}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>{t('airportName', language)}</TableHeader>
              <TableHeader>{t('airportCode', language)}</TableHeader>
              <TableHeader>{t('latitude', language)}</TableHeader>
              <TableHeader>{t('longitude', language)}</TableHeader>
              <TableHeader>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAirports.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiMapPin size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAirports.map((airport) => (
                <tr key={airport.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 text-blue-600" size={18} />
                      <div className="text-sm font-semibold text-gray-900">{airport.name || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono">{airport.airportId || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{airport.latitudeDeg?.toString() || airport.latitude || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{airport.longitudeDeg?.toString() || airport.longitude || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onEdit={() => handleOpenModal(airport)}
                      onDelete={() => handleDelete(airport.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAirport ? t('editAirport', language) : t('addAirport', language)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('airportName', language)}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('airportCode', language)}</label>
            <input
              type="text"
              value={formData.airportId}
              onChange={(e) => setFormData({ ...formData, airportId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('latitude', language)}</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('longitude', language)}</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
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
              {editingAirport ? t('update', language) : t('create', language)}
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

export default Airports
