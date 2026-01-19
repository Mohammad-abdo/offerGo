import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const AdditionalFees = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('additionalFees', language)} />
}

export default AdditionalFees



