import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Globe, 
  FileText, 
  Link2, 
  Image, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CampaignMetrics } from '@/hooks/useGoogleSheetsData';

interface SEOAnalyticsProps {
  metrics?: CampaignMetrics;
  className?: string;
}

interface SEOMetric {
  key: string;
  icon: React.ReactNode;
  value: string | number;
  status: 'good' | 'warning' | 'bad';
  change?: number;
}

export function SEOAnalytics({ metrics, className }: SEOAnalyticsProps) {
  const { t } = useTranslation();

  // Simulated SEO metrics based on campaign data
  const seoMetrics: SEOMetric[] = [
    {
      key: 'organicTraffic',
      icon: <Globe className="h-4 w-4" />,
      value: metrics ? Math.round(metrics.clicks * 0.35).toLocaleString() : '—',
      status: 'good',
      change: 12.5,
    },
    {
      key: 'indexedPages',
      icon: <FileText className="h-4 w-4" />,
      value: 156,
      status: 'good',
      change: 8,
    },
    {
      key: 'backlinks',
      icon: <Link2 className="h-4 w-4" />,
      value: 847,
      status: 'warning',
      change: -3.2,
    },
    {
      key: 'pageSpeed',
      icon: <Clock className="h-4 w-4" />,
      value: '2.3s',
      status: 'warning',
      change: -5.1,
    },
    {
      key: 'mobileScore',
      icon: <Search className="h-4 w-4" />,
      value: '78/100',
      status: 'warning',
      change: 4.2,
    },
    {
      key: 'imagesOptimized',
      icon: <Image className="h-4 w-4" />,
      value: '85%',
      status: 'good',
      change: 10,
    },
  ];

  const seoChecklist = [
    { key: 'metaTitles', status: 'good' as const, score: 95 },
    { key: 'metaDescriptions', status: 'warning' as const, score: 72 },
    { key: 'h1Tags', status: 'good' as const, score: 100 },
    { key: 'altTags', status: 'warning' as const, score: 68 },
    { key: 'canonicalUrls', status: 'good' as const, score: 100 },
    { key: 'sslCertificate', status: 'good' as const, score: 100 },
    { key: 'robotsTxt', status: 'good' as const, score: 100 },
    { key: 'sitemap', status: 'good' as const, score: 100 },
    { key: 'structuredData', status: 'bad' as const, score: 35 },
    { key: 'coreWebVitals', status: 'warning' as const, score: 65 },
  ];

  const getStatusIcon = (status: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'bad':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return 'bg-green-500/10 border-green-500/20 text-green-600';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'bad':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
    }
  };

  const overallScore = Math.round(
    seoChecklist.reduce((sum, item) => sum + item.score, 0) / seoChecklist.length
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall SEO Score */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{t('seo.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('seo.subtitle')}</p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className={cn(
              'flex h-32 w-32 items-center justify-center rounded-full border-4',
              overallScore >= 80 ? 'border-green-500' : overallScore >= 60 ? 'border-yellow-500' : 'border-red-500'
            )}>
              <div className="text-center">
                <span className="text-4xl font-bold">{overallScore}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          {overallScore >= 80 
            ? t('seo.scoreGood') 
            : overallScore >= 60 
              ? t('seo.scoreAverage')
              : t('seo.scoreBad')
          }
        </p>

        {/* SEO Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {seoMetrics.map((metric) => (
            <div
              key={metric.key}
              className={cn(
                'p-4 rounded-lg border',
                getStatusColor(metric.status)
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {metric.icon}
                <span className="text-xs font-medium truncate">{t(`seo.metrics.${metric.key}`)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{metric.value}</span>
                {metric.change !== undefined && (
                  <span className={cn(
                    'flex items-center text-xs',
                    metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(metric.change)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Checklist */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <h4 className="font-semibold mb-4">{t('seo.checklist')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {seoChecklist.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <span className="text-sm">{t(`seo.checks.${item.key}`)}</span>
              </div>
              <span className={cn(
                'text-sm font-semibold',
                item.score >= 80 ? 'text-green-600' : item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {item.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical SEO Issues */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <h4 className="font-semibold mb-4">{t('seo.issues')}</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{t('seo.issuesList.structuredData')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('seo.issuesList.structuredDataDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{t('seo.issuesList.metaDescriptions')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('seo.issuesList.metaDescriptionsDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{t('seo.issuesList.pageSpeed')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('seo.issuesList.pageSpeedDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
