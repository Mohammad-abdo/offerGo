import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiMapPin, FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi'
import { showSuccess, showError } from '../../utils/toast'
import api from '../../utils/api'

const WorkAreas = () => {
  const { language } = useLanguage()
  const mapRef = useRef(null)
  const [areas, setAreas] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentArea, setCurrentArea] = useState(null)
  const [areaName, setAreaName] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const drawnLayerRef = useRef(null)

  useEffect(() => {
    const loadMapLibrary = () => {
      if (window.L) {
        // Check if Draw is also loaded
        if (window.L.Control && window.L.Control.Draw) {
          setMapLoaded(true)
          initializeMap()
        } else {
          // Leaflet loaded but Draw not yet - try to load Draw
          const existingDrawScript = document.querySelector('script[src*="leaflet-draw"]')
          if (!existingDrawScript) {
            const drawLink = document.createElement('link')
            drawLink.rel = 'stylesheet'
            drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css'
            document.head.appendChild(drawLink)

            const drawScript = document.createElement('script')
            drawScript.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js'
            drawScript.onload = () => {
              setTimeout(() => {
                setMapLoaded(true)
                initializeMap()
              }, 200)
            }
            document.body.appendChild(drawScript)
          } else {
            setMapLoaded(true)
            initializeMap()
          }
        }
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      const drawLink = document.createElement('link')
      drawLink.rel = 'stylesheet'
      drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css'
      document.head.appendChild(drawLink)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => {
        // Wait a bit to ensure Leaflet is fully loaded
        setTimeout(() => {
          // Check if draw script already exists
          const existingDrawScript = document.querySelector('script[src*="leaflet-draw"]')
          if (existingDrawScript) {
            // If already loaded, just initialize
            if (window.L.Control && window.L.Control.Draw) {
              setMapLoaded(true)
              initializeMap()
            } else {
              // Wait a bit more
              setTimeout(() => {
                setMapLoaded(true)
                initializeMap()
              }, 200)
            }
            return
          }

          const drawScript = document.createElement('script')
          drawScript.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js'
          drawScript.onload = () => {
            // Wait a bit more to ensure Draw is fully loaded
            setTimeout(() => {
              if (window.L.Control && window.L.Control.Draw) {
                setMapLoaded(true)
                initializeMap()
              } else {
                console.warn('Leaflet Draw loaded but Control.Draw not available yet')
                setMapLoaded(true)
                initializeMap()
              }
            }, 200)
          }
          drawScript.onerror = () => {
            console.error('Failed to load Leaflet Draw')
            setMapLoaded(true)
            initializeMap()
          }
          document.body.appendChild(drawScript)
        }, 200)
      }
      script.onerror = () => {
        console.error('Failed to load Leaflet')
        setMapLoaded(true)
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
    drawnLayerRef.current = new window.L.FeatureGroup()
    map.addLayer(drawnLayerRef.current)

    // Add draw control only if Leaflet Draw is loaded
    if (!window.L.Control || !window.L.Control.Draw) {
      console.warn('Leaflet Draw is not loaded. Drawing features will not be available.')
      // Still load areas even if Draw is not available
      loadAreas(map)
      return
    }

    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnLayerRef.current,
        remove: true,
      },
      draw: {
        polygon: true,
        rectangle: true,
        circle: true,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
    })
    map.addControl(drawControl)
    map._drawControl = drawControl // Store reference for later use

    // Handle draw events (only if Draw is available)
    if (window.L.Draw && window.L.Draw.Event) {
      map.on(window.L.Draw.Event.CREATED, (e) => {
        const layer = e.layer
        drawnLayerRef.current.addLayer(layer)
        
        const bounds = layer.getBounds()
        const center = bounds.getCenter()
        const coordinates = layer.toGeoJSON().geometry.coordinates

        setCurrentArea({
          layer,
          coordinates,
          center: [center.lat, center.lng],
          bounds: bounds.toBBoxString(),
        })
        setIsDrawing(false)
      })
    }

    // Load existing areas
    loadAreas(map)
  }

  const loadAreas = (map) => {
    // Mock areas - replace with API call
    const mockAreas = [
      {
        id: 1,
        name: 'Downtown Area',
        coordinates: [[[24.7100, 46.6700], [24.7200, 46.6700], [24.7200, 46.6800], [24.7100, 46.6800], [24.7100, 46.6700]]],
        center: [24.7150, 46.6750],
      },
    ]

    setAreas(mockAreas)

    mockAreas.forEach(area => {
      const polygon = window.L.polygon(area.coordinates[0], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      }).addTo(map)

      polygon.bindPopup(`<b>${area.name}</b>`)
    })
  }

  const handleSaveArea = async () => {
    if (!currentArea || !areaName.trim()) {
      showError('Please enter an area name')
      return
    }

    try {
      // Calculate center point from polygon coordinates
      const coords = currentArea.coordinates[0] || currentArea.coordinates
      let sumLat = 0
      let sumLng = 0
      let count = 0

      coords.forEach(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          sumLat += parseFloat(coord[0] || coord[1])
          sumLng += parseFloat(coord[1] || coord[0])
          count++
        }
      })

      if (count === 0) {
        showError('Invalid area coordinates')
        return
      }

      const centerLat = sumLat / count
      const centerLng = sumLng / count

      // Save to database using manage-zones endpoint
      const response = await api.post('/manage-zones/managezone-save', {
        name: areaName,
        latitude: centerLat,
        longitude: centerLng,
        description: JSON.stringify({
          type: 'polygon',
          coordinates: coords
        }),
        status: 1
      })

      if (response.data.success) {
        const newArea = {
          id: response.data.data.id,
          name: areaName,
          coordinates: currentArea.coordinates,
          center: currentArea.center,
        }

        setAreas([...areas, newArea])
        setCurrentArea(null)
        setAreaName('')
        showSuccess('Area saved successfully to database')
      } else {
        showError(response.data.message || 'Failed to save area')
      }
    } catch (error) {
      console.error('Error saving area:', error)
      showError(error.response?.data?.message || 'Failed to save area to database')
    }
  }

  const handleDeleteArea = (id) => {
    setAreas(areas.filter(area => area.id !== id))
    showSuccess('Area deleted successfully')
  }

  const startDrawing = () => {
    if (!window.L.Control || !window.L.Control.Draw) {
      alert('Leaflet Draw is not available. Please refresh the page.')
      return
    }
    setIsDrawing(true)
    if (mapRef.current?._mapInstance) {
      const map = mapRef.current._mapInstance
      const drawControl = map._drawControl
      if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
        // Trigger polygon drawing
        const polygonDrawer = drawControl._toolbars.draw._modes?.polygon
        if (polygonDrawer && polygonDrawer.handler) {
          polygonDrawer.handler.enable()
        }
      }
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('workAreas', language) || 'Work Areas'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Define areas where vehicles can operate</p>
        </div>
        <button
          onClick={startDrawing}
          disabled={!mapLoaded || !window.L?.Control?.Draw}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            mapLoaded && window.L?.Control?.Draw
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
          title={!mapLoaded || !window.L?.Control?.Draw ? 'Leaflet Draw is loading...' : 'Draw Area'}
        >
          <FiPlus className="mr-2" size={18} />
          Draw Area
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full min-h-[600px]" />
        
        {/* Area Name Input */}
        {currentArea && (
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[1000] min-w-[300px]">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Save Area</h3>
            <input
              type="text"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Enter area name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveArea}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSave className="mr-2" size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setCurrentArea(null)
                  setAreaName('')
                  if (currentArea?.layer) {
                    drawnLayerRef.current?.removeLayer(currentArea.layer)
                  }
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <FiX className="mr-2" size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Areas List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Defined Areas</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {areas.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No areas defined yet</p>
          ) : (
            areas.map(area => (
              <div
                key={area.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <FiMapPin className="text-blue-600 dark:text-blue-400" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{area.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Center: {area.center[0].toFixed(4)}, {area.center[1].toFixed(4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteArea(area.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkAreas

