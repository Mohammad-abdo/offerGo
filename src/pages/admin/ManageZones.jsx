import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi'
import Modal from '../../components/Modal'
import { showSuccess, showError } from '../../utils/toast'
import TableHeader from '../../components/TableHeader'

const ManageZones = () => {
  const { language } = useLanguage()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: '',
    status: 1,
  })
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const geocoderRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    fetchZones()
  }, [])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupMap()
    }
  }, [])

  const fetchZones = async () => {
    try {
      const response = await api.get('/manage-zones/managezone-list')
      if (response.data.success) {
        setZones(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = async (zone = null) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({
        name: zone.name || '',
        latitude: zone.latitude || '',
        longitude: zone.longitude || '',
        description: zone.description || '',
        status: zone.status || 1,
      })
    } else {
      setEditingZone(null)
      setFormData({ 
        name: '', 
        latitude: '', 
        longitude: '', 
        description: '', 
        status: 1 
      })
    }
    setIsModalOpen(true)
    
    // Initialize map after modal opens
    setTimeout(() => {
      initMap(zone)
    }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.latitude || !formData.longitude) {
        showError(t('latitudeAndLongitudeRequired', language) || 'Latitude and Longitude are required')
        return
      }

      const data = {
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        description: formData.description || '',
        status: formData.status,
      }
      
      if (editingZone) {
        await api.put(`/manage-zones/${editingZone.id}`, data)
        showSuccess(t('updated', language) || 'Zone updated successfully')
      } else {
        await api.post('/manage-zones/managezone-save', data)
        showSuccess(t('saved', language) || 'Zone saved successfully')
      }
      await fetchZones()
      setIsModalOpen(false)
      cleanupMap()
    } catch (error) {
      console.error('Error saving zone:', error)
      showError(error.response?.data?.message || t('failed', language) || 'Failed to save zone')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm', language))) return
    try {
      await api.post(`/manage-zones/managezone-delete/${id}`)
      showSuccess(t('deleted', language) || 'Zone deleted successfully')
      await fetchZones()
    } catch (error) {
      console.error('Error deleting zone:', error)
      showError(error.response?.data?.message || t('failed', language) || 'Failed to delete zone')
    }
  }

  const initMap = async (zone = null) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key is not set. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file')
      showError(t('googleMapsApiKeyMissing', language) || 'Google Maps API key is missing. Please configure it in environment variables.')
      return
    }

    // Load Google Maps script if not already loaded
    if (!window.google || !window.google.maps) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => initializeMap(zone))
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`
      script.async = true
      script.defer = true
      script.onload = () => initializeMap(zone)
      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        showError(t('googleMapsLoadError', language) || 'Failed to load Google Maps. Please check your API key.')
      }
      document.head.appendChild(script)
    } else {
      initializeMap(zone)
    }
  }

  const initializeMap = async (zone = null) => {
    if (!mapRef.current || !window.google) return

    try {
      const { Map } = await google.maps.importLibrary('maps')
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
      await google.maps.importLibrary('places')

      let initialPosition

      if (zone && zone.latitude && zone.longitude) {
        initialPosition = { 
          lat: parseFloat(zone.latitude), 
          lng: parseFloat(zone.longitude) 
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initialPosition = { 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            }
            createMap(Map, AdvancedMarkerElement, initialPosition)
          },
          () => {
            // Default to Riyadh, Saudi Arabia
            initialPosition = { lat: 24.7136, lng: 46.6753 }
            createMap(Map, AdvancedMarkerElement, initialPosition)
          }
        )
        return
      } else {
        // Default to Riyadh, Saudi Arabia
        initialPosition = { lat: 24.7136, lng: 46.6753 }
      }

      createMap(Map, AdvancedMarkerElement, initialPosition)
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  const createMap = (Map, AdvancedMarkerElement, initialPosition) => {
    if (!mapRef.current) return

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null
    }
    if (markerRef.current) {
      markerRef.current = null
    }

    // Create map
    const map = new Map(mapRef.current, {
      center: initialPosition,
      zoom: 13,
      mapId: 'DEMO_MAP_ID',
      mapTypeControl: true,
    })

    mapInstanceRef.current = map

    // Create geocoder
    geocoderRef.current = new google.maps.Geocoder()

    // Create place autocomplete
    const autocompleteCard = document.getElementById('place-autocomplete-card')
    if (autocompleteCard && !autocompleteCard.querySelector('#place-autocomplete-input')) {
      const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement()
      placeAutocomplete.id = 'place-autocomplete-input'
      placeAutocomplete.locationBias = initialPosition
      autocompleteCard.appendChild(placeAutocomplete)
      autocompleteRef.current = placeAutocomplete

      // Handle place selection
      placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
        const place = placePrediction.toPlace()
        await place.fetchFields({ 
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'] 
        })

        if (place.viewport) {
          map.fitBounds(place.viewport)
        } else {
          map.setCenter(place.location)
          map.setZoom(17)
        }

        if (markerRef.current) {
          markerRef.current.position = place.location
        } else {
          markerRef.current = new AdvancedMarkerElement({
            map,
            position: place.location,
            gmpDraggable: true,
          })
        }
        updateMarkerPosition(place.location)
      })
    }

    // Create marker
    markerRef.current = new AdvancedMarkerElement({
      map,
      position: initialPosition,
      gmpDraggable: true,
    })

    // Update form when marker is dragged
    markerRef.current.addListener('dragend', () => {
      const pos = markerRef.current.position
      updateMarkerPosition(pos)
    })

    // Update form when map is clicked
    map.addListener('click', (event) => {
      markerRef.current.position = event.latLng
      updateMarkerPosition(event.latLng)
    })

    // Update form fields if editing
    if (initialPosition) {
      updateMarkerPosition(initialPosition)
    }
  }

  const updateMarkerPosition = (location) => {
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng

    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }))

    // Reverse geocode to get address
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          // Optionally update description with address
          // setFormData(prev => ({
          //   ...prev,
          //   description: results[0].formatted_address,
          // }))
        }
      })
    }
  }

  const cleanupMap = () => {
    if (markerRef.current) {
      markerRef.current = null
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null
    }
    if (autocompleteRef.current) {
      const autocompleteCard = document.getElementById('place-autocomplete-card')
      if (autocompleteCard) {
        const input = autocompleteCard.querySelector('#place-autocomplete-input')
        if (input) {
          input.remove()
        }
      }
      autocompleteRef.current = null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('manageZones', language) || 'Manage Zones'}</h1>
          <p className="text-gray-600 mt-1">{t('manageServiceZones', language) || 'Manage service zones and boundaries'}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className={language === 'ar' ? 'ml-2' : 'mr-2'} />
          {t('addZone', language) || 'Add Zone'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>{t('name', language)}</TableHeader>
                <TableHeader>{t('status', language)}</TableHeader>
                <TableHeader>{t('actions', language)}</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zones.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    {t('noData', language)}
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        zone.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.status === 1 ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(zone)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          cleanupMap()
          setIsModalOpen(false)
        }}
        title={editingZone ? t('editZone', language) || 'Edit Zone' : t('addZone', language) || 'Add Zone'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('name', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('status', language)} <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <option value={1}>{t('active', language)}</option>
                <option value={0}>{t('inactive', language)}</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('location', language) || 'Location'}</h4>
            <hr className="mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('searchLocation', language) || 'Search Location'}
                </label>
                <div id="place-autocomplete-card" className="mb-4"></div>
                <div 
                  ref={mapRef}
                  id="map"
                  className="w-full h-96 rounded-lg border border-gray-300"
                  style={{ minHeight: '355px' }}
                ></div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('latitude', language)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('longitude', language)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('description', language)}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                cleanupMap()
                setIsModalOpen(false)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('save', language)}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ManageZones



