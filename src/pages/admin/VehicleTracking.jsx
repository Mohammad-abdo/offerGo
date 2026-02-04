import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiMapPin, FiNavigation, FiRefreshCw, FiTruck } from 'react-icons/fi'

const POLL_INTERVAL_MS = 15000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:5001'

const VehicleTracking = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({ drivers: [], rides: [] })
  const [vehicles, setVehicles] = useState([])
  const [rides, setRides] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedRide, setSelectedRide] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: '/socket.io', transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('driver-location-update', (data) => {
      if (!data?.driverId || data.lat == null || data.lng == null) return
      setVehicles((prev) => {
        const next = prev.map((v) =>
          v.id === data.driverId ? { ...v, lat: parseFloat(data.lat), lng: parseFloat(data.lng) } : v
        )
        if (!next.find((v) => v.id === data.driverId)) {
          next.push({
            id: data.driverId,
            name: data.name || `Driver ${data.driverId}`,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng),
            status: data.status || 'online',
            isOnline: true,
            isAvailable: data.isAvailable !== false,
          })
        }
        return next
      })
      const map = mapRef.current?._mapInstance
      if (map && window.L) {
        const existing = markersRef.current.drivers.find((m) => m.vehicleId === data.driverId)
        if (existing) existing.setLatLng([parseFloat(data.lat), parseFloat(data.lng)])
      }
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const loadMapLibrary = () => {
      if (window.L) {
        setMapLoaded(true)
        setTimeout(initializeMap, 100)
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
      script.onload = () => {
        setMapLoaded(true)
        setTimeout(initializeMap, 100)
      }
      document.body.appendChild(script)
    }
    loadMapLibrary()
    return () => {
      if (mapRef.current?._mapInstance && window.L) {
        mapRef.current._mapInstance.remove()
        mapRef.current._mapInstance = null
      }
      mapInstanceRef.current = null
    }
  }, [])

  const initializeMap = () => {
    if (!window.L || !mapRef.current) return
    if (mapRef.current._mapInstance) {
      mapRef.current._mapInstance.remove()
      mapRef.current._mapInstance = null
    }
    mapInstanceRef.current = null
    const map = window.L.map(mapRef.current).setView([24.7136, 46.6753], 13)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current._mapInstance = map
    mapInstanceRef.current = map
    loadData(map)
  }

  const loadData = async (map) => {
    setLoading(true)
    try {
      const [driversRes, ridesRes] = await Promise.all([
        api.get('/users/user-list', { params: { userType: 'driver', per_page: 500 } }),
        api.get('/ride-requests/riderequest-list', { params: { per_page: 200 } }),
      ])
      const driverList = driversRes.data?.success ? driversRes.data.data || [] : []
      const vehiclesList = driverList
        .filter((d) => d.latitude && d.longitude)
        .map((d) => ({
          id: d.id,
          name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Driver',
          lat: parseFloat(d.latitude),
          lng: parseFloat(d.longitude),
          status: d.isOnline ? (d.isAvailable ? 'online' : 'busy') : 'offline',
          isOnline: d.isOnline,
          isAvailable: d.isAvailable,
        }))
      setVehicles(vehiclesList)
      const rideList = ridesRes.data?.success ? ridesRes.data.data || [] : []
      setRides(rideList)
      if (map && mapInstanceRef.current === map) {
        clearMarkers()
        if (map.whenReady) {
          map.whenReady(() => addMarkers(map, vehiclesList, rideList))
        } else {
          requestAnimationFrame(() => addMarkers(map, vehiclesList, rideList))
        }
      }
    } catch (err) {
      console.error('Error loading tracking data:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearMarkers = () => {
    markersRef.current.drivers.forEach((m) => m.remove())
    markersRef.current.drivers = []
    markersRef.current.rides.forEach((m) => m.remove())
    markersRef.current.rides = []
  }

  const addMarkers = (map, vehiclesList, rideList) => {
    if (!window.L || mapInstanceRef.current !== map || !map.getPane('markerPane')) return
    const driverIcon = (status) =>
      window.L.divIcon({
        className: 'vehicle-marker-wrap',
        html: `<div class="vehicle-icon ${status}" style="width:28px;height:28px;border-radius:50%;background:${status === 'online' ? '#10b981' : status === 'busy' ? '#f59e0b' : '#6b7280'};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px">🚗</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
    vehiclesList.forEach((v) => {
      try {
        const marker = window.L.marker([v.lat, v.lng], { icon: driverIcon(v.status) })
          .addTo(map)
          .bindPopup(
            `<div class="p-2"><strong>${v.name}</strong><br/>Status: ${v.status}<br/>ID: ${v.id}</div>`
          )
        marker.vehicleId = v.id
        markersRef.current.drivers.push(marker)
      } catch (e) {
        console.warn('Marker error driver:', v.id, e)
      }
    })
    ;(rideList || []).forEach((ride) => {
      try {
        const lat = ride.startLatitude && parseFloat(ride.startLatitude)
        const lng = ride.startLongitude && parseFloat(ride.startLongitude)
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const marker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({
              className: 'ride-marker-wrap',
              html: '<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:12px">📍</div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          })
            .addTo(map)
            .bindPopup(
              `<div class="p-2"><strong>Ride #${ride.id}</strong><br/>${ride.startAddress || 'Pickup'}<br/>→ ${ride.endAddress || 'Drop'}<br/>Status: ${ride.status}</div>`
            )
          marker.rideId = ride.id
          markersRef.current.rides.push(marker)
        }
      } catch (e) {
        console.warn('Marker error ride:', ride.id, e)
      }
    })
  }

  useEffect(() => {
    if (!mapRef.current?._mapInstance) return
    const interval = setInterval(() => {
      loadData(mapRef.current._mapInstance)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [mapLoaded])

  const handleRefresh = () => {
    if (mapRef.current?._mapInstance) loadData(mapRef.current._mapInstance)
  }

  const activeRides = rides.filter(
    (r) => r.status === 'pending' || r.status === 'accepted' || r.status === 'in_progress'
  )

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('vehicleTracking', language) || 'Vehicle Tracking'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'ar'
              ? 'تتبع المركبات والرحلات في الوقت الفعلي على الخريطة'
              : 'Track vehicles and rides in real-time on the map'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {socketConnected && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={language === 'ar' ? 'ml-2' : 'mr-2'} size={18} />
            {t('refresh', language)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div ref={mapRef} className="w-full h-[500px]" />
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiTruck size={20} />
              {language === 'ar' ? 'المركبات / السائقون' : 'Vehicles / Drivers'}
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vehicles.length === 0 && !loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'لا توجد مركبات بموقع متاح' : 'No vehicles with location'}
                </p>
              )}
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVehicle?.id === v.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{v.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {v.id}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        v.status === 'online'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : v.status === 'busy'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiNavigation size={20} />
              {t('rideRequests', language)} ({activeRides.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeRides.length === 0 && !loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'لا توجد رحلات نشطة' : 'No active rides'}
                </p>
              )}
              {activeRides.slice(0, 20).map((ride) => (
                <div
                  key={ride.id}
                  onClick={() => {
                    setSelectedRide(ride)
                    navigate(`/ride-requests/${ride.id}`)
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRide?.id === ride.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    #{ride.id} · {ride.status}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={ride.startAddress}>
                    📍 {ride.startAddress || '-'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={ride.endAddress}>
                    → {ride.endAddress || '-'}
                  </p>
                  {ride.driver && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'ar' ? 'السائق: ' : 'Driver: '}
                      {ride.driver.firstName} {ride.driver.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .vehicle-marker-wrap, .ride-marker-wrap { background: transparent; border: none; }
      `}</style>
    </div>
  )
}

export default VehicleTracking
