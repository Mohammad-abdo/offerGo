/**
 * RTL utility functions and components
 */

/**
 * Get RTL-aware text alignment class
 * @param {string} language - Current language ('en' or 'ar')
 * @returns {string} Tailwind class for text alignment
 */
export const getTextAlign = (language) => {
  return language === 'ar' ? 'text-right' : 'text-left'
}

/**
 * Get RTL-aware start alignment class (respects direction)
 * @returns {string} Tailwind class
 */
export const getTextStart = () => {
  return 'text-start'
}

/**
 * Get RTL-aware icon position class
 * @param {string} language - Current language ('en' or 'ar')
 * @param {string} position - 'left' or 'right'
 * @returns {string} Tailwind class for positioning
 */
export const getIconPosition = (language, position = 'left') => {
  if (language === 'ar') {
    return position === 'left' ? 'right-3' : 'left-3'
  }
  return position === 'left' ? 'left-3' : 'right-3'
}

/**
 * Get RTL-aware padding class
 * @param {string} language - Current language ('en' or 'ar')
 * @param {string} side - 'left' or 'right'
 * @param {string} size - Tailwind size (e.g., '4', '10')
 * @returns {string} Tailwind class
 */
export const getPadding = (language, side, size) => {
  if (language === 'ar') {
    return side === 'left' ? `pr-${size}` : `pl-${size}`
  }
  return side === 'left' ? `pl-${size}` : `pr-${size}`
}

/**
 * Get RTL-aware margin class
 * @param {string} language - Current language ('en' or 'ar')
 * @param {string} side - 'left' or 'right'
 * @param {string} size - Tailwind size (e.g., '2', '4')
 * @returns {string} Tailwind class
 */
export const getMargin = (language, side, size) => {
  if (language === 'ar') {
    return side === 'left' ? `mr-${size}` : `ml-${size}`
  }
  return side === 'left' ? `ml-${size}` : `mr-${size}`
}

