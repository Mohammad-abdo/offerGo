import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showError } from '../../utils/toast'
import {
  FiArrowLeft,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiDollarSign,
  FiStar,
  FiPackage,
  FiLayers,
  FiTrendingUp,
  FiCheckCircle,
  FiGrid,
} from 'react-icons/fi'

const VehicleCategoryDetails = () => {
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
      const response = await api.get(`/vehicle-categories/${id}`)
      if (response.data.success) {
        setCategory(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching vehicle category:', error)
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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <FiArrowLeft size={20} />
          {t('backToServiceCategory', language)}
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FiTruck className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={64} />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Vehicle category not found</p>
        </div>
      </div>
    )
  }

  const name = language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)
  const description = language === 'ar'
    ? (category.descriptionAr || category.description)
    : (category.description || category.descriptionAr)
  const isActive = category.status === 1 || category.status === '1'
  const stats = category.stats || {}
  const serviceCategory = category.serviceCategory

  const statCards = [
    {
      label: t('driversCount', language),
      value: stats.driversCount ?? 0,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500',
    },
    {
      label: t('ridesCount', language),
      value: stats.ridesCount ?? 0,
      icon: FiTrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-500',
    },
    {
      label: t('completedRidesCount', language),
      value: stats.completedRidesCount ?? 0,
      icon: FiCheckCircle,
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-500',
    },
    {
      label: t('servicesCount', language),
      value: stats.servicesCount ?? category.services?.length ?? 0,
      icon: FiGrid,
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-500',
    },
    {
      label: t('totalRevenue', language),
      value: typeof (stats.totalRevenue ?? 0) === 'number'
        ? `${(stats.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : (stats.totalRevenue ?? '0.00'),
      suffix: ' SAR',
      icon: FiDollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-500',
    },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate(serviceCategory?.id ? `/service-categories/${serviceCategory.id}` : -1)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
      >
        <FiArrowLeft size={20} />
        <span className="font-medium">{t('backToServiceCategory', language)}</span>
      </button>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-600 shadow-xl">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm text-4xl sm:text-5xl shadow-lg">
                {category.icon || '🚗'}
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
                {serviceCategory && (
                  <p className="mt-2 text-white/80 text-sm flex items-center gap-1">
                    <FiLayers size={14} />
                    {language === 'ar' ? (serviceCategory.nameAr || serviceCategory.name) : (serviceCategory.name || serviceCategory.nameAr)}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`self-start sm:self-center px-4 py-2 rounded-xl text-sm font-semibold shadow-md ${
                isActive ? 'bg-green-500/90 text-white' : 'bg-white/20 text-white backdrop-blur-sm'
              }`}
            >
              {isActive ? t('active', language) : t('inactive', language)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${stat.bgLight}`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</span>
                <stat.icon className={`${stat.iconColor}`} size={24} />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}{stat.suffix ?? ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      {description && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTruck className="text-orange-500" size={20} />
              {t('description', language)}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        </div>
      )}

      {/* Capacity / Max load */}
      {(category.capacity != null || category.maxLoad != null) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiPackage className="text-orange-500" size={20} />
            {category.maxLoad != null ? t('maxLoad', language) : t('capacity', language)}
          </h2>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
            {category.maxLoad != null ? `${category.maxLoad} kg` : `${category.capacity} ${t('seats', language)}`}
          </p>
        </div>
      )}

      {/* Features */}
      {category.features?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiStar className="text-orange-500" size={20} />
              {t('features', language)}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {category.features.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800 text-sm font-medium"
                >
                  {f.icon && <span role="img" aria-hidden>{f.icon}</span>}
                  {language === 'ar' ? (f.nameAr || f.name) : (f.name || f.nameAr)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zones */}
      {category.zones?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiMapPin className="text-orange-500" size={20} />
              {t('zones', language)}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.zones.map((z) => {
                const zone = z.geographicZone
                if (!zone) return null
                const zoneName = language === 'ar' ? (zone.nameAr || zone.name) : (zone.name || zone.nameAr)
                return (
                  <div
                    key={z.id}
                    className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    {zoneName}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pricing rules */}
      {category.pricingRules?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiDollarSign className="text-orange-500" size={20} />
              {t('pricing', language)}
            </h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-2 pr-4">{t('baseFare', language)}</th>
                  <th className="py-2 pr-4">{t('minimumFare', language)}</th>
                  <th className="py-2 pr-4">Per km</th>
                  <th className="py-2 pr-4">{t('status', language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {category.pricingRules.map((rule) => (
                  <tr key={rule.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="py-3 pr-4 font-medium">${(rule.baseFare ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">${(rule.minimumFare ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">${(rule.perDistanceAfterBase ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          rule.status === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {rule.status === 1 ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related services */}
      {category.services?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiGrid className="text-orange-500" size={20} />
              {t('relatedServices', language)}
            </h2>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {category.services.map((svc) => (
                <li
                  key={svc.id}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  {language === 'ar' ? (svc.nameAr || svc.name) : (svc.name || svc.nameAr)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleCategoryDetails
