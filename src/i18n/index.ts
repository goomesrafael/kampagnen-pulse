import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de.json';
import pt from './pt.json';

const resources = {
  de: { translation: de },
  pt: { translation: pt }
};

// Detect browser language
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('de')) return 'de';
  return 'de'; // Default to German
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('kampagnenradar-lang') || getBrowserLanguage(),
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
