import { useTranslation } from 'react-i18next';
import { 
  Radar, 
  LayoutDashboard, 
  BarChart3, 
  Bell, 
  Lightbulb, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { MetricCard } from '@/components/MetricCard';
import { SessionsChart } from '@/components/SessionsChart';
import { CampaignChart } from '@/components/CampaignChart';
import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MousePointerClick, Eye, Target, TrendingUp, ArrowDownRight } from 'lucide-react';

const navItems = [
  { key: 'overview', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'campaigns', icon: BarChart3, path: '/dashboard/campaigns' },
  { key: 'alerts', icon: Bell, path: '/dashboard/alerts' },
  { key: 'suggestions', icon: Lightbulb, path: '/dashboard/suggestions' },
  { key: 'settings', icon: Settings, path: '/dashboard/settings' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.lastUpdate')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ExportPdfButton />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Alert Banner */}
          <AlertBanner />

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title={t('dashboard.metrics.clicks')}
              value="12,847"
              description={t('dashboard.metrics.clicksDesc')}
              change={12.5}
              icon={<MousePointerClick className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.impressions')}
              value="284,520"
              description={t('dashboard.metrics.impressionsDesc')}
              change={8.3}
              icon={<Eye className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.conversions')}
              value="856"
              description={t('dashboard.metrics.conversionsDesc')}
              change={-3.2}
              icon={<Target className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.roas')}
              value="3.8x"
              description={t('dashboard.metrics.roasDesc')}
              change={5.1}
              icon={<TrendingUp className="h-5 w-5" />}
              loading={loading}
            />
            <MetricCard
              title={t('dashboard.metrics.bounceRate')}
              value="42.3%"
              description={t('dashboard.metrics.bounceRateDesc')}
              change={-2.1}
              icon={<ArrowDownRight className="h-5 w-5" />}
              loading={loading}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SessionsChart loading={loading} />
            <CampaignChart loading={loading} />
          </div>

          {/* AI Suggestions Section */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <Lightbulb className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{t('suggestions.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('suggestions.lastOptimization', { date: '12. Dezember' })}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                t('suggestions.longtail'),
                t('suggestions.budget'),
              ].map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
