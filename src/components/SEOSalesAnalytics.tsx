import { useTranslation } from 'react-i18next';
import { 
  Package,
  TrendingUp,
  TrendingDown,
  Target,
  Trash2,
  Lightbulb,
  Search,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductData, SEORecommendation, ShopAnalytics } from '@/hooks/useProductData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface SEOSalesAnalyticsProps {
  className?: string;
  onRefresh?: () => void;
  dateRange?: DateRange;
}

const SHOP_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#84cc16'];

export function SEOSalesAnalytics({ className, onRefresh, dateRange }: SEOSalesAnalyticsProps) {
  const { i18n } = useTranslation();
  const { data, loading, error, refresh } = useProductData(dateRange);
  const isGerman = i18n.language === 'de';

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(isGerman ? 'de-DE' : 'pt-BR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(isGerman ? 'de-DE' : 'pt-BR');
  };

  const getTypeIcon = (type: SEORecommendation['type']) => {
    switch (type) {
      case 'opportunity': return <Search className="h-4 w-4" />;
      case 'waste': return <Trash2 className="h-4 w-4" />;
      case 'optimize': return <Lightbulb className="h-4 w-4" />;
      case 'ads_invest': return <ArrowUpRight className="h-4 w-4" />;
      case 'ads_reduce': return <ArrowDownRight className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: SEORecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'low':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
    }
  };

  const getShopStatus = (shop: ShopAnalytics, avgRevenue: number): 'good' | 'warning' | 'bad' => {
    if (shop.totalRevenue >= avgRevenue * 1.2) return 'good';
    if (shop.totalRevenue >= avgRevenue * 0.5) return 'warning';
    return 'bad';
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          {isGerman ? 'Erneut versuchen' : 'Tentar novamente'}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <p className="text-muted-foreground">{isGerman ? 'Keine Daten verfügbar' : 'Nenhum dado disponível'}</p>
      </div>
    );
  }

  const metrics = data.metrics;
  const shopAnalytics = data.shopAnalytics || [];
  const avgShopRevenue = shopAnalytics.length > 0 
    ? shopAnalytics.reduce((sum, s) => sum + s.totalRevenue, 0) / shopAnalytics.length 
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{isGerman ? 'SEO-Verkaufsanalyse' : 'Análise SEO de Vendas'}</h3>
            <p className="text-sm text-muted-foreground">
              {isGerman ? 'Produktoptimierung und Plattformanalyse' : 'Otimização de produtos e análise de plataformas'}
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">{isGerman ? 'Aktualisieren' : 'Atualizar'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shops" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="shops" className="gap-2">
            <Store className="h-4 w-4" />
            <span>{isGerman ? 'Plattformen' : 'Plataformas'}</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Target className="h-4 w-4" />
            <span>{isGerman ? 'Chancen' : 'Oportunidades'}</span>
          </TabsTrigger>
          <TabsTrigger value="waste" className="gap-2">
            <Trash2 className="h-4 w-4" />
            <span>{isGerman ? 'Verluste' : 'Perdas'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Shops/Platforms Tab */}
        <TabsContent value="shops" className="space-y-6">
          {/* Shop Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Plattformen' : 'Plataformas'}</span>
              </div>
              <span className="text-xl font-bold">{shopAnalytics.length}</span>
            </div>
            <div className="p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Starke Plattformen' : 'Plataformas Fortes'}</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {shopAnalytics.filter(s => getShopStatus(s, avgShopRevenue) === 'good').length}
              </span>
            </div>
            <div className="p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Mittel' : 'Médias'}</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {shopAnalytics.filter(s => getShopStatus(s, avgShopRevenue) === 'warning').length}
              </span>
            </div>
            <div className="p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Schwach' : 'Fracas'}</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {shopAnalytics.filter(s => getShopStatus(s, avgShopRevenue) === 'bad').length}
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue by Platform Bar Chart */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Store className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">{isGerman ? 'Umsatz nach Plattform' : 'Receita por Plataforma'}</h4>
              </div>
              <div className="h-[300px]">
                {shopAnalytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={shopAnalytics.map((shop, i) => ({
                        name: shop.shopName,
                        revenue: shop.totalRevenue,
                        units: shop.totalUnitsSold,
                        color: SHOP_COLORS[i % SHOP_COLORS.length]
                      }))} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)} 
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), isGerman ? 'Umsatz' : 'Receita']}
                      />
                      <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isGerman ? 'Keine Plattformdaten' : 'Sem dados de plataforma'}
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Share Pie Chart */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">{isGerman ? 'Umsatzverteilung' : 'Distribuição de Receita'}</h4>
              </div>
              <div className="h-[300px]">
                {shopAnalytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={shopAnalytics.map((shop, i) => ({
                          name: shop.shopName,
                          value: shop.totalRevenue,
                          color: SHOP_COLORS[i % SHOP_COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {shopAnalytics.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={SHOP_COLORS[index % SHOP_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isGerman ? 'Keine Plattformdaten' : 'Sem dados de plataforma'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Platform Details Table */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h4 className="font-semibold mb-4">{isGerman ? 'Plattform-Details' : 'Detalhes das Plataformas'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Plattform' : 'Plataforma'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Umsatz' : 'Receita'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Verkauft' : 'Vendido'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Produkte' : 'Produtos'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Anteil' : 'Participação'}</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shopAnalytics.map((shop, index) => {
                    const status = getShopStatus(shop, avgShopRevenue);
                    return (
                      <tr key={shop.shopName} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: SHOP_COLORS[index % SHOP_COLORS.length] }}
                            />
                            <span className="font-medium">{shop.shopName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-green-600">{formatCurrency(shop.totalRevenue)}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(shop.totalUnitsSold)}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(shop.productCount)}</td>
                        <td className="py-3 px-2 text-right">{shop.percentageOfTotal.toFixed(1)}%</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium border flex items-center gap-1',
                              status === 'good' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                              status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600' :
                              'bg-red-500/10 border-red-500/20 text-red-600'
                            )}>
                              {status === 'good' ? <TrendingUp className="h-3 w-3" /> :
                               status === 'warning' ? <AlertCircle className="h-3 w-3" /> :
                               <TrendingDown className="h-3 w-3" />}
                              {status === 'good' ? (isGerman ? 'Stark' : 'Forte') :
                               status === 'warning' ? (isGerman ? 'Mittel' : 'Média') :
                               (isGerman ? 'Schwach' : 'Fraca')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* SEO Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Opportunities List */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">{isGerman ? 'SEO-Chancen' : 'Oportunidades SEO'} ({data.seoOpportunities.length})</h4>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {data.seoOpportunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isGerman ? 'Keine Empfehlungen' : 'Sem recomendações'}</p>
                ) : (
                  data.seoOpportunities.map((rec, index) => (
                    <div key={`opp-${rec.artikelBasis}-${index}`} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(rec.type)}
                          <span className="font-medium text-sm">{rec.produktBasis}</span>
                        </div>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getPriorityColor(rec.priority))}>
                          {rec.priority === 'high' ? (isGerman ? 'Hoch' : 'Alta') : 
                           rec.priority === 'medium' ? (isGerman ? 'Mittel' : 'Média') : 
                           (isGerman ? 'Niedrig' : 'Baixa')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.artikelBasis}</p>
                      <p className="text-sm font-medium text-primary">{rec.suggestion}</p>
                      <p className="text-xs text-muted-foreground">{rec.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">{isGerman ? 'Strategische Empfehlungen' : 'Recomendações Estratégicas'}</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h5 className="font-medium text-green-700 mb-2">{isGerman ? 'Google Ads Investment' : 'Investimento em Google Ads'}</h5>
                  <p className="text-sm text-muted-foreground">
                    {data.seoOpportunities.filter(r => r.type === 'ads_invest').length} {isGerman ? 'Produkte für mehr Investment' : 'produtos para mais investimento'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <h5 className="font-medium text-yellow-700 mb-2">{isGerman ? 'SEO-Optimierung' : 'Otimização SEO'}</h5>
                  <p className="text-sm text-muted-foreground">
                    {data.seoOpportunities.filter(r => r.type === 'opportunity').length} {isGerman ? 'Produkte mit Potenzial' : 'produtos com potencial'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h5 className="font-medium text-blue-700 mb-2">{isGerman ? 'Bundle/Cross-Sell' : 'Bundle/Cross-Sell'}</h5>
                  <p className="text-sm text-muted-foreground">
                    {data.seoOpportunities.filter(r => r.type === 'optimize').length} {isGerman ? 'Produkte für Bundles' : 'produtos para bundles'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h5 className="font-medium text-red-700 mb-2">{isGerman ? 'Bestand kritisch' : 'Estoque Crítico'}</h5>
                  <p className="text-sm text-muted-foreground">
                    {metrics.criticalStock} {isGerman ? 'Produkte nachbestellen' : 'produtos para reabastecer'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SEO Waste Tab */}
        <TabsContent value="waste" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold">{isGerman ? 'SEO-Verluste & Probleme' : 'Perdas e Problemas SEO'} ({data.seoWaste.length})</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {data.seoWaste.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">{isGerman ? 'Keine Verluste identifiziert' : 'Nenhuma perda identificada'}</p>
              ) : (
                data.seoWaste.map((rec, index) => (
                  <div key={`waste-${rec.artikelBasis}-${index}`} className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <span className="font-medium text-sm">{rec.produktBasis}</span>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getPriorityColor(rec.priority))}>
                        {rec.priority === 'high' ? (isGerman ? 'Hoch' : 'Alta') : 
                         rec.priority === 'medium' ? (isGerman ? 'Mittel' : 'Média') : 
                         (isGerman ? 'Niedrig' : 'Baixa')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.artikelBasis}</p>
                    <p className="text-sm font-medium text-red-600">{rec.suggestion}</p>
                    <p className="text-xs text-muted-foreground">{rec.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}