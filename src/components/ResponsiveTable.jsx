/**
 * Responsive Table Wrapper Component
 * Provides horizontal scroll on mobile devices while maintaining full table on desktop
 */
const ResponsiveTable = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveTable

