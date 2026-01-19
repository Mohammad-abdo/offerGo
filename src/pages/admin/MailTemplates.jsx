import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const MailTemplates = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('mailTemplates', language)} />
}

export default MailTemplates



