import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const Languages = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('languages', language)} />
}

export default Languages



