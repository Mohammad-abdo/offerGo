import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import {
  FiSettings,
  FiRefreshCw,
  FiDollarSign,
  FiNavigation,
  FiGlobe,
  FiSave,
} from 'react-icons/fi'
import { showSuccess, showError } from '../../utils/toast'

const LABELS = {
  appName: { en: 'App Name', ar: 'اسم التطبيق' },
  currency: { en: 'Currency', ar: 'العملة' },
  distanceUnit: { en: 'Distance Unit', ar: 'وحدة المسافة' },
}

const Settings = () => {
  const { language } = useLanguage()
  const [settings, setSettings] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings/get-setting')
      if (response.data.success && response.data.data) {
        const data = response.data.data
        setSettings(data)
        setFormData({
          appName: data.appName ?? 'offerGo',
          currency: data.currency ?? 'USD',
          distanceUnit: data.distanceUnit ?? 'km',
          ...data,
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value ?? '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post('/settings/save-setting', formData)
      showSuccess(t('updated', language) || (language === 'ar' ? 'تم الحفظ' : 'Saved'))
      setSettings({ ...formData })
    } catch (error) {
      console.error('Error saving settings:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}
        </p>
      </div>
    )
  }

  const statCards = [
    {
      label: language === 'ar' ? 'اسم التطبيق' : 'App Name',
      value: (settings?.appName || formData.appName || 'offerGo').toString().slice(0, 20),
      icon: FiGlobe,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'العملة' : 'Currency',
      value: (settings?.currency || formData.currency || 'USD').toString(),
      icon: FiDollarSign,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: language === 'ar' ? 'وحدة المسافة' : 'Distance Unit',
      value: (settings?.distanceUnit || formData.distanceUnit || 'km').toString(),
      icon: FiNavigation,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ]

  const inputClass =
    'w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
  const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'

  const entries = Object.entries(formData)

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar'
              ? 'التحكم في كل إعدادات التطبيق من هذه الصفحة — الاسم، العملة، وحدة المسافة، وأي مفاتيح أخرى.'
              : 'Control all application settings from this page — app name, currency, distance unit, and any other keys.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
        </div>
      </div>

      {/* Stats / Settings cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border ${stat.borderColor} overflow-hidden shadow-sm ${stat.bgLight}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white truncate">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Application Settings – editable, control everything */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <FiSettings className="text-orange-500 dark:text-orange-400" size={24} />
          {language === 'ar' ? 'التحكم في إعدادات التطبيق' : 'Application Settings'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {entries.map(([key, value]) => (
            <div key={key}>
              <label className={labelClass} htmlFor={`setting-${key}`}>
                {LABELS[key] ? LABELS[key][language === 'ar' ? 'ar' : 'en'] : key}
              </label>
              <input
                id={`setting-${key}`}
                type="text"
                value={value ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className={inputClass}
                placeholder={key}
              />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={fetchSettings}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiSave size={18} />
              {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (t('save', language) || (language === 'ar' ? 'حفظ' : 'Save'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
