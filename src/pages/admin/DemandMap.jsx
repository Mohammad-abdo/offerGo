import { useEffect, useState, useRef } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiRefreshCw, FiUsers, FiNavigation } from 'react-icons/fi'

const DemandMap = () => {
  const { language } = useLanguage()
  const mapRef = useRef(null)
  const [zones, setZones] = useState([])
  const [drivers, setDrivers] = useState([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showDrivers, setShowDrivers] = useState(true)

  useEffect(() => {
    const loadMapLibrary = () => {
      if (window.L) {
        setMapLoaded(true)
        initializeMap()
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

    const map = window.L.map(mapRef.current).setView([24.7136, 46.6753], 13)

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current._mapInstance = map
    loadDemandData(map)
  }

  const loadDemandData = async (map) => {
    try {
      const response = await api.get('/demand-map/zones')
      if (response.data.success) {
        const { zones: zonesData, drivers: driversData } = response.data.data
        setZones(zonesData)
        setDrivers(driversData)

        // Draw zones
        zonesData.forEach(zone => {
          const color = zone.intensity === 'red' ? '#FF0000' : 
                       zone.intensity === 'orange' ? '#FFA500' : '#008000'
          
          const circle = window.L.circle([zone.lat, zone.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            radius: 5000, // 5km radius
          }).addTo(map)

          circle.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">High Demand Zone</h3>
              <p>Ride Requests: ${zone.rideCount}</p>
              <p>Intensity: ${zone.intensity}</p>
            </div>
          `)
        })

        // Draw drivers
        if (showDrivers) {
          driversData.forEach(driver => {
            try {
              // Validate coordinates
              if (!driver.latitude || !driver.longitude) {
                console.warn(`Driver ${driver.id} missing coordinates`)
                return
              }

              const lat = parseFloat(driver.latitude)
              const lng = parseFloat(driver.longitude)

              if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Driver ${driver.id} has invalid coordinates`)
                return
              }

              // Ensure map is ready
              if (!map || !map._container) {
                console.warn('Map not ready for markers')
                return
              }

              // Create icon using a simpler approach
              const icon = window.L.divIcon({
                className: 'driver-marker',
                html: `
                  <div class="driver-icon ${driver.isOnline ? 'online' : 'offline'}" style="
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    background: ${driver.isOnline ? (driver.isAvailable ? '#10b981' : '#f59e0b') : '#6b7280'};
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ">
                    🚗
                  </div>
                `,
                iconSize: [25, 25],
                iconAnchor: [12, 12],
              })

              const marker = window.L.marker([lat, lng], { icon })
              marker.addTo(map)
              marker.bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold">${driver.firstName || ''} ${driver.lastName || ''}</h3>
                  <p>Status: ${driver.isOnline ? (driver.isAvailable ? 'Available' : 'Busy') : 'Offline'}</p>
                </div>
              `)
            } catch (markerError) {
              console.error('Error creating marker for driver:', driver.id, markerError)
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading demand data:', error)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('demandMap', language) || 'High Demand Areas'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View high demand zones and available drivers</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDrivers}
              onChange={(e) => {
                setShowDrivers(e.target.checked)
                if (mapRef.current?._mapInstance) {
                  loadDemandData(mapRef.current._mapInstance)
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Drivers</span>
          </label>
          <button
            onClick={() => {
              if (mapRef.current?._mapInstance) {
                loadDemandData(mapRef.current._mapInstance)
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="mr-2" size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">High Demand (10+ requests)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Medium Demand (5-9 requests)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Low Demand (&lt;5 requests)</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div ref={mapRef} className="w-full h-full min-h-[600px]" />
      </div>

      {/* Zones Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Demand Zones Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Demand</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {zones.filter(z => z.intensity === 'red').length}
            </p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium Demand</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {zones.filter(z => z.intensity === 'orange').length}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Demand</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {zones.filter(z => z.intensity === 'green').length}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .driver-marker {
          background: transparent;
          border: none;
        }
        .driver-icon {
          position: relative;
          width: 25px;
          height: 25px;
          background: #10b981;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
        }
        .driver-icon.offline {
          background: #6b7280;
        }
        .driver-icon::before {
          content: '🚗';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 14px;
        }
        .driver-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.4);
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

export default DemandMap

