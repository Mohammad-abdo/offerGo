import { FiAlertTriangle, FiX, FiCheck, FiXCircle } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/translations'

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  type = 'danger' // danger, warning, info
}) => {
  const { language } = useLanguage()

  if (!isOpen) return null

  const typeStyles = {
    danger: {
      icon: <FiXCircle className="text-red-500" size={24} />,
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200',
    },
    warning: {
      icon: <FiAlertTriangle className="text-yellow-500" size={24} />,
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      border: 'border-yellow-200',
    },
    info: {
      icon: <FiAlertTriangle className="text-blue-500" size={24} />,
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200',
    },
  }

  const style = typeStyles[type]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Dialog panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className={`px-6 py-5 border-b ${style.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`${style.iconBg} rounded-full p-2`}>
                  {style.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {title || t('areYouSure', language)}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              {message || t('deleteConfirm', language)}
            </p>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText || t('cancel', language)}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${style.button}`}
            >
              <div className="flex items-center space-x-2">
                <FiCheck size={16} />
                <span>{confirmText || t('confirm', language)}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog


