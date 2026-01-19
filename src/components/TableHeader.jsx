/**
 * RTL-aware table header cell component with mobile responsiveness
 */
const TableHeader = ({ children, className = '', language = 'en' }) => {
  return (
    <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

export default TableHeader

