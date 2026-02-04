import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showError } from '../../utils/toast'
import {
  FiArrowLeft,
  FiLayers,
  FiTruck,
  FiStar,
  FiMapPin,
  FiDollarSign,
  FiPackage,
  FiUsers,
} from 'react-icons/fi'

const ServiceCategoryDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/service-categories/${id}`)
      if (response.data.success) {
        setCategory(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching service category:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/service-categories')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <FiArrowLeft size={20} />
          {t('backToServiceCategories', language)}
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FiLayers className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={64} />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('noServiceCategoriesFound', language)}</p>
        </div>
      </div>
    )
  }

  const name = language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)
  const description = language === 'ar'
    ? (category.descriptionAr || category.description)
    : (category.description || category.descriptionAr)
  const isActive = category.status === 1 || category.status === '1'

  return (
    <div className="space-y-8 pb-12">
      {/* Back & breadcrumb */}
      <button
        onClick={() => navigate('/service-categories')}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
      >
        <FiArrowLeft size={20} />
        <span className="font-medium">{t('backToServiceCategories', language)}</span>
      </button>

      {/* Hero header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 dark:from-orange-600 dark:via-orange-700 dark:to-amber-700 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2LTJoLTEydjJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-4xl sm:text-5xl shadow-lg">
                {category.icon || '📦'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">{name}</h1>
                {(category.nameAr || category.name) && (
                  <p className="mt-1 text-white/90 text-sm sm:text-base">
                    {language === 'ar' ? category.name : category.nameAr}
                  </p>
                )}
                {category.slug && (
                  <span className="mt-2 inline-block px-3 py-1 rounded-lg bg-white/20 text-white text-sm font-medium">
                    {category.slug}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`self-start sm:self-center px-4 py-2 rounded-xl text-sm font-semibold shadow-md ${
                isActive
                  ? 'bg-green-500/90 text-white'
                  : 'bg-white/20 text-white backdrop-blur-sm'
              }`}
            >
              {isActive ? t('active', language) : t('inactive', language)}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiLayers className="text-orange-500" size={20} />
              {t('description', language)}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>
      )}

      {/* Vehicle categories section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiTruck className="text-orange-500" size={24} />
          {t('vehicleCategoriesCount', language)}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({category.vehicleCategories?.length || 0})
          </span>
        </h2>

        {!category.vehicleCategories?.length ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FiPackage className="mx-auto text-gray-400 dark:text-gray-500 mb-3" size={48} />
            <p className="text-gray-500 dark:text-gray-400">No vehicle categories in this service</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.vehicleCategories.map((vc) => {
              const vcName = language === 'ar' ? (vc.nameAr || vc.name) : (vc.name || vc.nameAr)
              const features = vc.features || []
              const zones = vc.zones || []
              const pricingRules = vc.pricingRules || []
              const hasPricing = pricingRules.length > 0

              return (
                <div
                  key={vc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/vehicle-categories/${vc.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/vehicle-categories/${vc.id}`)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-hidden>
                        {vc.icon || '🚗'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{vcName}</h3>
                        {vc.slug && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vc.slug}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-medium ${
                          vc.status === 1 || vc.status === '1'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {vc.status === 1 || vc.status === '1' ? t('active', language) : t('inactive', language)}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-4">
                    {/* Capacity / Max load */}
                    {(vc.capacity != null || vc.maxLoad != null) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        {vc.maxLoad != null ? (
                          <>
                            <FiPackage className="text-orange-500 shrink-0" size={18} />
                            <span>{t('maxLoad', language)}: {vc.maxLoad} kg</span>
                          </>
                        ) : (
                          <>
                            <FiUsers className="text-orange-500 shrink-0" size={18} />
                            <span>{t('capacity', language)}: {vc.capacity} {t('seats', language)}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Features */}
                    {features.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <FiStar size={14} />
                          {t('features', language)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {features.map((f) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-xs font-medium border border-orange-100 dark:border-orange-800"
                            >
                              {f.icon && <span role="img" aria-hidden>{f.icon}</span>}
                              {language === 'ar' ? (f.nameAr || f.name) : (f.name || f.nameAr)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zones & Pricing row */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <FiMapPin size={16} className="text-orange-500 shrink-0" />
                        <span>{zones.length} {t('zones', language)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <FiDollarSign
                          size={16}
                          className={hasPricing ? 'text-green-500 shrink-0' : 'text-gray-400 dark:text-gray-500 shrink-0'}
                        />
                        <span
                          className={
                            hasPricing
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        >
                          {hasPricing ? `${pricingRules.length} ${t('pricing', language)}` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-3">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400 group-hover:underline">
                        {t('viewFullDetails', language)} →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceCategoryDetails
