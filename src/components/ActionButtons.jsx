import { FiEdit, FiTrash2, FiEye, FiMoreVertical } from 'react-icons/fi'
import { useState } from 'react'

const ActionButtons = ({ 
  onEdit, 
  onDelete, 
  onView, 
  showView = false,
  showEdit = true,
  showDelete = true,
  size = 'md'
}) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18
  const buttonClass = size === 'sm' 
    ? 'p-1.5' 
    : size === 'lg' 
    ? 'p-2.5' 
    : 'p-2'

  // On mobile, show dropdown menu if more than 2 buttons
  const buttonCount = [showView, showEdit, showDelete].filter(Boolean).length
  const useDropdown = buttonCount > 2

  if (useDropdown && showDropdown) {
    return (
      <div className="flex items-center space-x-1 relative">
        <button
          onClick={() => setShowDropdown(false)}
          className={`${buttonClass} text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200`}
          title="Close menu"
        >
          <FiMoreVertical size={iconSize} />
        </button>
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
          {showView && (
            <button
              onClick={() => {
                onView()
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
            >
              <FiEye size={16} />
              <span>View</span>
            </button>
          )}
          {showEdit && (
            <button
              onClick={() => {
                onEdit()
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center space-x-2"
            >
              <FiEdit size={16} />
              <span>Edit</span>
            </button>
          )}
          {showDelete && (
            <button
              onClick={() => {
                onDelete()
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
            >
              <FiTrash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1 relative">
      {buttonCount > 2 ? (
        <button
          onClick={() => setShowDropdown(true)}
          className={`${buttonClass} text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200`}
          title="More actions"
        >
          <FiMoreVertical size={iconSize} />
        </button>
      ) : (
        <>
          {showView && (
            <button
              onClick={onView}
              className={`${buttonClass} text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group relative`}
              title="View"
            >
              <FiEye size={iconSize} />
              <span className="hidden sm:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                View
              </span>
            </button>
          )}
          
          {showEdit && (
            <button
              onClick={onEdit}
              className={`${buttonClass} text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group relative`}
              title="Edit"
            >
              <FiEdit size={iconSize} />
              <span className="hidden sm:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Edit
              </span>
            </button>
          )}
          
          {showDelete && (
            <button
              onClick={onDelete}
              className={`${buttonClass} text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group relative`}
              title="Delete"
            >
              <FiTrash2 size={iconSize} />
              <span className="hidden sm:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Delete
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default ActionButtons


