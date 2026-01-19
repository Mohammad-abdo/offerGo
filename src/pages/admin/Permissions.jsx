import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const Permissions = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('permissions', language)} />
}

export default Permissions



