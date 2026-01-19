import toast from 'react-hot-toast'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from 'react-icons/fi'

// Custom toast styles
const toastStyle = {
  borderRadius: '12px',
  background: '#fff',
  color: '#1f2937',
  padding: '16px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  fontWeight: '500',
}

const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: toastStyle,
}

// Success notification
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...toastOptions,
    ...options,
    icon: <FiCheckCircle className="text-green-500" size={20} />,
    style: {
      ...toastStyle,
      borderLeft: '4px solid #10b981',
    },
  })
}

// Error notification
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...toastOptions,
    ...options,
    icon: <FiXCircle className="text-red-500" size={20} />,
    style: {
      ...toastStyle,
      borderLeft: '4px solid #ef4444',
    },
  })
}

// Warning notification
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...toastOptions,
    ...options,
    icon: <FiAlertCircle className="text-yellow-500" size={20} />,
    style: {
      ...toastStyle,
      borderLeft: '4px solid #f59e0b',
    },
  })
}

// Info notification
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...toastOptions,
    ...options,
    icon: <FiInfo className="text-blue-500" size={20} />,
    style: {
      ...toastStyle,
      borderLeft: '4px solid #3b82f6',
    },
  })
}

// Loading notification
export const showLoading = (message) => {
  return toast.loading(message, {
    ...toastOptions,
    duration: Infinity,
  })
}

// Promise notification (for async operations)
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'An error occurred',
    },
    toastOptions
  )
}

// Custom notification
export const showCustom = (message, icon, color = '#3b82f6', options = {}) => {
  return toast(message, {
    ...toastOptions,
    ...options,
    icon: icon || <FiInfo className={`text-${color}-500`} size={20} />,
    style: {
      ...toastStyle,
      borderLeft: `4px solid ${color}`,
    },
  })
}

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  custom: showCustom,
}


