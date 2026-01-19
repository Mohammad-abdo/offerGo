import { FiSearch } from 'react-icons/fi'

/**
 * RTL-aware search input component with mobile responsiveness
 */
const SearchInput = ({ value, onChange, placeholder, language = 'en', className = '' }) => {
  const isRTL = language === 'ar'
  
  return (
    <div className={`flex-1 relative ${className}`}>
      <FiSearch 
        className={`absolute ${isRTL ? 'right-2 sm:right-3' : 'left-2 sm:left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} 
        size={18}
        style={{ width: '18px', height: '18px' }}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full ${isRTL ? 'pr-8 sm:pr-10 pl-3 sm:pl-4' : 'pl-8 sm:pl-10 pr-3 sm:pr-4'} py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400`}
        dir={isRTL ? 'rtl' : 'ltr'}
      />
    </div>
  )
}

export default SearchInput

