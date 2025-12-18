import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { 
  Radar, 
  LayoutDashboard, 
  BarChart3, 
  Bell, 
  Lightbulb, 
  Settings,
  LogOut,
  Menu,
  RefreshCw,
  MousePointerClick, 
  Eye, 
  Target, 
  TrendingUp, 
  ArrowDownRight,
  Euro,
  Brain,
  Search
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { MetricCard } from '@/components/MetricCard';
import { SessionsChart } from '@/components/SessionsChart';
import { CampaignChart } from '@/components/CampaignChart';
import { CampaignPerformanceTable } from '@/components/CampaignPerformanceTable';
import { AlertBanner } from '@/components/AlertBanner';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AIAnalytics } from '@/components/AIAnalytics';
import { SEOAnalytics } from '@/components/SEOAnalytics';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { 
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useGoogleSheetsData } from '@/hooks/useGoogleSheetsData';

const navItems = [
  { key: 'overview', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'campaigns', icon: BarChart3, path: '/dashboard/campaigns' },
  { key: 'alerts', icon: Bell, path: '/dashboard/alerts' },
  { key: 'suggestions', icon: Lightbulb, path: '/dashboard/suggestions' },
  { key: 'seo', icon: Search, path: '/dashboard/seo' },
  { key: 'aiAnalytics', icon: Brain, path: '/dashboard/ai-analytics' },
  { key: 'settings', icon: Settings, path: '/dashboard/settings' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatLastUpdate(date: Date | null, locale: string): string {
  if (!date) return '';
  
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { data, loading, error, refresh } = useGoogleSheetsData(dateRange);

  const handleLogout = () => {
    navigate('/');
  };

  const metrics = data?.metrics;
  const campaigns = data?.campaigns;

  // Generate dynamic suggestions based on actual campaign data
  const dynamicSuggestions = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    
    const suggestions: string[] = [];
    const sortedByCtr = [...campaigns].sort((a, b) => a.ctr - b.ctr);
    const sortedByCostPerConv = [...campaigns].sort((a, b) => b.costPerConversion - a.costPerConversion);
    
    // Find campaign with lowest CTR for longtail suggestion
    const lowestCtrCampaign = sortedByCtr[0];
    if (lowestCtrCampaign && lowestCtrCampaign.ctr < 2) {
      suggestions.push(t('suggestions.longtail', {
        campaign: lowestCtrCampaign.name,
        ctr: lowestCtrCampaign.ctr.toFixed(2)
      }));
    }
    
    // Find campaign with highest cost per conversion for budget suggestion
    const highestCostCampaign = sortedByCostPerConv[0];
    if (highestCostCampaign) {
      const avgCostPerConv = campaigns.reduce((sum, c) => sum + c.costPerConversion, 0) / campaigns.length;
      if (highestCostCampaign.costPerConversion > avgCostPerConv * 1.2) {
        suggestions.push(t('suggestions.budget', {
          campaign: highestCostCampaign.name,
          percent: '20',
          costPerConv: highestCostCampaign.costPerConversion.toFixed(2)
        }));
      }
    }
    
    return suggestions;
  }, [campaigns, t]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radar className="h-5 w-5" />
        </div>
        <span className="font-semibold text-lg tracking-tight">KampagnenRadar</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-sidebar flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {t('dashboard.lastUpdate')}: {data?.lastUpdated ? formatLastUpdate(data.lastUpdated, i18n.language) : '—'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <ExportPdfButton />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Error Banner */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Alert Banner */}
          <AlertBanner />

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title={t('dashboard.metrics.clicks')}
              value={metrics ? formatNumber(metrics.clicks) : '—'}
              description={t('dashboard.metrics.clicksDesc')}
              change={12.5}
              icon={<MousePointerClick className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.impressions')}
              value={metrics ? formatNumber(metrics.impressions) : '—'}
              description={t('dashboard.metrics.impressionsDesc')}
              change={8.3}
              icon={<Eye className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.conversions')}
              value={metrics ? formatNumber(metrics.conversions) : '—'}
              description={t('dashboard.metrics.conversionsDesc')}
              change={-3.2}
              icon={<Target className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.cost')}
              value={metrics ? `${metrics.spend.toFixed(2)} €` : '—'}
              description={t('dashboard.metrics.costDesc')}
              change={-5.2}
              icon={<Euro className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.roas')}
              value={metrics ? `${metrics.roas.toFixed(1)}x` : '—'}
              description={t('dashboard.metrics.roasDesc')}
              change={5.1}
              icon={<TrendingUp className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.bounceRate')}
              value={metrics ? `${metrics.bounceRate.toFixed(1)}%` : '—'}
              description={t('dashboard.metrics.bounceRateDesc')}
              change={-2.1}
              icon={<ArrowDownRight className="h-5 w-5" />}
              loading={loading}
            />
          </div>

          {/* Campaign Performance Table */}
          <CampaignPerformanceTable campaigns={data?.campaigns} loading={loading} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SessionsChart loading={loading} data={data?.dailyData} />
            <CampaignChart loading={loading} data={data?.campaigns} />
          </div>

          {/* SEO Analytics Section */}
          <SEOAnalytics metrics={data?.metrics} />

          {/* AI Analytics Section */}
          <AIAnalytics campaigns={data?.campaigns} metrics={data?.metrics} seoScore={83} />

          {/* AI Suggestions Section */}
          {dynamicSuggestions.length > 0 && (
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <Lightbulb className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('suggestions.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('suggestions.lastOptimization', { date: new Date().toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'pt-BR', { day: 'numeric', month: 'long' }) })}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {dynamicSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
