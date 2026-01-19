import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiDollarSign, FiFilter, FiDownload, FiSearch } from 'react-icons/fi'

const Payments = () => {
  const { language } = useLanguage()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentType, setPaymentType] = useState('all') // all, cash, online, wallet
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [paymentType])

  const fetchPayments = async () => {
    try {
      const params = paymentType !== 'all' ? `?payment_type=${paymentType}` : ''
      const response = await api.get(`/payments${params}`)
      if (response.data.success) {
        setPayments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const search = searchTerm.toLowerCase()
    return (
      payment.rideRequestId?.toString().includes(search) ||
      payment.user?.email?.toLowerCase().includes(search) ||
      payment.driver?.email?.toLowerCase().includes(search)
    )
  })

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">View and manage payment transactions</p>
        </div>
        <button 
          onClick={() => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
            const token = localStorage.getItem('token')
            const params = new URLSearchParams()
            if (paymentType !== 'all') params.append('payment_type', paymentType)
            params.append('format', 'excel')
            
            window.open(`${apiUrl}/payments/export?${params.toString()}`, '_blank')
          }}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiDownload className="mr-2" />
          {t('export', language) || 'Export'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{filteredPayments.length}</p>
            </div>
            <FiDollarSign className="text-3xl text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600 mt-2">${totalAmount.toFixed(2)}</p>
            </div>
            <FiDollarSign className="text-3xl text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cash Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {filteredPayments.filter(p => p.paymentType === 'cash').length}
              </p>
            </div>
            <FiDollarSign className="text-3xl text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Online Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {filteredPayments.filter(p => p.paymentType === 'online').length}
              </p>
            </div>
            <FiDollarSign className="text-3xl text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'cash', 'online', 'wallet'].map((type) => (
              <button
                key={type}
                onClick={() => setPaymentType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paymentType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search', language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {t('noData', language)}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{payment.rideRequestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.user?.firstName} {payment.user?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.driver?.firstName} {payment.driver?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${parseFloat(payment.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {payment.paymentType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.paymentStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Payments



