import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const Cancellations = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('cancellations', language)} />
}

export default Cancellations



