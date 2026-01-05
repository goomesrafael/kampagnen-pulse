import { useTranslation } from 'react-i18next';
import { useMemo, useState, useRef } from 'react';
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
  Search,
  FileDown,
  Loader2
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MetricCard } from '@/components/MetricCard';
import { SessionsChart } from '@/components/SessionsChart';
import { CampaignChart } from '@/components/CampaignChart';
import { CampaignPerformanceTable } from '@/components/CampaignPerformanceTable';
import { AlertBanner } from '@/components/AlertBanner';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AIAnalytics } from '@/components/AIAnalytics';
import { SEOAnalytics } from '@/components/SEOAnalytics';
import { ProductAnalytics } from '@/components/ProductAnalytics';
import { ROASAnalytics } from '@/components/ROASAnalytics';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { 
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useGoogleSheetsData } from '@/hooks/useGoogleSheetsData';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { PieChart } from 'lucide-react';

type ViewType = 'overview' | 'campaigns' | 'alerts' | 'suggestions' | 'roas' | 'seo' | 'aiAnalytics' | 'settings';

const navItems: { key: ViewType; icon: React.ElementType }[] = [
  { key: 'overview', icon: LayoutDashboard },
  { key: 'campaigns', icon: BarChart3 },
  { key: 'alerts', icon: Bell },
  { key: 'suggestions', icon: Lightbulb },
  { key: 'roas', icon: PieChart },
  { key: 'seo', icon: Search },
  { key: 'aiAnalytics', icon: Brain },
  { key: 'settings', icon: Settings },
];

