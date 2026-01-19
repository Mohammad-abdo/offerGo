import { useEffect, useState } from 'react'
import api from '../../utils/api'
import BulkActions from '../../components/BulkActions'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'

const RideRequests = () => {
  const { language } = useLanguage()
  const [rideRequests, setRideRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRides, setSelectedRides] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchRideRequests()
  }, [])

  const fetchRideRequests = async () => {
    try {
      const response = await api.get('/ride-requests/riderequest-list')
      if (response.data.success) {
        setRideRequests(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/bulk-operations/ride-requests/delete', { ids })
      fetchRideRequests()
    } catch (error) {
      console.error('Error bulk deleting ride requests:', error)
      throw error
    }
  }

  const handleSelectAll = () => {
    if (selectedRides.length === filteredRides.length) {
      setSelectedRides([])
    } else {
      setSelectedRides(filteredRides.map(r => r.id))
    }
  }

  const handleSelectRide = (id) => {
    setSelectedRides(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredRides = rideRequests.filter(ride => {
    const matchesSearch = !searchTerm || 
      ride.startAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.endAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${ride.rider?.firstName || ''} ${ride.rider?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter
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
          <h1 className="text-3xl font-bold text-gray-900">{t('rideRequests', language)}</h1>
          <p className="text-gray-600 mt-1">{t('manageAndMonitorAllRideRequests', language)}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedRides}
        onBulkDelete={handleBulkDelete}
        onSelectionChange={setSelectedRides}
        showDelete={true}
        showStatusUpdate={false}
        showExport={true}
        exportEndpoint="/ride-requests/export"
      />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search', language) + '...'}
            language={language}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            language={language}
          >
            <option value="all">{t('status', language)}: {t('viewAll', language)}</option>
            <option value="pending">{t('pending', language)}</option>
            <option value="accepted">{t('accepted', language) || 'Accepted'}</option>
            <option value="in_progress">{t('inProgress', language)}</option>
            <option value="completed">{t('completed', language)}</option>
            <option value="cancelled">{t('cancelled', language)}</option>
          </FilterSelect>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>
                <input
                  type="checkbox"
                  checked={selectedRides.length === filteredRides.length && filteredRides.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHeader>
              <TableHeader>{t('rider', language)}</TableHeader>
              <TableHeader>{t('driver', language)}</TableHeader>
              <TableHeader>{t('from', language) || 'From'}</TableHeader>
              <TableHeader>{t('to', language) || 'To'}</TableHeader>
              <TableHeader>{t('amount', language)}</TableHeader>
              <TableHeader>{t('status', language)}</TableHeader>
              <TableHeader>{t('date', language)}</TableHeader>
              <TableHeader>{t('actions', language)}</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRides.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <FiSearch size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">{t('noData', language)}</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRides.map((ride) => (
                <tr key={ride.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRides.includes(ride.id)}
                      onChange={() => handleSelectRide(ride.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ride.rider?.firstName || ''} {ride.rider?.lastName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {ride.driver ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {ride.startAddress || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {ride.endAddress || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(ride.totalAmount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        ride.status || 'pending'
                      )}`}
                    >
                      {(() => {
                        const status = ride.status || 'pending'
                        // Map status values to translation keys
                        const statusMap = {
                          'pending': 'pending',
                          'accepted': 'accepted',
                          'in_progress': 'inProgress',
                          'completed': 'completed',
                          'cancelled': 'cancelled'
                        }
                        const translationKey = statusMap[status] || status
                        return t(translationKey, language) || status
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      onView={() => {
                        window.location.href = `/ride-requests/${ride.id}`
                      }}
                      showView={true}
                      showEdit={false}
                      showDelete={false}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

export default RideRequests

