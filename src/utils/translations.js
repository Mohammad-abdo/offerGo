import en from '../locales/en'
import ar from '../locales/ar'

const translations = {
  en,
  ar,
}

export const t = (key, lang = 'en') => {
  const keys = key.split('.')
  let value = translations[lang] || translations.en

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      return key
    }
  }

  return value || key
}

// Helper to get localized field value
export const getLocalizedField = (item, field, lang = 'en') => {
  if (!item) return ''
  
  if (lang === 'ar' && item[`${field}Ar`]) {
    return item[`${field}Ar`] || item[field] || ''
  }
  
  return item[field] || ''
}

// Helper to get localized name
export const getLocalizedName = (item, lang = 'en') => {
  return getLocalizedField(item, 'name', lang)
}

// Helper to get localized title
export const getLocalizedTitle = (item, lang = 'en') => {
  return getLocalizedField(item, 'title', lang)
}

// Helper to get localized description
export const getLocalizedDescription = (item, lang = 'en') => {
  return getLocalizedField(item, 'description', lang)
}



