import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { t } from '../utils/translations'
import { useState } from 'react'
import {
  FiHome,
  FiUsers,
  FiTruck,
  FiNavigation,
  FiSettings,
  FiFileText,
  FiAlertCircle,
  FiBarChart2,
  FiMenu,
  FiX,
  FiBell,
  FiSearch,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiGift,
  FiMapPin,
  FiDollarSign,
  FiShield,
  FiMail,
  FiMessageSquare,
  FiGlobe,
  FiLayers,
  FiCreditCard,
  FiHelpCircle,
  FiXCircle,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiActivity,
  FiSun,
  FiMoon,
  FiMap,
  FiStar,
  FiTarget
} from 'react-icons/fi'

const Layout = () => {
  const { user, logout } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const { theme, toggleTheme, colors } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navigation = [
    { name: t('dashboard', language), key: 'dashboard', href: '/dashboard', icon: FiHome },
    { 
      name: t('user_management', language), 
      key: 'users',
      icon: FiUsers,
      children: [
        { name: t('riders', language), key: 'riders', href: '/riders', icon: FiUsers },
        { name: t('drivers', language), key: 'drivers', href: '/drivers', icon: FiTruck },
        { name: t('fleets', language), key: 'fleets', href: '/fleets', icon: FiTruck },
      ]
    },
    { name: t('rideRequests', language), key: 'rideRequests', href: '/ride-requests', icon: FiNavigation },
    { name: t('dispatch', language), key: 'dispatch', href: '/dispatch', icon: FiActivity },
    { 
      name: t('maps', language) || 'Maps & Tracking', 
      key: 'maps',
      icon: FiMap,
      children: [
        { name: t('vehicleTracking', language) || 'Vehicle Tracking', key: 'vehicleTracking', href: '/vehicle-tracking', icon: FiMap },
        { name: t('workAreas', language) || 'Work Areas', key: 'workAreas', href: '/work-areas', icon: FiMapPin },
        { name: t('demandMap', language) || 'Demand Map', key: 'demandMap', href: '/demand-map', icon: FiNavigation },
      ]
    },
    { name: t('services', language), key: 'services', href: '/services', icon: FiSettings },
    { 
      name: t('zones', language) || 'Zones & Regions', 
      key: 'zones',
      icon: FiMapPin,
      children: [
        { name: t('regions', language), key: 'regions', href: '/regions', icon: FiMapPin },
        { name: t('manageZones', language), key: 'manageZones', href: '/manage-zones', icon: FiMapPin },
        { name: t('manageZonePrices', language), key: 'manageZonePrices', href: '/manage-zone-prices', icon: FiDollarSign },
      ]
    },
    { name: t('coupons', language), key: 'coupons', href: '/coupons', icon: FiGift },
    { 
      name: t('documents', language), 
      key: 'documents',
      icon: FiFileText,
      children: [
        { name: t('documents', language), key: 'documents', href: '/documents', icon: FiFileText },
        { name: t('driverDocuments', language), key: 'driverDocuments', href: '/driver-documents', icon: FiShield },
      ]
    },
    { 
      name: t('support', language) || 'Support', 
      key: 'support',
      icon: FiMessageSquare,
      children: [
        { name: t('complaints', language), key: 'complaints', href: '/complaints', icon: FiAlertCircle },
        { name: t('sos', language), key: 'sos', href: '/sos', icon: FiAlertCircle },
        { name: t('customerSupport', language) || 'Customer Support', key: 'customerSupport', href: '/customer-support', icon: FiMessageSquare },
        { name: t('faqs', language), key: 'faqs', href: '/faqs', icon: FiHelpCircle },
        { name: t('cancellations', language), key: 'cancellations', href: '/cancellations', icon: FiXCircle },
      ]
    },
    { 
      name: t('financial', language) || 'Financial', 
      key: 'financial',
      icon: FiDollarSign,
      children: [
        { name: t('payments', language), key: 'payments', href: '/payments', icon: FiDollarSign },
        { name: t('wallets', language), key: 'wallets', href: '/wallets', icon: FiDollarSign },
        { name: t('withdrawRequests', language), key: 'withdrawRequests', href: '/withdraw-requests', icon: FiDollarSign },
        { name: t('additionalFees', language), key: 'additionalFees', href: '/additional-fees', icon: FiCreditCard },
        { name: t('surgePrices', language), key: 'surgePrices', href: '/surge-prices', icon: FiTrendingUp },
      ]
    },
    { name: t('airports', language), key: 'airports', href: '/airports', icon: FiMapPin },
    { name: t('reports', language), key: 'reports', href: '/reports', icon: FiBarChart2 },
    { name: t('notifications', language), key: 'notifications', href: '/notifications', icon: FiBell },
    { name: t('references', language), key: 'references', href: '/references', icon: FiUsers },
    { 
      name: t('system_settings', language), 
      key: 'system',
      icon: FiSettings,
      children: [
        { name: t('settings', language), key: 'settings', href: '/settings', icon: FiSettings },
        { name: t('subAdmin', language), key: 'subAdmin', href: '/sub-admin', icon: FiUsers },
        { name: t('roles', language), key: 'roles', href: '/roles', icon: FiShield },
        { name: t('permissions', language), key: 'permissions', href: '/permissions', icon: FiShield },
        { name: t('mailTemplates', language), key: 'mailTemplates', href: '/mail-templates', icon: FiMail },
        { name: t('smsTemplates', language), key: 'smsTemplates', href: '/sms-templates', icon: FiMessageSquare },
        { name: t('languages', language), key: 'languages', href: '/languages', icon: FiGlobe },
        { name: t('pages', language), key: 'pages', href: '/pages', icon: FiFileText },
        { name: t('frontendData', language), key: 'frontendData', href: '/frontend-data', icon: FiLayers },
        { name: t('whyChoose', language) || 'Why Choose Us', key: 'whyChoose', href: '/why-choose', icon: FiStar },
        { name: t('ourMission', language) || 'Our Mission', key: 'ourMission', href: '/our-mission', icon: FiTarget },
        { name: t('clientTestimonials', language) || 'Client Testimonials', key: 'clientTestimonials', href: '/client-testimonials', icon: FiUser },
      ]
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (href) => {
    if (!href) return false
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const NavItem = ({ item, level = 0 }) => {
    const [expanded, setExpanded] = useState(
      item.children?.some(child => isActive(child.href)) || false
    )
    const hasChildren = item.children && item.children.length > 0
    const active = isActive(item.href) || (hasChildren && expanded)
    const hasActiveChild = hasChildren && item.children.some(child => isActive(child.href))

    if (hasChildren) {
      return (
        <div className="mb-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
              active || hasActiveChild
                ? `bg-gradient-to-r ${colors.primary} text-white shadow-lg shadow-blue-500/20`
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`text-lg ${active || hasActiveChild ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors`} />
              <span className="font-semibold">{item.name}</span>
            </div>
            <FiChevronDown
              className={`transition-all duration-300 ${expanded ? 'rotate-180' : ''} ${
                active || hasActiveChild ? 'text-white' : 'text-gray-400'
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`mt-2 ${language === 'ar' ? 'mr-2' : 'ml-2'} space-y-1 border-l-2 ${language === 'ar' ? 'border-r-2 border-l-0' : ''} ${colors.border || 'border-blue-200 dark:border-blue-800'} pl-3 ${language === 'ar' ? 'pr-3 pl-0' : ''}`}>
              {item.children.map((child, index) => {
                const childActive = isActive(child.href)
                return (
                  <Link
                    key={child.key}
                    to={child.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
                      childActive
                        ? `bg-gradient-to-r ${colors.primary} text-white shadow-md font-medium`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={{
                      animationDelay: expanded ? `${index * 30}ms` : '0ms'
                    }}
                  >
                    <child.icon className={`text-base ${childActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} transition-colors`} />
                    <span>{child.name}</span>
                    {childActive && (
                      <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-white`}></div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return (
      <Link
        to={item.href}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group mb-1 ${
          active
            ? `bg-gradient-to-r ${colors.primary} text-white shadow-lg shadow-blue-500/20`
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md'
        }`}
      >
        <item.icon className={`text-lg ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors`} />
        <span className="font-semibold">{item.name}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Mobile Menu Button - Removed as it's now in header */}

      {/* Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-screen bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 px-4 bg-gradient-to-r ${colors.primary} text-white transition-all duration-300 shadow-md`}>
            {sidebarOpen && (
              <h1 className="text-xl font-bold animate-fade-in tracking-tight">{t('appName', language)}</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:block hidden p-2 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              title={sidebarOpen ? t('collapseSidebar', language) : t('expandSidebar', language)}
            >
              <FiMenu size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar custom-scrollbar">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.key} item={item} />
              ))}
            </div>
          </nav>

        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-screen bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out w-64 border-r border-gray-200 dark:border-gray-700 ${
          mobileMenuOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 px-4 bg-gradient-to-r ${colors.primary} text-white transition-all duration-300 shadow-md`}>
            <h1 className="text-xl font-bold tracking-tight">{t('appName', language)}</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar custom-scrollbar">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.key} item={item} />
              ))}
            </div>
          </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 w-full ${language === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} ${!sidebarOpen && (language === 'ar' ? 'lg:mr-20' : 'lg:ml-20')} transition-all duration-300 min-h-screen`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative transition-colors duration-300">
          <div className="px-2 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 lg:hidden mr-2">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle menu"
                  >
                    <FiMenu size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
                <div className="flex-1 max-w-lg hidden sm:block">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={t('search', language)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
                <button
                  onClick={toggleTheme}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={theme === 'light' ? t('switchToDarkMode', language) : t('switchToLightMode', language)}
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <FiMoon size={18} className="sm:w-5 sm:h-5" /> : <FiSun size={18} className="sm:w-5 sm:h-5" />}
                </button>
                <button
                  onClick={toggleLanguage}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Toggle language"
                >
                  <span className="hidden sm:inline">{language === 'en' ? '🇸🇦 العربية' : '🇺🇸 English'}</span>
                  <span className="sm:hidden">{language === 'en' ? 'AR' : 'EN'}</span>
                </button>
                <button 
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <FiBell size={18} className="sm:w-5 sm:h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="User menu"
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center text-white text-xs sm:text-sm font-semibold`}>
                      {user?.firstName?.[0] || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.userType}</p>
                    </div>
                    <FiChevronDown className="hidden sm:block text-gray-600 dark:text-gray-300" size={16} />
                  </button>
                  {userMenuOpen && (
                    <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in`}>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FiUser className={`${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                        {t('profile', language)}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FiLogOut className={`${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                        {t('logout', language)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
    </div>
  )
}

export default Layout
