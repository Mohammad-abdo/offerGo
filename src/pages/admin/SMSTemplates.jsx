import PlaceholderPage from './PlaceholderPage'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../utils/translations'

const SMSTemplates = () => {
  const { language } = useLanguage()
  return <PlaceholderPage title={t('smsTemplates', language)} />
}

export default SMSTemplates



