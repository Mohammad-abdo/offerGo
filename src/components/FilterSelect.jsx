import { FiFilter } from 'react-icons/fi'

/**
 * RTL-aware filter select component with mobile responsiveness
 */
const FilterSelect = ({ value, onChange, children, language = 'en', className = '' }) => {
  const isRTL = language === 'ar'
  
  return (
    <div className={`relative ${className}`}>
      <FiFilter 
        className={`absolute ${isRTL ? 'right-2 sm:right-3' : 'left-2 sm:left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} 
        size={18}
        style={{ width: '18px', height: '18px' }}
      />
      <select
        value={value}
        onChange={onChange}
        className={`${isRTL ? 'pr-8 sm:pr-10 pl-7 sm:pl-8' : 'pl-8 sm:pl-10 pr-7 sm:pr-8'} py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {children}
      </select>
    </div>
  )
}

export default FilterSelect

