import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showError } from '../../utils/toast'
import {
  FiArrowLeft,
  FiUser,
  FiNavigation,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiPhone,
  FiMail,
  FiMap
} from 'react-icons/fi'

const RideRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [rideRequest, setRideRequest] = useState(null)

  useEffect(() => {
    fetchRideDetails()
  }, [id])

  const fetchRideDetails = async () => {
    try {
      const response = await api.get(`/ride-requests/riderequest-detail?id=${id}`)
      if (response.data.success) {
        setRideRequest(response.data.data)
      } else {
        showError(response.data.message || 'Failed to load ride details')
        navigate('/ride-requests')
      }
    } catch (error) {
      console.error('Error fetching ride details:', error)
      showError(error.response?.data?.message || 'Failed to load ride details')
      navigate('/ride-requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const getStatusIcon = (status) => {
    if (status === 'completed') return <FiCheckCircle className="mr-2" size={18} />
    if (status === 'cancelled') return <FiXCircle className="mr-2" size={18} />
    return <FiClock className="mr-2" size={18} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  if (!rideRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('noData', language)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/ride-requests')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('ride', language)} #{rideRequest.id}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {rideRequest.createdAt ? new Date(rideRequest.createdAt).toLocaleString() : ''}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 inline-flex items-center text-sm font-semibold rounded-full ${getStatusColor(rideRequest.status)}`}>
          {getStatusIcon(rideRequest.status)}
          {(() => {
            const status = rideRequest.status || 'pending'
            const statusMap = {
              'pending': 'pending',
              'accepted': 'accepted',
              'in_progress': 'inProgress',
              'completed': 'completed',
              'cancelled': 'cancelled',
              'scheduled': 'scheduled',
              'active': 'active'
            }
            return t(statusMap[status] || status, language) || status
          })()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ride Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiNavigation className="mr-2 text-blue-600" size={20} />
              {t('ride', language)} {t('information', language) || 'Information'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('totalAmount', language)}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    ${(rideRequest.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('distance', language) || 'Distance'}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {rideRequest.distance || '0'} {rideRequest.distanceUnit || 'km'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('duration', language) || 'Duration'}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {rideRequest.duration ? `${Math.floor(rideRequest.duration / 60)} min` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('paymentMethod', language)}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                    {rideRequest.paymentType || '-'}
                  </p>
                </div>
              </div>

              {rideRequest.isSchedule && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <FiCalendar className="mr-2" size={16} />
                    {t('scheduled', language)} {t('date', language)}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {rideRequest.scheduleDatetime
                      ? new Date(rideRequest.scheduleDatetime).toLocaleString()
                      : '-'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiMapPin className="mr-2 text-green-600" size={20} />
              {t('locations', language) || 'Locations'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('pickup_location', language) || 'Pickup Location'}
                </label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {rideRequest.startAddress || '-'}
                </p>
                {rideRequest.startLatitude && rideRequest.startLongitude && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {rideRequest.startLatitude}, {rideRequest.startLongitude}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('dropoff_location', language) || 'Dropoff Location'}
                </label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {rideRequest.endAddress || '-'}
                </p>
                {rideRequest.endLatitude && rideRequest.endLongitude && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {rideRequest.endLatitude}, {rideRequest.endLongitude}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rider Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiUser className="mr-2 text-blue-600" size={20} />
              {t('rider', language)} {t('information', language) || 'Information'}
            </h2>
            {rideRequest.rider ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {rideRequest.rider.firstName} {rideRequest.rider.lastName}
                  </p>
                </div>
                {rideRequest.rider.contactNumber && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiPhone className="mr-2" size={16} />
                    {rideRequest.rider.contactNumber}
                  </div>
                )}
                {rideRequest.rider.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiMail className="mr-2" size={16} />
                    {rideRequest.rider.email}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
            )}
          </div>

          {/* Driver Information */}
          {rideRequest.driver && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FiUser className="mr-2 text-green-600" size={20} />
                {t('driver', language)} {t('information', language) || 'Information'}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {rideRequest.driver.firstName} {rideRequest.driver.lastName}
                  </p>
                </div>
                {rideRequest.driver.contactNumber && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiPhone className="mr-2" size={16} />
                    {rideRequest.driver.contactNumber}
                  </div>
                )}
                {rideRequest.driver.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiMail className="mr-2" size={16} />
                    {rideRequest.driver.email}
                  </div>
                )}
                {rideRequest.driver.latitude && rideRequest.driver.longitude && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiMap className="mr-2" size={16} />
                    {rideRequest.driver.latitude}, {rideRequest.driver.longitude}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Information */}
          {rideRequest.service && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('service', language) || 'Service'}
              </h2>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {rideRequest.service.name || '-'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RideRequestDetails

