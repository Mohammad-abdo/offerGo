import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiInfo } from 'react-icons/fi'

const PlaceholderPage = ({ title, description }) => {
  const { language } = useLanguage()

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {title || t('page', language)}
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            {description || t('this_page_is_under_development', language)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-12">
        <div className="text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-6">
            <FiInfo className="text-orange-500 dark:text-orange-400" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('coming_soon', language)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {t('this_feature_will_be_available_soon', language)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage




