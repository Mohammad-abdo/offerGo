import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
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
  FiMap,
  FiActivity,
  FiTarget,
} from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:5001'
const POLL_INTERVAL_MS = 15000

const parseCoord = (v) => (v != null ? parseFloat(v) : null)

const RideRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [rideRequest, setRideRequest] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [driverPosition, setDriverPosition] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({ pickup: null, dropoff: null, routeLine: null, driver: null })
  const socketRef = useRef(null)

  useEffect(() => {
    fetchRideDetails()
  }, [id])

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: '/socket.io', transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('driver-location-update', (data) => {
      if (!data?.driverId || data.lat == null || data.lng == null) return
      if (rideRequest?.driver?.id !== data.driverId) return
      setDriverPosition({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) })
      const map = mapInstanceRef.current
      if (map && window.L && markersRef.current.driver) {
        try {
          markersRef.current.driver.setLatLng([parseFloat(data.lat), parseFloat(data.lng)])
        } catch (e) {}
      }
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [rideRequest?.driver?.id])

  useEffect(() => {
    if (id && socketRef.current?.connected) {
      socketRef.current.emit('subscribe-ride', id)
      return () => {
        socketRef.current?.emit?.('unsubscribe-ride', id)
      }
    }
  }, [id, socketConnected])

  const fetchRideDetails = async () => {
    try {
      const response = await api.get(`/ride-requests/riderequest-detail?id=${id}`)
      if (response.data.success) {
        const data = response.data.data
        setRideRequest(data)
        if (data?.driver?.latitude != null && data?.driver?.longitude != null) {
          setDriverPosition({
            lat: parseFloat(data.driver.latitude),
            lng: parseFloat(data.driver.longitude),
          })
        } else {
          setDriverPosition(null)
        }
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

  useEffect(() => {
    const loadMapLibrary = () => {
      if (window.L) {
        setMapLoaded(true)
        return
      }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => setMapLoaded(true)
      document.body.appendChild(script)
    }
    loadMapLibrary()
    return () => {
      if (mapInstanceRef.current && window.L) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markersRef.current = { pickup: null, dropoff: null, routeLine: null, driver: null }
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !rideRequest || !mapRef.current) return
    const startLat = parseCoord(rideRequest.startLatitude)
    const startLng = parseCoord(rideRequest.startLongitude)
    const endLat = parseCoord(rideRequest.endLatitude)
    const endLng = parseCoord(rideRequest.endLongitude)
    if (startLat == null || startLng == null) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    if (markersRef.current.pickup) markersRef.current.pickup.remove()
    if (markersRef.current.dropoff) markersRef.current.dropoff.remove()
    if (markersRef.current.routeLine) markersRef.current.routeLine.remove()
    if (markersRef.current.driver) markersRef.current.driver.remove()
    markersRef.current = { pickup: null, dropoff: null, routeLine: null, driver: null }

    const L = window.L
    const centerLat = endLat != null ? (startLat + endLat) / 2 : startLat
    const centerLng = endLng != null ? (startLng + endLng) / 2 : startLng
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    mapInstanceRef.current = map

    const pickupIcon = L.divIcon({
      className: 'ride-detail-marker',
      html: '<div style="width:36px;height:36px;border-radius:50%;background:#10b981;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:18px">📍</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
    const dropoffIcon = L.divIcon({
      className: 'ride-detail-marker',
      html: '<div style="width:36px;height:36px;border-radius:50%;background:#ef4444;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:18px">🏁</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
    const driverIcon = L.divIcon({
      className: 'ride-detail-marker',
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#f59e0b;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:16px">🚗</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const pickupMarker = L.marker([startLat, startLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-2"><strong>${language === 'ar' ? 'نقطة الانطلاق' : 'Pickup'}</strong><br/>${rideRequest.startAddress || ''}</div>`
      )
    markersRef.current.pickup = pickupMarker

    const points = [[startLat, startLng]]
    if (endLat != null && endLng != null) {
      points.push([endLat, endLng])
      const dropoffMarker = L.marker([endLat, endLng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2"><strong>${language === 'ar' ? 'مكان الوصول' : 'Dropoff'}</strong><br/>${rideRequest.endAddress || ''}</div>`
        )
      markersRef.current.dropoff = dropoffMarker
      const routeLine = L.polyline(points, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10',
      }).addTo(map)
      markersRef.current.routeLine = routeLine
    }

    const driverLat = driverPosition?.lat ?? parseCoord(rideRequest.driver?.latitude)
    const driverLng = driverPosition?.lng ?? parseCoord(rideRequest.driver?.longitude)
    if (driverLat != null && driverLng != null) {
      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2"><strong>${language === 'ar' ? 'المركبة' : 'Vehicle'}</strong><br/>${rideRequest.driver?.firstName || ''} ${rideRequest.driver?.lastName || ''}</div>`
        )
      markersRef.current.driver = driverMarker
      points.push([driverLat, driverLng])
    }

    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })

    return () => {
      if (mapInstanceRef.current === map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded, rideRequest?.id, rideRequest?.startLatitude, rideRequest?.startLongitude, rideRequest?.endLatitude, rideRequest?.endLongitude, rideRequest?.driver?.id, language])

  // Update or add driver marker when driverPosition changes (WebSocket)
  useEffect(() => {
    if (driverPosition?.lat == null || driverPosition?.lng == null) return
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    const driverIcon = L.divIcon({
      className: 'ride-detail-marker',
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#f59e0b;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:16px">🚗</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    if (markersRef.current.driver) {
      markersRef.current.driver.setLatLng([driverPosition.lat, driverPosition.lng])
    } else if (rideRequest?.driver) {
      const driverMarker = L.marker([driverPosition.lat, driverPosition.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2"><strong>${language === 'ar' ? 'المركبة' : 'Vehicle'}</strong><br/>${rideRequest.driver?.firstName || ''} ${rideRequest.driver?.lastName || ''}</div>`
        )
      markersRef.current.driver = driverMarker
    }
  }, [driverPosition?.lat, driverPosition?.lng, rideRequest?.driver, language])

  useEffect(() => {
    if (!rideRequest?.driver?.id || !id) return
    const interval = setInterval(fetchRideDetails, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [rideRequest?.driver?.id, id])

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      accepted: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-orange-500" />
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

  const hasMapCoords = rideRequest.startLatitude != null && rideRequest.startLongitude != null

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ride-requests')}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            <FiArrowLeft size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('ride', language)} #{rideRequest.id}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {rideRequest.createdAt ? new Date(rideRequest.createdAt).toLocaleString() : ''}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2.5 inline-flex items-center text-sm font-semibold rounded-xl shadow-sm ${getStatusColor(rideRequest.status)}`}>
          {getStatusIcon(rideRequest.status)}
          {(() => {
            const status = rideRequest.status || 'pending'
            const statusMap = {
              pending: 'pending',
              accepted: 'accepted',
              in_progress: 'inProgress',
              completed: 'completed',
              cancelled: 'cancelled',
              scheduled: 'scheduled',
              active: 'active',
            }
            return t(statusMap[status] || status, language) || status
          })()}
        </span>
      </div>

      {/* Map: route from pickup to dropoff + live driver */}
      {hasMapCoords && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiMap className="text-orange-500" size={22} />
              {language === 'ar' ? 'مسار الرحلة من الانطلاق إلى الوصول' : 'Trip route (pickup → dropoff)'}
            </h2>
            <div className="flex items-center gap-4 flex-wrap">
              {socketConnected && rideRequest.driver && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {language === 'ar' ? 'تتبع مباشر' : 'Live tracking'}
                </span>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <FiTarget size={16} className="text-emerald-500" />
                  {rideRequest.distance ?? '0'} {rideRequest.distanceUnit || 'km'}
                </span>
                {rideRequest.duration != null && (
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <FiClock size={16} className="text-blue-500" />
                    {Math.floor(Number(rideRequest.duration) / 60)} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <div ref={mapRef} className="w-full h-[380px] min-h-[280px]" />
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-6 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> {language === 'ar' ? 'انطلاق' : 'Pickup'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" /> {language === 'ar' ? 'وصول' : 'Dropoff'}
            </span>
            {rideRequest.driver && (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> {language === 'ar' ? 'المركبة' : 'Vehicle'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ride Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiNavigation className="text-orange-500" size={20} />
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
                    {rideRequest.distance ?? '0'} {rideRequest.distanceUnit || 'km'}
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
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FiCalendar size={16} />
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiMapPin className="text-green-500" size={20} />
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser className="text-orange-500" size={20} />
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
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiPhone size={16} />
                    {rideRequest.rider.contactNumber}
                  </div>
                )}
                {rideRequest.rider.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiMail size={16} />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiUser className="text-green-500" size={20} />
                {t('driver', language)} {t('information', language) || 'Information'}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {rideRequest.driver.firstName} {rideRequest.driver.lastName}
                  </p>
                </div>
                {rideRequest.driver.contactNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiPhone size={16} />
                    {rideRequest.driver.contactNumber}
                  </div>
                )}
                {rideRequest.driver.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiMail size={16} />
                    {rideRequest.driver.email}
                  </div>
                )}
                {(driverPosition || (rideRequest.driver.latitude && rideRequest.driver.longitude)) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-1">
                    <FiMap size={16} />
                    {driverPosition
                      ? `${driverPosition.lat.toFixed(5)}, ${driverPosition.lng.toFixed(5)}`
                      : `${rideRequest.driver.latitude}, ${rideRequest.driver.longitude}`}
                    {socketConnected && (
                      <span className="text-green-500 text-xs flex items-center gap-1">
                        <FiActivity size={12} /> Live
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Information */}
          {rideRequest.service && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
