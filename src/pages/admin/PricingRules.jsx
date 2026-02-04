import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import ActionButtons from '../../components/ActionButtons'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t, getLocalizedName } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import {
  FiPlus,
  FiRefreshCw,
  FiDollarSign,
  FiGrid,
  FiList,
  FiTag,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'

const PricingRules = () => {
  const { language } = useLanguage()
  const [rules, setRules] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [calculationResult, setCalculationResult] = useState(null)
  const [formData, setFormData] = useState({
    vehicle_category_id: '',
    base_fare: '',
    base_distance: 5,
    minimum_fare: '',
    per_distance_after_base: '',
    per_minute_drive: '',
    per_minute_wait: '',
    waiting_time_limit: '',
    cancellation_fee: '',
    commission_type: 'percentage',
    admin_commission: '',
    fleet_commission: '',
    status: 1,
  })
  const [calcData, setCalcData] = useState({
    vehicle_category_id: '',
    distance: '',
    duration: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '' })

  useEffect(() => {
    fetchVehicleCategories()
    fetchRules()
  }, [])

  const fetchVehicleCategories = async () => {
    try {
      const response = await api.get('/vehicle-categories')
      if (response.data.success) {
        setVehicleCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching vehicle categories:', error)
    }
  }

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await api.get('/pricing-rules')
      if (response.data.success) {
        setRules(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule)
      setFormData({
        vehicle_category_id: rule.vehicleCategoryId || '',
        base_fare: rule.baseFare ?? '',
        base_distance: rule.baseDistance ?? 5,
        minimum_fare: rule.minimumFare ?? '',
        per_distance_after_base: rule.perDistanceAfterBase ?? '',
        per_minute_drive: rule.perMinuteDrive ?? '',
        per_minute_wait: rule.perMinuteWait ?? '',
        waiting_time_limit: rule.waitingTimeLimit ?? '',
        cancellation_fee: rule.cancellationFee ?? '',
        commission_type: rule.commissionType || 'percentage',
        admin_commission: rule.adminCommission ?? '',
        fleet_commission: rule.fleetCommission ?? '',
        status: rule.status ?? 1,
      })
    } else {
      setEditingRule(null)
      setFormData({
        vehicle_category_id: '',
        base_fare: '',
        base_distance: 5,
        minimum_fare: '',
        per_distance_after_base: '',
        per_minute_drive: '',
        per_minute_wait: '',
        waiting_time_limit: '',
        cancellation_fee: '',
        commission_type: 'percentage',
        admin_commission: '',
        fleet_commission: '',
        status: 1,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRule(null)
  }

  const handleCalculate = async () => {
    try {
      const response = await api.post('/pricing-rules/calculate', calcData)
      if (response.data.success) {
        setCalculationResult(response.data.data)
      }
    } catch (error) {
      console.error('Error calculating price:', error)
      showError(error.response?.data?.message || t('error', language))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRule) {
        await api.put(`/pricing-rules/${editingRule.id}`, formData)
        showSuccess(t('updated', language))
      } else {
        await api.post('/pricing-rules', formData)
        showSuccess(t('saved', language))
      }
      fetchRules()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving pricing rule:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await api.delete(`/pricing-rules/${id}`)
          fetchRules()
          showSuccess(t('deleted', language))
        } catch (error) {
          console.error('Error deleting pricing rule:', error)
          showError(error.response?.data?.message || t('failed', language))
        }
      },
      message: t('deleteConfirm', language),
    })
  }

  const filteredRules = rules.filter((rule) => {
    const name = getLocalizedName(rule.vehicleCategory, language)
    return !searchTerm || name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalCount = rules.length
  const activeCount = rules.filter((r) => r.status === 1).length
  const inactiveCount = rules.filter((r) => r.status !== 1).length

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي القواعد' : 'Total rules',
      value: totalCount,
      icon: FiTag,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: t('active', language),
      value: activeCount,
      icon: FiCheckCircle,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: t('inactive', language),
      value: inactiveCount,
      icon: FiXCircle,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ]

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

  if (loading && rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل قواعد التسعير...' : 'Loading pricing rules...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('pricingRules', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('managePricingRules', language)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchRules}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
            {t('refresh', language)}
          </button>
          <button
            type="button"
            onClick={() => {
              setCalculatorOpen(true)
              setCalculationResult(null)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500 text-orange-600 dark:text-orange-400 px-5 py-2.5 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <FiDollarSign size={18} />
            {t('calculatePrice', language)}
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg transition-colors"
          >
            <FiPlus size={20} />
            {t('addRule', language)}
          </button>
        </div>
      </div>

      {/* Stats */}
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
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-sm text-blue-800 dark:text-blue-200">
        {t('pricingRulesInfo', language).replace('N', formData.base_distance || 5)}
      </div>

      {/* Search + view toggle */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search', language) + '...'}
              language={language}
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'بطاقات' : 'Cards'}
            >
              <FiGrid size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'جدول' : 'Table'}
            >
              <FiList size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Rules: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiTag className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة قواعد التسعير' : 'Pricing rules list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredRules.length} {language === 'ar' ? 'قاعدة' : 'rule(s)'}
          </p>
        </div>

        {filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiDollarSign className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noPricingRulesFound', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm ? (t('tryAdjustingYourSearch', language) || 'Try adjusting your search') : (language === 'ar' ? 'أضف قاعدة تسعير جديدة.' : 'Add a new pricing rule.')}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {getLocalizedName(rule.vehicleCategory, language) || '-'}
                  </h3>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                      rule.status === 1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {rule.status === 1 ? t('active', language) : t('inactive', language)}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex justify-between">
                    <span>{t('baseFare', language)}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{rule.baseFare} SAR</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t('baseDistance', language)}</span>
                    <span className="font-medium">{rule.baseDistance} km</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t('minimumFare', language)}</span>
                    <span className="font-medium">{rule.minimumFare} SAR</span>
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <ActionButtons
                    onEdit={() => handleOpenModal(rule)}
                    onDelete={() => handleDelete(rule.id)}
                    showView={false}
                    showEdit={true}
                    showDelete={true}
                    forceShowIcons={true}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700/70">
                <tr>
                  <TableHeader language={language}>{t('vehicleCategory', language)}</TableHeader>
                  <TableHeader language={language}>{t('baseFare', language)}</TableHeader>
                  <TableHeader language={language}>{t('baseDistance', language)}</TableHeader>
                  <TableHeader language={language}>{t('perKmAfterBase', language)}</TableHeader>
                  <TableHeader language={language}>{t('minimumFare', language)}</TableHeader>
                  <TableHeader language={language}>{t('perMinDrive', language)}</TableHeader>
                  <TableHeader language={language}>{t('cancellationFee', language)}</TableHeader>
                  <TableHeader language={language}>{t('status', language)}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {getLocalizedName(rule.vehicleCategory, language) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rule.baseFare} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                        {rule.baseDistance} km
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rule.perDistanceAfterBase} SAR/km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rule.minimumFare} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rule.perMinuteDrive ?? '-'} SAR/min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rule.cancellationFee ?? '-'} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                          rule.status === 1
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {rule.status === 1 ? t('active', language) : t('inactive', language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons
                        onEdit={() => handleOpenModal(rule)}
                        onDelete={() => handleDelete(rule.id)}
                        showView={false}
                        showEdit={true}
                        showDelete={true}
                        forceShowIcons={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRule ? t('editPricingRule', language) : t('addPricingRule', language)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>{t('vehicleCategory', language)}</label>
            <select
              value={formData.vehicle_category_id}
              onChange={(e) => setFormData({ ...formData, vehicle_category_id: e.target.value })}
              required
              className={inputClass}
            >
              <option value="">{t('selectCategory', language)}</option>
              {vehicleCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getLocalizedName(cat, language)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('baseFare', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.base_fare}
                onChange={(e) => setFormData({ ...formData, base_fare: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('baseDistance', language)}</label>
              <input
                type="number"
                value={formData.base_distance}
                onChange={(e) => setFormData({ ...formData, base_distance: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('perKmAfterBase', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.per_distance_after_base}
                onChange={(e) => setFormData({ ...formData, per_distance_after_base: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('minimumFare', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.minimum_fare}
                onChange={(e) => setFormData({ ...formData, minimum_fare: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('perMinDrive', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.per_minute_drive}
                onChange={(e) => setFormData({ ...formData, per_minute_drive: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('perMinWait', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.per_minute_wait}
                onChange={(e) => setFormData({ ...formData, per_minute_wait: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('cancellationFee', language)} (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cancellation_fee}
                onChange={(e) => setFormData({ ...formData, cancellation_fee: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('adminCommission', language)}</label>
              <input
                type="number"
                step="0.01"
                value={formData.admin_commission}
                onChange={(e) => setFormData({ ...formData, admin_commission: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
            >
              {editingRule ? t('update', language) : t('create', language)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Price Calculator Modal */}
      <Modal
        isOpen={calculatorOpen}
        onClose={() => {
          setCalculatorOpen(false)
          setCalculationResult(null)
        }}
        title={t('priceCalculator', language)}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className={labelClass}>{t('vehicleCategory', language)}</label>
            <select
              value={calcData.vehicle_category_id}
              onChange={(e) => setCalcData({ ...calcData, vehicle_category_id: e.target.value })}
              className={inputClass}
            >
              <option value="">{t('selectCategory', language)}</option>
              {vehicleCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getLocalizedName(cat, language)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{language === 'ar' ? 'المسافة (كم)' : 'Distance (km)'}</label>
            <input
              type="number"
              step="0.01"
              value={calcData.distance}
              onChange={(e) => setCalcData({ ...calcData, distance: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{language === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
            <input
              type="number"
              value={calcData.duration}
              onChange={(e) => setCalcData({ ...calcData, duration: e.target.value })}
              className={inputClass}
            />
          </div>
          {calculationResult && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-4 space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">{t('calculationResult', language)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('baseFare', language)}: {calculationResult.breakdown?.baseFare} SAR</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('extraDistance', language)}: {calculationResult.breakdown?.extraDistance} km</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('distanceCharge', language)}: {calculationResult.breakdown?.distanceCharge} SAR</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('timeCharge', language)}: {calculationResult.breakdown?.timeCharge} SAR</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400 pt-2">
                Total: {calculationResult.totalAmount} SAR
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCalculatorOpen(false)
                setCalculationResult(null)
              }}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {t('close', language)}
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium"
            >
              {t('calculatePrice', language)}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '' })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  )
}

export default PricingRules
