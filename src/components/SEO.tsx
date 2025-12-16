import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  lang?: string;
}

export function SEO({ 
  title = 'KampagnenRadar - AI Campaign Analytics',
  description = 'AI-powered campaign optimization for Google Ads and GA4. Daily insights, automatic alerts, and optimization suggestions.',
  lang = 'de'
}: SEOProps) {
  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
    </Helmet>
  );
}
