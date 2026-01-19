import { useEffect, useState, useRef } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiMapPin, FiNavigation, FiRefreshCw, FiFilter } from 'react-icons/fi'

const VehicleTracking = () => {
  const { language } = useLanguage()
  const mapRef = useRef(null)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadMapLibrary = () => {
      if (window.L) {
        setMapLoaded(true)
        initializeMap()
        return
      }

      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => {
        setMapLoaded(true)
        initializeMap()
      }
      document.body.appendChild(script)
    }

    loadMapLibrary()

    return () => {
      if (mapRef.current?._mapInstance && window.L) {
        mapRef.current._mapInstance.remove()
        mapRef.current._mapInstance = null
      }
    }
  }, [])

  const initializeMap = () => {
    if (!window.L || !mapRef.current) return

    // Check if map already exists and remove it
    if (mapRef.current._mapInstance) {
      mapRef.current._mapInstance.remove()
      mapRef.current._mapInstance = null
    }

    const map = window.L.map(mapRef.current).setView([24.7136, 46.6753], 13) // Default to Riyadh

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Store map instance
    mapRef.current._mapInstance = map

    // Load vehicles
    loadVehicles(map)
  }

  const loadVehicles = async (map) => {
    try {
      const response = await api.get('/users/user-list?userType=driver')
      if (response.data.success) {
        const driverList = response.data.data || []
        const vehiclesList = driverList
          .filter(driver => driver.latitude && driver.longitude)
          .map(driver => ({
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            driver: `${driver.firstName} ${driver.lastName}`,
            lat: parseFloat(driver.latitude),
            lng: parseFloat(driver.longitude),
            status: driver.isOnline ? (driver.isAvailable ? 'online' : 'busy') : 'offline',
            speed: 0, // You can add speed tracking if available
            isOnline: driver.isOnline,
            isAvailable: driver.isAvailable,
          }))
        
        setVehicles(vehiclesList)

        // Add markers for each vehicle
        vehiclesList.forEach(vehicle => {
          const icon = window.L.divIcon({
            className: 'vehicle-marker',
            html: `<div class="vehicle-icon ${vehicle.status}">
              <div class="vehicle-pulse"></div>
              <i class="fas fa-car"></i>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })

          const marker = window.L.marker([vehicle.lat, vehicle.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${vehicle.name}</h3>
                <p>Driver: ${vehicle.driver}</p>
                <p>Status: ${vehicle.status}</p>
                <p>Speed: ${vehicle.speed} km/h</p>
              </div>
            `)

          marker.vehicleId = vehicle.id
        })
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('vehicleTracking', language) || 'Vehicle Tracking'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track vehicles in real-time on the map</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FiFilter className="mr-2" size={18} />
            Filter
          </button>
          <button 
            onClick={() => {
              if (mapRef.current?._mapInstance) {
                loadVehicles(mapRef.current._mapInstance)
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="mr-2" size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div ref={mapRef} className="w-full h-full min-h-[600px]" />
      </div>

      {/* Vehicle List Sidebar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Vehicles</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedVehicle?.id === vehicle.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{vehicle.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.driver}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  vehicle.status === 'online'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .vehicle-marker {
          background: transparent;
          border: none;
        }
        .vehicle-icon {
          position: relative;
          width: 30px;
          height: 30px;
          background: #3b82f6;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
        }
        .vehicle-icon.offline {
          background: #6b7280;
        }
        .vehicle-icon::before {
          content: '🚗';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 16px;
        }
        .vehicle-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default VehicleTracking

