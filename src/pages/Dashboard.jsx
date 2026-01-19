import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/translations'
import {
  FiUsers,
  FiTruck,
  FiNavigation,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
  FiMapPin
} from 'react-icons/fi'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const Dashboard = () => {
  const { language } = useLanguage()
  const [stats, setStats] = useState({
    totalRiders: 0,
    totalDrivers: 0,
    totalFleets: 0,
    totalRides: 0,
    completedRides: 0,
    pendingRides: 0,
    cancelledRides: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    activeDrivers: 0,
    activeRiders: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentRides, setRecentRides] = useState([])
  const [scheduledRides, setScheduledRides] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchDashboardData()
    fetchRecentRides()
    fetchScheduledRides()
    generateChartData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/admin-dashboard')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentRides = async () => {
    try {
      const response = await api.get('/ride-requests/riderequest-list?per_page=5')
      if (response.data.success) {
        setRecentRides(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching recent rides:', error)
    }
  }

  const fetchScheduledRides = async () => {
    try {
      // Try new endpoint first (for prepaid scheduled rides)
      const response = await api.get('/rides/upcoming?limit=10&all=true')
      if (response.data && response.data.success) {
        console.log('✅ Scheduled rides fetched successfully:', response.data.data?.length || 0, 'rides')
        setScheduledRides(response.data.data || [])
        return
      }
    } catch (error) {
      console.warn('⚠️ Error fetching scheduled rides from /rides/upcoming:', error.message)
      // Continue to fallback
    }
    
    // Fallback to alternative endpoint (for all scheduled rides)
    try {
      const altResponse = await api.get('/ride-requests/riderequest-list?isSchedule=true&per_page=10')
      if (altResponse.data && altResponse.data.success) {
        // Filter to show only scheduled/prepaid rides
        const scheduled = (altResponse.data.data || []).filter(ride => 
          ride.isSchedule === true && (ride.status === 'scheduled' || ride.status === 'pending' || ride.status === 'active')
        )
        console.log('✅ Scheduled rides from fallback:', scheduled.length, 'rides')
        setScheduledRides(scheduled)
      }
    } catch (altError) {
      console.error('❌ Error fetching scheduled rides from alternative endpoint:', altError.message)
      // Set empty array to show "no scheduled rides" message
      setScheduledRides([])
    }
  }

  const generateChartData = () => {
    // Generate sample data for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const data = months.map(month => ({
      name: month,
      rides: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      drivers: Math.floor(Math.random() * 20) + 10
    }))
    setChartData(data)
  }

  const statCards = [
    {
      title: t('total_riders', language),
      value: stats.totalRiders || 0,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: t('total_drivers', language),
      value: stats.totalDrivers || 0,
      icon: FiTruck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+8%',
      trend: 'up'
    },
    {
      title: t('total_rides', language),
      value: stats.totalRides || 0,
      icon: FiNavigation,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+15%',
      trend: 'up'
    },
    {
      title: t('completed_rides', language),
      value: stats.completedRides || 0,
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      change: '+10%',
      trend: 'up'
    },
    {
      title: t('total_revenue', language),
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      change: '+22%',
      trend: 'up'
    },
    {
      title: t('today_revenue', language),
      value: `$${(stats.todayRevenue || 0).toLocaleString()}`,
      icon: FiTrendingUp,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      change: '+5%',
      trend: 'up'
    }
  ]

  const pieData = [
    { name: t('completed', language), value: stats.completedRides || 0, color: '#10b981' },
    { name: t('pending', language), value: stats.pendingRides || 0, color: '#f59e0b' },
    { name: t('cancelled', language), value: stats.cancelledRides || 0, color: '#ef4444' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard', language)}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('welcome_back', language)}, {t('manage_your_service', language)}</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('last_updated', language)}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">{stat.title}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor} truncate`}>{stat.value}</p>
                <div className="flex items-center mt-2 flex-wrap">
                  {stat.trend === 'up' ? (
                    <FiArrowUp className="text-green-500 mr-1 flex-shrink-0" size={14} />
                  ) : (
                    <FiArrowDown className="text-red-500 mr-1 flex-shrink-0" size={14} />
                  )}
                  <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">{t('vs_last_month', language)}</span>
                </div>
              </div>
              <div className={`${stat.bgColor} dark:bg-gray-700 rounded-xl p-3 sm:p-4 flex-shrink-0`}>
                <stat.icon className={`text-2xl sm:text-3xl ${stat.textColor} dark:text-gray-300`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('revenue_overview', language)}</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{t('revenue', language)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rides Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('rides_overview', language)}</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{t('rides', language)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rides" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Ride Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('ride_status', language)}</h2>
          <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Rides */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('recent_rides', language)}</h2>
            <a
              href="/ride-requests"
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center"
            >
              <span className="hidden sm:inline">{t('view_all', language)}</span>
              <span className="sm:hidden">{t('view_all', language).substring(0, 3)}</span>
              <FiArrowUp className="ml-1 rotate-45" size={14} />
            </a>
          </div>
          {recentRides.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {recentRides.map((ride, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 dark:from-gray-700/50 to-white dark:to-gray-800 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      ride.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                      ride.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <FiNavigation className={
                        ride.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                        ride.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      } size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {t('ride', language)} #{ride.id || index + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{ride.status || t('pending', language)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      ${ride.totalAmount || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
                      <FiClock className="mr-1" size={12} />
                      <span className="hidden sm:inline">{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : t('today', language)}</span>
                      <span className="sm:hidden">{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : t('today', language)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
              <FiNavigation className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={48} />
              <p className="text-sm sm:text-base">{t('no_recent_rides', language)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Rides Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FiCalendar className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {t('scheduled_rides', language) || 'الرحلات المجدولة'}
            </h2>
            {scheduledRides.length > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                {scheduledRides.length}
              </span>
            )}
          </div>
          <a
            href="/ride-requests?isSchedule=true"
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center"
          >
            <span className="hidden sm:inline">{t('view_all', language)}</span>
            <span className="sm:hidden">{t('view_all', language)?.substring(0, 3) || 'All'}</span>
            <FiArrowUp className="ml-1 rotate-45" size={14} />
          </a>
        </div>
        {scheduledRides && scheduledRides.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {scheduledRides.map((ride) => {
              const scheduledDate = ride.scheduleDatetime ? new Date(ride.scheduleDatetime) : null
              const now = new Date()
              const timeUntilRide = scheduledDate ? scheduledDate.getTime() - now.getTime() : 0
              const hoursUntil = Math.floor(timeUntilRide / (1000 * 60 * 60))
              const minutesUntil = Math.floor((timeUntilRide % (1000 * 60 * 60)) / (1000 * 60))
              
              return (
                <div
                  key={ride.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-white dark:to-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                      <FiCalendar className="text-blue-600 dark:text-blue-400" size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {t('ride', language)} #{ride.id}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          ride.status === 'scheduled' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                            : ride.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {ride.status === 'scheduled' ? (t('scheduled', language) || 'مجدولة') : 
                           ride.status === 'active' ? (t('active', language) || 'نشطة') : 
                           ride.status}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <FiMapPin className="mr-1" size={12} />
                          <span className="truncate max-w-[150px] sm:max-w-none">
                            {ride.startAddress || t('pickup_location', language) || 'موقع الالتقاء'}
                          </span>
                        </div>
                        {scheduledDate && (
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <FiClock className="mr-1" size={12} />
                            <span>
                              {scheduledDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {timeUntilRide > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {hoursUntil > 0 
                            ? `${hoursUntil} ${t('hours', language) || 'ساعة'} ${minutesUntil > 0 ? `${minutesUntil} ${t('minutes', language) || 'دقيقة'}` : ''}`
                            : `${minutesUntil} ${t('minutes', language) || 'دقيقة'}`
                          } {t('until_ride', language) || 'حتى الرحلة'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      ${ride.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                    {ride.driver && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ride.driver.firstName} {ride.driver.lastName}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
            <FiCalendar className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={48} />
            <p className="text-sm sm:text-base">{t('no_scheduled_rides', language) || 'لا توجد رحلات مجدولة'}</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-blue-100 text-xs sm:text-sm font-medium truncate">{t('active_drivers', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.activeDrivers || 0}</p>
            </div>
            <FiActivity size={24} className="sm:w-8 sm:h-8 opacity-80 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-green-100 text-xs sm:text-sm font-medium truncate">{t('active_riders', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.activeRiders || 0}</p>
            </div>
            <FiUsers size={24} className="sm:w-8 sm:h-8 opacity-80 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-purple-100 text-xs sm:text-sm font-medium truncate">{t('pending_rides', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.pendingRides || 0}</p>
            </div>
            <FiClock size={24} className="sm:w-8 sm:h-8 opacity-80 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-red-100 text-xs sm:text-sm font-medium truncate">{t('cancelled_rides', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.cancelledRides || 0}</p>
            </div>
            <FiAlertCircle size={24} className="sm:w-8 sm:h-8 opacity-80 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