function formatNumber(num: number, useAbbreviation: boolean = false): string {
  if (useAbbreviation) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
  }
  return num.toLocaleString('de-DE');
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
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [exportingPdf, setExportingPdf] = useState(false);
  const { data, loading, error, refresh } = useGoogleSheetsData(dateRange);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    navigate('/');
  };

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const handleRefresh = async () => {
    await refresh();
    toast({
      title: t('common.refresh') || 'Atualizado',
      description: t('common.refreshSuccess') || 'Dados atualizados com sucesso!',
    });
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;
      
      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      // Title
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KampagnenRadar - Dashboard Report', margin, yPos);
      yPos += 12;
      
      // Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${t('dashboard.lastUpdate')}: ${data?.lastUpdated ? formatLastUpdate(data.lastUpdated, i18n.language) : new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      // === ALERTS SECTION ===
      checkNewPage(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69);
      pdf.text(`⚠ ${t('alerts.title')}`, margin, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const alertText = t('alerts.trafficDrop', { percent: '12' });
      pdf.text(alertText, margin, yPos);
      yPos += 5;
      pdf.text(t('alerts.lowCtr'), margin, yPos);
      yPos += 15;

      // === METRICS SECTION ===
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('dashboard.title'), margin, yPos);
      yPos += 10;
      
      if (data?.metrics) {
        const metrics = data.metrics;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const metricsData = [
          { label: t('dashboard.metrics.clicks'), value: formatNumber(metrics.clicks) },
          { label: t('dashboard.metrics.impressions'), value: formatNumber(metrics.impressions) },
          { label: t('dashboard.metrics.conversions'), value: formatNumber(metrics.conversions) },
          { label: t('dashboard.metrics.cost'), value: `${metrics.spend.toFixed(2)} €` },
          { label: t('dashboard.metrics.roas'), value: `${metrics.roas.toFixed(1)}x` },
          { label: t('dashboard.metrics.bounceRate'), value: `${metrics.bounceRate.toFixed(1)}%` },
        ];

        metricsData.forEach((metric, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const x = margin + col * 60;
          const y = yPos + row * 12;
          pdf.setFont('helvetica', 'bold');
          pdf.text(metric.label + ':', x, y);
          pdf.setFont('helvetica', 'normal');
          pdf.text(metric.value, x + 40, y);
        });
        yPos += 30;
      }

      // === CAMPAIGNS TABLE ===
      checkNewPage(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('table.title'), margin, yPos);
      yPos += 10;

      if (data?.campaigns && data.campaigns.length > 0) {
        pdf.setFontSize(8);
        const headers = [t('table.campaign'), t('table.clicks'), t('table.impressions'), t('table.ctr'), t('table.cost'), t('table.conversions')];
        const colWidths = [50, 25, 30, 20, 25, 30];
        
        // Header
        pdf.setFont('helvetica', 'bold');
        let xPos = margin;
        headers.forEach((header, idx) => {
          pdf.text(header, xPos, yPos);
          xPos += colWidths[idx];
        });
        yPos += 6;

        // Data rows
        pdf.setFont('helvetica', 'normal');
        data.campaigns.slice(0, 10).forEach((campaign) => {
          checkNewPage(8);
          xPos = margin;
          const rowData = [
            campaign.name.substring(0, 20),
            formatNumber(campaign.clicks),
            formatNumber(campaign.impressions),
            `${campaign.ctr.toFixed(2)}%`,
            `${campaign.spend.toFixed(2)} €`,
            campaign.conversions.toString()
          ];
          rowData.forEach((cell, idx) => {
            pdf.text(cell, xPos, yPos);
            xPos += colWidths[idx];
          });
          yPos += 5;
        });
        yPos += 10;
      }

      // === SEO ANALYSIS ===
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('seo.title'), margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(12);
      const seoScore = 83;
      pdf.text(`SEO Score: ${seoScore}/100`, margin, yPos);
      yPos += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      if (seoScore >= 80) {
        pdf.text(t('seo.scoreGood'), margin, yPos);
      } else if (seoScore >= 60) {
        pdf.text(t('seo.scoreAverage'), margin, yPos);
      } else {
        pdf.text(t('seo.scoreBad'), margin, yPos);
      }
      yPos += 10;

      // SEO Checklist
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('seo.checklist'), margin, yPos);
      yPos += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const checks = [
        { key: 'metaTitles', passed: true },
        { key: 'metaDescriptions', passed: false },
        { key: 'h1Tags', passed: true },
        { key: 'altTags', passed: true },
        { key: 'canonicalUrls', passed: true },
        { key: 'sslCertificate', passed: true },
        { key: 'robotsTxt', passed: true },
        { key: 'sitemap', passed: true },
        { key: 'structuredData', passed: false },
        { key: 'coreWebVitals', passed: false },
      ];

      checks.forEach((check) => {
        checkNewPage(6);
        const icon = check.passed ? '✓' : '✗';
        pdf.text(`${icon} ${t(`seo.checks.${check.key}`)}`, margin, yPos);
        yPos += 5;
      });
      yPos += 10;

      // SEO Issues
      checkNewPage(30);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('seo.issues'), margin, yPos);
      yPos += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const issues = ['structuredData', 'metaDescriptions', 'pageSpeed'];
      issues.forEach((issue) => {
        checkNewPage(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`• ${t(`seo.issuesList.${issue}`)}`, margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(t(`seo.issuesList.${issue}Desc`), pageWidth - margin * 2);
        descLines.forEach((line: string) => {
          checkNewPage(5);
          pdf.text(line, margin + 5, yPos);
          yPos += 4;
        });
        yPos += 3;
      });
      yPos += 10;

      // === AI ANALYSIS ===
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('aiAnalytics.title'), margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('aiAnalytics.summary'), margin, yPos);
      yPos += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const summaryLines = pdf.splitTextToSize(
        i18n.language === 'de' 
          ? 'Ihre Kampagnen zeigen gemischte Leistung. Einige Kampagnen haben niedrige CTR, während andere gute Conversion-Raten aufweisen. Es gibt Optimierungspotenzial bei SEO und Budgetallokation.'
          : 'Suas campanhas mostram desempenho misto. Algumas campanhas têm CTR baixo, enquanto outras apresentam boas taxas de conversão. Há potencial de otimização em SEO e alocação de orçamento.',
        pageWidth - margin * 2
      );
      summaryLines.forEach((line: string) => {
        checkNewPage(5);
        pdf.text(line, margin, yPos);
        yPos += 4;
      });
      yPos += 8;

      // AI Recommendations
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('aiAnalytics.recommendations'), margin, yPos);
      yPos += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      const recommendations = i18n.language === 'de' 
        ? [
            '1. Optimieren Sie Kampagnen mit CTR unter 2% durch bessere Anzeigentexte',
            '2. Reduzieren Sie das Budget für Kampagnen mit hohen Kosten pro Conversion',
            '3. Fügen Sie strukturierte Daten hinzu für besseres SEO',
            '4. Verbessern Sie die Ladezeit unter 2 Sekunden',
            '5. Fügen Sie Meta-Beschreibungen zu allen Seiten hinzu'
          ]
        : [
            '1. Otimize campanhas com CTR abaixo de 2% com melhores textos de anúncio',
            '2. Reduza o orçamento de campanhas com alto custo por conversão',
            '3. Adicione dados estruturados para melhor SEO',
            '4. Melhore o tempo de carregamento para menos de 2 segundos',
            '5. Adicione meta descrições a todas as páginas'
          ];

      recommendations.forEach((rec) => {
        checkNewPage(8);
        const recLines = pdf.splitTextToSize(rec, pageWidth - margin * 2);
        recLines.forEach((line: string) => {
          pdf.text(line, margin, yPos);
          yPos += 4;
        });
        yPos += 2;
      });

      // === OPTIMIZATION SUGGESTIONS ===
      yPos += 10;
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('suggestions.title'), margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      if (data?.campaigns && data.campaigns.length > 0) {
        const sortedByCtr = [...data.campaigns].sort((a, b) => a.ctr - b.ctr);
        const lowestCtrCampaign = sortedByCtr[0];
        
        if (lowestCtrCampaign && lowestCtrCampaign.ctr < 2) {
          checkNewPage(15);
          const suggestion1 = t('suggestions.longtail', {
            campaign: lowestCtrCampaign.name,
            ctr: lowestCtrCampaign.ctr.toFixed(2)
          });
          const lines1 = pdf.splitTextToSize(`• ${suggestion1}`, pageWidth - margin * 2);
          lines1.forEach((line: string) => {
            pdf.text(line, margin, yPos);
            yPos += 4;
          });
          yPos += 5;
        }

        const sortedByCost = [...data.campaigns].sort((a, b) => b.costPerConversion - a.costPerConversion);
        const highestCostCampaign = sortedByCost[0];
        
        if (highestCostCampaign) {
          checkNewPage(15);
          const suggestion2 = t('suggestions.budget', {
            campaign: highestCostCampaign.name,
            percent: '20',
            costPerConv: highestCostCampaign.costPerConversion.toFixed(2)
          });
          const lines2 = pdf.splitTextToSize(`• ${suggestion2}`, pageWidth - margin * 2);
          lines2.forEach((line: string) => {
            pdf.text(line, margin, yPos);
            yPos += 4;
          });
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`KampagnenRadar - Page ${i}/${totalPages}`, margin, pageHeight - 10);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 20, pageHeight - 10);
      }

      // Save
      pdf.save(`KampagnenRadar_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: t('export.pdf'),
        description: i18n.language === 'de' ? 'PDF erfolgreich exportiert!' : 'PDF exportado com sucesso!',
      });
    } catch (err) {
      console.error('PDF export error:', err);
      toast({
        title: t('common.error'),
        description: i18n.language === 'de' ? 'Fehler beim Exportieren' : 'Erro ao exportar',
        variant: 'destructive',
      });
    } finally {
      setExportingPdf(false);
    }
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
          <button
            key={item.key}
            onClick={() => handleNavClick(item.key)}
            className={`flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg transition-colors ${
              activeView === item.key
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{t(`nav.${item.key}`)}</span>
          </button>
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

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'campaigns':
        return (
          <>
            <CampaignPerformanceTable campaigns={data?.campaigns} loading={loading} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SessionsChart loading={loading} data={data?.dailyData} />
              <CampaignChart loading={loading} data={data?.campaigns} />
            </div>
          </>
        );
      case 'alerts':
        return (
          <div className="space-y-4">
            <AlertBanner />
            <div className="rounded-xl bg-card p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4">{t('alerts.title')}</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm">{t('alerts.trafficDrop', { percent: '12' })}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm">{t('alerts.lowCtr')}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'suggestions':
        return (
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
              {dynamicSuggestions.length > 0 ? (
                dynamicSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              )}
            </div>
          </div>
        );
      case 'roas':
        return <ROASAnalytics onRefresh={handleRefresh} dateRange={dateRange} />;
      case 'seo':
        return (
          <div className="space-y-6">
            <ProductAnalytics onRefresh={handleRefresh} dateRange={dateRange} />
            <SEOAnalytics metrics={data?.metrics} />
          </div>
        );
      case 'aiAnalytics':
        return <AIAnalytics campaigns={data?.campaigns} metrics={data?.metrics} seoScore={83} />;
      case 'settings':
        return (
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-4">{t('nav.settings')}</h3>
            <p className="text-muted-foreground">{i18n.language === 'de' ? 'Einstellungen werden bald verfügbar sein.' : 'Configurações estarão disponíveis em breve.'}</p>
          </div>
        );
      default: // overview
        return (
          <>
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
          </>
        );
    }
  };

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
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{i18n.language === 'de' ? 'Aktualisieren' : 'Atualizar'}</span>
            </Button>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="gap-2"
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t('export.pdf')}</span>
            </Button>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Dashboard Content */}
        <main ref={mainContentRef} className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Error Banner */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}
