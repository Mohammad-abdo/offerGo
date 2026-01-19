import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiUsers, FiGift, FiSearch } from 'react-icons/fi'

const References = () => {
  const { language } = useLanguage()
  const [references, setReferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReferences()
  }, [])

  const fetchReferences = async () => {
    try {
      const response = await api.get('/references')
      if (response.data.success) {
        setReferences(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching references:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReferences = references.filter((ref) => {
    const search = searchTerm.toLowerCase()
    return (
      ref.referrerUser?.firstName?.toLowerCase().includes(search) ||
      ref.referredUser?.firstName?.toLowerCase().includes(search) ||
      ref.referralCode?.toLowerCase().includes(search)
    )
  })

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
          <h1 className="text-3xl font-bold text-gray-900">References</h1>
          <p className="text-gray-600 mt-1">View referral and reference data</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total References</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{references.length}</p>
            </div>
            <FiUsers className="text-3xl text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Referrers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {new Set(references.map(r => r.referrerUserId)).size}
              </p>
            </div>
            <FiGift className="text-3xl text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referred</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {new Set(references.map(r => r.referredUserId)).size}
              </p>
            </div>
            <FiUsers className="text-3xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferences.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    {t('noData', language)}
                  </td>
                </tr>
              ) : (
                filteredReferences.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ref.referrerUser?.firstName} {ref.referrerUser?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{ref.referrerUser?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ref.referredUser?.firstName} {ref.referredUser?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{ref.referredUser?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ref.referralCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : '-'}
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

export default References



