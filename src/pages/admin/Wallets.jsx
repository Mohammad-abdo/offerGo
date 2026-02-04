import { useState, useEffect } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import TableHeader from '../../components/TableHeader'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { showSuccess, showError } from '../../utils/toast'
import {
  FiDollarSign,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiUser,
  FiCreditCard,
} from 'react-icons/fi'

const Wallets = () => {
  const { language } = useLanguage()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'credit',
    description: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards')

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/wallets')
      if (response.data.success) {
        setWallets(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
      showError(error.response?.data?.message || t('failed', language))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (wallet) => {
    setSelectedWallet(wallet)
    setFormData({ amount: '', type: 'credit', description: '' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedWallet) return
    try {
      await api.post(`/wallets/${selectedWallet.id}/transaction`, formData)
      showSuccess(t('updated', language))
      fetchWallets()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error updating wallet:', error)
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0)
  const activeWalletsCount = wallets.filter((w) => parseFloat(w.balance) > 0).length

  const filteredWallets = wallets.filter((wallet) => {
    const search = searchTerm.toLowerCase()
    const name = `${wallet.user?.firstName || ''} ${wallet.user?.lastName || ''}`.trim().toLowerCase()
    const email = (wallet.user?.email || '').toLowerCase()
    const type = (wallet.user?.userType || '').toLowerCase()
    return !searchTerm || name.includes(search) || email.includes(search) || type.includes(search) || String(wallet.id).includes(search)
  })

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي المحافظ' : 'Total wallets',
      value: wallets.length,
      icon: FiCreditCard,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      label: language === 'ar' ? 'إجمالي الرصيد' : 'Total balance',
      value: totalBalance.toFixed(2),
      suffix: ' SAR',
      icon: FiDollarSign,
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: language === 'ar' ? 'محافظ برصيد' : 'With balance',
      value: activeWalletsCount,
      icon: FiTrendingUp,
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  ]

  if (loading && wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {language === 'ar' ? 'جاري تحميل المحافظ...' : 'Loading wallets...'}
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
            {t('wallet', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {language === 'ar'
              ? 'إدارة محافظ المستخدمين — عرض الأرصدة وإضافة أو خصم الرصيد.'
              : 'Manage user wallets — view balances and add or deduct funds.'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWallets}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FiRefreshCw size={18} />
          {t('refresh', language)}
        </button>
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
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}{stat.suffix ?? ''}
              </p>
            </div>
          </div>
        ))}
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

      {/* Wallets: Cards or Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCreditCard className="text-orange-500" size={24} />
            {language === 'ar' ? 'قائمة المحافظ' : 'Wallets list'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {filteredWallets.length} {language === 'ar' ? 'محفظة' : 'wallet(s)'}
          </p>
        </div>

        {filteredWallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
              <FiCreditCard className="text-orange-500 dark:text-orange-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {t('noData', language)}
            </h3>
            <p className="mt-2 text-center text-gray-500 dark:text-gray-400 max-w-md">
              {language === 'ar' ? 'لا توجد محافظ.' : 'No wallets found.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
                      {(wallet.user?.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {wallet.user?.firstName} {wallet.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{wallet.user?.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 capitalize">
                    {wallet.user?.userType}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-1.5">
                    <FiDollarSign className="text-emerald-500" size={18} />
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {parseFloat(wallet.balance || 0).toFixed(2)} SAR
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(wallet)}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                  >
                    {language === 'ar' ? 'إدارة' : 'Manage'}
                  </button>
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
                  <TableHeader language={language}>{language === 'ar' ? 'نوع المستخدم' : 'User type'}</TableHeader>
                  <TableHeader language={language}>{language === 'ar' ? 'الرصيد' : 'Balance'}</TableHeader>
                  <TableHeader language={language}>{t('actions', language)}</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
                          {(wallet.user?.firstName?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {wallet.user?.firstName} {wallet.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{wallet.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 capitalize">
                        {wallet.user?.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(wallet.balance || 0).toFixed(2)} SAR
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(wallet)}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                      >
                        {language === 'ar' ? 'إدارة' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Manage wallet */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedWallet
            ? (language === 'ar' ? 'إدارة المحفظة — ' : 'Manage wallet — ') +
              `${selectedWallet.user?.firstName || ''} ${selectedWallet.user?.lastName || ''}`.trim()
            : (language === 'ar' ? 'إدارة المحفظة' : 'Manage wallet')
        }
        size="md"
      >
        {selectedWallet && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'الرصيد الحالي' : 'Current balance'}
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {parseFloat(selectedWallet.balance || 0).toFixed(2)} SAR
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === 'ar' ? 'نوع العملية' : 'Transaction type'}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="credit">{language === 'ar' ? 'إضافة رصيد' : 'Add funds (Credit)'}</option>
                <option value="debit">{language === 'ar' ? 'خصم رصيد' : 'Deduct funds (Debit)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('amount', language)} *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="0.01"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('description', language)}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                {t('cancel', language)}
              </button>
              <button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
                {t('save', language)}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default Wallets
