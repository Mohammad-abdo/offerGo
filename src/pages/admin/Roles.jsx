import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const Roles = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('roles', language)} />
}

export default Roles



