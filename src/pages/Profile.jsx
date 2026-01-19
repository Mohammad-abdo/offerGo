import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/translations'
import { showSuccess, showError } from '../utils/toast'
import api from '../utils/api'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEdit,
  FiSave,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSun,
  FiMoon,
  FiDroplet,
  FiType,
  FiShield,
  FiBell,
  FiGlobe,
} from 'react-icons/fi'

const Profile = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, fontSize, setFontSize, primaryColor, setPrimaryColor, colors, fonts } = useTheme()
  const { language, toggleLanguage } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    address: '',
  })

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/update-profile', formData)
      showSuccess(t('updated', language))
      setIsEditing(false)
      // Refresh user data
      window.location.reload()
    } catch (error) {
      showError(error.response?.data?.message || t('failed', language))
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }
    try {
      await api.post('/users/change-password', {
        oldPassword: passwordData.oldPassword,
        password: passwordData.newPassword,
      })
      showSuccess('Password updated successfully')
      setShowPasswordModal(false)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update password')
    }
  }

  const colorOptions = [
    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-500' },
    { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Red', value: 'red', color: 'bg-red-500' },
    { name: 'Orange', value: 'orange', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${fonts.heading} font-bold text-gray-900 dark:text-white`}>{t('profile', language)}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your profile and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`${fonts.subheading} font-semibold text-gray-900 dark:text-white`}>Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${colors.primary} text-white rounded-lg ${colors.primaryHover} shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
                >
                  <FiEdit className="mr-2" size={18} />
                  {t('edit', language)}
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('firstName', language)}
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('lastName', language)}
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('email', language)}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('contactNumber', language)}
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('address', language)}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
                  >
                    {t('cancel', language)}
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 bg-gradient-to-r ${colors.primary} text-white rounded-lg ${colors.primaryHover} font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
                  >
                    <div className="flex items-center">
                      <FiSave className="mr-2" size={18} />
                      {t('save', language)}
                    </div>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.userType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FiMail className="text-blue-600 dark:text-blue-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('email', language)}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FiPhone className="text-blue-600 dark:text-blue-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('contactNumber', language)}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.contactNumber || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FiMapPin className="text-blue-600 dark:text-blue-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('address', language)}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.address || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FiCalendar className="text-blue-600 dark:text-blue-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className={`${fonts.subheading} font-semibold text-gray-900 dark:text-white mb-6`}>Security</h2>
            <button
              onClick={() => setShowPasswordModal(true)}
              className={`w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r ${colors.primary} text-white rounded-lg ${colors.primaryHover} shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
            >
              <FiLock className="mr-2" size={18} />
              Change Password
            </button>
          </div>
        </div>

        {/* Preferences Sidebar */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className={`${fonts.subheading} font-semibold text-gray-900 dark:text-white mb-6`}>Preferences</h2>
            
            {/* Theme Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {theme === 'light' ? (
                    <FiSun className="text-yellow-500" size={20} />
                  ) : (
                    <FiMoon className="text-blue-400" size={20} />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {theme === 'light' ? 'Light mode' : 'Dark mode'}
              </p>
            </div>

            {/* Primary Color */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <FiDroplet className="text-purple-500" size={20} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPrimaryColor(option.value)}
                    className={`h-10 rounded-lg border-2 transition-all ${
                      primaryColor === option.value
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className={`w-full h-full ${option.color} rounded-lg`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <FiType className="text-green-500" size={20} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</span>
              </div>
              <div className="space-y-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`w-full px-4 py-2 text-left rounded-lg transition-all ${
                      fontSize === size
                        ? `bg-gradient-to-r ${colors.primary} text-white`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <FiGlobe className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</span>
              </div>
              <button
                onClick={toggleLanguage}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {language === 'en' ? '🇸🇦 العربية' : '🇺🇸 English'}
              </button>
            </div>
          </div>

          {/* Account Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className={`${fonts.subheading} font-semibold text-gray-900 dark:text-white mb-4`}>Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  user?.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {user?.status || 'pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">User Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {user?.userType || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email Verified</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  user?.emailVerifiedAt
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user?.emailVerifiedAt ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOldPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
                  >
                    {t('cancel', language)}
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 bg-gradient-to-r ${colors.primary} text-white rounded-lg ${colors.primaryHover} font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
                  >
                    {t('save', language)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

