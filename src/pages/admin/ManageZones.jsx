import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiRefreshCw, FiGrid, FiList, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import { showSuccess, showError } from '../../utils/toast'
import TableHeader from '../../components/TableHeader'

const ManageZones = () => {
  const { language } = useLanguage()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })
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
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.post(`/manage-zones/managezone-delete/${id}`)
          showSuccess(t('deleted', language) || 'Zone deleted successfully')
          await fetchZones()
        } catch (error) {
          console.error('Error deleting zone:', error)
          showError(error.response?.data?.message || t('failed', language) || 'Failed to delete zone')
        }
      },
      message: t('deleteConfirm', language),
    })
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

  const filteredZones = zones.filter((z) => !searchTerm || (z.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  const totalCount = zones.length
  const activeCount = zones.filter((z) => z.status === 1).length
  const inactiveCount = zones.filter((z) => z.status !== 1).length
  const statCards = [
    { label: language === 'ar' ? 'إجمالي المناطق' : 'Total zones', value: totalCount, icon: FiMapPin, bgLight: 'bg-slate-50 dark:bg-slate-900/30', iconColor: 'text-slate-600 dark:text-slate-400', borderColor: 'border-slate-200 dark:border-slate-700' },
    { label: t('active', language), value: activeCount, icon: FiCheckCircle, bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    { label: t('inactive', language), value: inactiveCount, icon: FiXCircle, bgLight: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'جاري تحميل المناطق...' : 'Loading zones...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('manageZones', language) || 'Manage Zones'}</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">{t('manageServiceZones', language) || 'Manage service zones and boundaries'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchZones} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button type="button" onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors">
            <FiPlus size={18} />
            {t('addZone', language) || 'Add Zone'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.borderColor} overflow-hidden shadow-sm ${stat.bgLight}`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</span>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search', language) + '...'} language={language} />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button type="button" onClick={() => setViewMode('cards')} className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'بطاقات' : 'Cards'}>
              <FiGrid size={20} />
            </button>
            <button type="button" onClick={() => setViewMode('table')} className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} title={language === 'ar' ? 'جدول' : 'Table'}>
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMapPin className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة المناطق' : 'Zones list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filteredZones.length} {language === 'ar' ? 'منطقة' : 'zone(s)'}</p>
        </div>

        {filteredZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiMapPin className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('noData', language)}</h3>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                      <FiMapPin size={24} />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{zone.name}</span>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${zone.status === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                    {zone.status === 1 ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                {zone.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{zone.description}</p>}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  <button type="button" onClick={() => handleOpenModal(zone)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title={t('edit', language)}><FiEdit size={18} /></button>
                  <button type="button" onClick={() => handleDelete(zone.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}><FiTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/70">
              <tr>
                <TableHeader language={language}>{t('name', language)}</TableHeader>
                <TableHeader language={language}>{t('status', language)}</TableHeader>
                <TableHeader language={language}>{t('actions', language)}</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <FiMapPin className="text-orange-600 dark:text-orange-400 shrink-0" size={18} />
                      <span className="font-medium text-gray-900 dark:text-white">{zone.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${zone.status === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                      {zone.status === 1 ? t('active', language) : t('inactive', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleOpenModal(zone)} className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title={t('edit', language)}><FiEdit size={18} /></button>
                      <button type="button" onClick={() => handleDelete(zone.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('delete', language)}><FiTrash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={() => { cleanupMap(); setIsModalOpen(false) }} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              {t('cancel', language)}
            </button>
            <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              {t('save', language)}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })} onConfirm={confirmDialog.onConfirm || (() => {})} message={confirmDialog.message} type="danger" />
    </div>
  )
}

export default ManageZones




