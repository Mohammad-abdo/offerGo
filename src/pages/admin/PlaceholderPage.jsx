import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'
import { FiInfo } from 'react-icons/fi'

const PlaceholderPage = ({ title, description }) => {
  const { language } = useLanguage()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title || t('page', language)}</h1>
          <p className="text-gray-600 mt-1">{description || t('this_page_is_under_development', language)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <FiInfo className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('coming_soon', language)}
          </h2>
          <p className="text-gray-600">
            {t('this_feature_will_be_available_soon', language)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage



