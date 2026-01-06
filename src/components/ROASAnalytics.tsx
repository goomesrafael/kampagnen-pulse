import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lightbulb,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  RefreshCw,
  BarChart3,
  PieChart,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductData, ROASSuggestion, ROASAlert } from '@/hooks/useProductData';
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

interface ROASAnalyticsProps {
  className?: string;
  onRefresh?: () => void;
  dateRange?: DateRange;
}

export function ROASAnalytics({ className, onRefresh, dateRange }: ROASAnalyticsProps) {
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

  const getSuggestionIcon = (type: ROASSuggestion['type']) => {
    switch (type) {
      case 'increase_budget': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'decrease_budget': return <ArrowDownRight className="h-4 w-4 text-yellow-600" />;
      case 'pause_ads': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'optimize_listing': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'bundle': return <Package className="h-4 w-4 text-purple-600" />;
      case 'restock': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSuggestionColor = (type: ROASSuggestion['type']) => {
    switch (type) {
      case 'increase_budget': return 'bg-green-500/10 border-green-500/20';
      case 'decrease_budget': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'pause_ads': return 'bg-red-500/10 border-red-500/20';
      case 'optimize_listing': return 'bg-blue-500/10 border-blue-500/20';
      case 'bundle': return 'bg-purple-500/10 border-purple-500/20';
      case 'restock': return 'bg-orange-500/10 border-orange-500/20';
    }
  };

  const getAlertIcon = (type: ROASAlert['type']) => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: ROASAlert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-700';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
    }
  };

  const getPriorityBadge = (priority: ROASSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-600">{isGerman ? 'Hoch' : 'Alta'}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">{isGerman ? 'Mittel' : 'Média'}</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-600">{isGerman ? 'Niedrig' : 'Baixa'}</span>;
    }
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

  if (!data || !data.roasData) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <p className="text-muted-foreground">{isGerman ? 'Keine ROAS-Daten verfügbar' : 'Nenhum dado ROAS disponível'}</p>
      </div>
    );
  }

  const roasData = data.roasData;
  const metrics = data.metrics;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{isGerman ? 'ROAS-Analyse' : 'Análise ROAS'}</h3>
            <p className="text-sm text-muted-foreground">
              {isGerman ? 'Umfassende Rentabilitätsanalyse und Optimierungsempfehlungen' : 'Análise completa de rentabilidade e recomendações de otimização'}
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">{isGerman ? 'Aktualisieren' : 'Atualizar'}</span>
        </Button>
      </div>

      {/* Alerts Section */}
      {roasData.alerts.length > 0 && (
        <div className="space-y-2">
          {roasData.alerts.map((alert, index) => (
            <div key={`alert-${index}`} className={cn('flex items-center gap-3 p-4 rounded-xl border', getAlertColor(alert.type))}>
              {getAlertIcon(alert.type)}
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">{isGerman ? 'Gesamt-Umsatz' : 'Receita Total'}</span>
          </div>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(roasData.totalRevenue)}</span>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">{isGerman ? 'Geschätzte Ads-Kosten' : 'Custos Est. de Ads'}</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(roasData.totalAdSpend)}</span>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-muted-foreground">{isGerman ? 'Gesamt-ROAS' : 'ROAS Geral'}</span>
          </div>
          <span className={cn('text-2xl font-bold', roasData.overallROAS >= 3 ? 'text-green-600' : roasData.overallROAS >= 2 ? 'text-yellow-600' : 'text-red-600')}>
            {roasData.overallROAS.toFixed(1)}x
          </span>
        </div>

        <div className="p-5 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-muted-foreground">{isGerman ? 'Produkte analysiert' : 'Produtos Analisados'}</span>
          </div>
          <span className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</span>
        </div>
      </div>

      {/* ROAS Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Top Products Chart */}
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">{isGerman ? 'Umsatz Top 10 Produkte' : 'Receita Top 10 Produtos'}</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={roasData.profitableProducts.slice(0, 10).map(p => ({
                  name: p.produktBasis.length > 15 ? p.produktBasis.substring(0, 15) + '...' : p.produktBasis,
                  fullName: p.produktBasis,
                  revenue: p.revenue,
                  units: p.unitsSold
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
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Distribution Pie Chart */}
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold">{isGerman ? 'Bestandsverteilung' : 'Distribuição de Estoque'}</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: isGerman ? 'Gut' : 'Bom', value: metrics.healthyStock, color: '#22c55e' },
                    { name: isGerman ? 'Warnung' : 'Alerta', value: metrics.warningStock, color: '#eab308' },
                    { name: isGerman ? 'Kritisch' : 'Crítico', value: metrics.criticalStock, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: isGerman ? 'Gut' : 'Bom', value: metrics.healthyStock, color: '#22c55e' },
                    { name: isGerman ? 'Warnung' : 'Alerta', value: metrics.warningStock, color: '#eab308' },
                    { name: isGerman ? 'Kritisch' : 'Crítico', value: metrics.criticalStock, color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{isGerman ? 'Grafiken' : 'Gráficos'}</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">{isGerman ? 'Empfehlungen' : 'Recomendações'}</span>
          </TabsTrigger>
          <TabsTrigger value="profitable" className="gap-2">
            <ThumbsUp className="h-4 w-4" />
            <span className="hidden sm:inline">{isGerman ? 'Rentabel' : 'Rentáveis'}</span>
          </TabsTrigger>
          <TabsTrigger value="unprofitable" className="gap-2">
            <ThumbsDown className="h-4 w-4" />
            <span className="hidden sm:inline">{isGerman ? 'Schwach' : 'Fracos'}</span>
          </TabsTrigger>
          <TabsTrigger value="improvements" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">{isGerman ? 'Trends' : 'Tendências'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Comparison: Profitable vs Unprofitable */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">{isGerman ? 'Rentabel vs Nicht-Rentabel' : 'Rentável vs Não-Rentável'}</h4>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        category: isGerman ? 'Produkte' : 'Produtos',
                        profitable: roasData.profitableProducts.length,
                        unprofitable: roasData.unprofitableProducts.length,
                      },
                      {
                        category: isGerman ? 'Umsatz (k€)' : 'Receita (k€)',
                        profitable: roasData.profitableProducts.reduce((sum, p) => sum + p.revenue, 0) / 1000,
                        unprofitable: roasData.unprofitableProducts.reduce((sum, p) => sum + p.revenue, 0) / 1000,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profitable" name={isGerman ? 'Rentabel' : 'Rentável'} fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unprofitable" name={isGerman ? 'Nicht-Rentabel' : 'Não-Rentável'} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Suggestions Distribution */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">{isGerman ? 'Empfehlungen nach Typ' : 'Recomendações por Tipo'}</h4>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { 
                          name: isGerman ? 'Budget erhöhen' : 'Aumentar Budget', 
                          value: roasData.suggestions.filter(s => s.type === 'increase_budget').length,
                          color: '#22c55e'
                        },
                        { 
                          name: isGerman ? 'Budget reduzieren' : 'Reduzir Budget', 
                          value: roasData.suggestions.filter(s => s.type === 'decrease_budget').length,
                          color: '#eab308'
                        },
                        { 
                          name: isGerman ? 'Nachbestellen' : 'Reabastecer', 
                          value: roasData.suggestions.filter(s => s.type === 'restock').length,
                          color: '#f97316'
                        },
                        { 
                          name: isGerman ? 'Optimieren' : 'Otimizar', 
                          value: roasData.suggestions.filter(s => s.type === 'optimize_listing').length,
                          color: '#3b82f6'
                        },
                        { 
                          name: 'Bundle', 
                          value: roasData.suggestions.filter(s => s.type === 'bundle').length,
                          color: '#a855f7'
                        },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { name: isGerman ? 'Budget erhöhen' : 'Aumentar Budget', value: roasData.suggestions.filter(s => s.type === 'increase_budget').length, color: '#22c55e' },
                        { name: isGerman ? 'Budget reduzieren' : 'Reduzir Budget', value: roasData.suggestions.filter(s => s.type === 'decrease_budget').length, color: '#eab308' },
                        { name: isGerman ? 'Nachbestellen' : 'Reabastecer', value: roasData.suggestions.filter(s => s.type === 'restock').length, color: '#f97316' },
                        { name: isGerman ? 'Optimieren' : 'Otimizar', value: roasData.suggestions.filter(s => s.type === 'optimize_listing').length, color: '#3b82f6' },
                        { name: 'Bundle', value: roasData.suggestions.filter(s => s.type === 'bundle').length, color: '#a855f7' },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Period Summary */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">{isGerman ? 'Periodenübersicht' : 'Resumo do Período'}</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(roasData.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">{isGerman ? 'Gesamt-Umsatz' : 'Receita Total'}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className={cn('text-2xl font-bold', roasData.overallROAS >= 3 ? 'text-green-600' : roasData.overallROAS >= 2 ? 'text-yellow-600' : 'text-red-600')}>
                  {roasData.overallROAS.toFixed(1)}x
                </p>
                <p className="text-sm text-muted-foreground">ROAS</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{roasData.profitableProducts.length}</p>
                <p className="text-sm text-muted-foreground">{isGerman ? 'Rentable Produkte' : 'Produtos Rentáveis'}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{roasData.unprofitableProducts.length}</p>
                <p className="text-sm text-muted-foreground">{isGerman ? 'Zur Optimierung' : 'Para Otimização'}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* High Priority */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold">{isGerman ? 'Hohe Priorität' : 'Alta Prioridade'}</h4>
              </div>
              <div className="space-y-3">
                {roasData.suggestions.filter(s => s.priority === 'high').length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isGerman ? 'Keine dringenden Empfehlungen' : 'Sem recomendações urgentes'}</p>
                ) : (
                  roasData.suggestions.filter(s => s.priority === 'high').map((suggestion, index) => (
                    <div key={`high-${index}`} className={cn('p-4 rounded-lg border', getSuggestionColor(suggestion.type))}>
                      <div className="flex items-start gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{suggestion.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.product}</p>
                          <p className="text-xs font-medium text-green-600 mt-2">{suggestion.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Medium & Low Priority */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">{isGerman ? 'Weitere Empfehlungen' : 'Outras Recomendações'}</h4>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {roasData.suggestions.filter(s => s.priority !== 'high').length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isGerman ? 'Keine weiteren Empfehlungen' : 'Sem outras recomendações'}</p>
                ) : (
                  roasData.suggestions.filter(s => s.priority !== 'high').map((suggestion, index) => (
                    <div key={`other-${index}`} className={cn('p-4 rounded-lg border', getSuggestionColor(suggestion.type))}>
                      <div className="flex items-start gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{suggestion.message}</p>
                            {getPriorityBadge(suggestion.priority)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.product}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-2">{suggestion.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
                <h5 className="font-medium text-green-700">{isGerman ? 'Budget erhöhen' : 'Aumentar Budget'}</h5>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {roasData.suggestions.filter(s => s.type === 'increase_budget').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isGerman ? 'Produkte mit hohem Potenzial' : 'Produtos com alto potencial'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-5 w-5 text-yellow-600" />
                <h5 className="font-medium text-yellow-700">{isGerman ? 'Budget reduzieren' : 'Reduzir Budget'}</h5>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {roasData.suggestions.filter(s => s.type === 'decrease_budget').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isGerman ? 'Produkte mit geringem ROI' : 'Produtos com baixo ROI'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h5 className="font-medium text-orange-700">{isGerman ? 'Nachbestellen' : 'Reabastecer'}</h5>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {roasData.suggestions.filter(s => s.type === 'restock').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isGerman ? 'Produkte mit Bestandsproblem' : 'Produtos com problema de estoque'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-purple-600" />
                <h5 className="font-medium text-purple-700">{isGerman ? 'Bundle-Potenzial' : 'Potencial Bundle'}</h5>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {roasData.suggestions.filter(s => s.type === 'bundle').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isGerman ? 'Produkte für Bundles' : 'Produtos para bundles'}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Profitable Products Tab */}
        <TabsContent value="profitable" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">{isGerman ? 'Top Performer (Basis-Artikel)' : 'Melhores Performers (Artigos Base)'}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Artikel-Basis' : 'Artigo Base'}</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Produkt' : 'Produto'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Umsatz' : 'Receita'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Verkauft' : 'Vendido'}</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Ø Preis' : 'Preço Méd.'}</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roasData.profitableProducts.map((product, index) => (
                    <tr key={`profitable-${product.artikelBasis}-${index}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-600 text-xs font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-sm">{product.artikelBasis}</td>
                      <td className="py-3 px-2 font-medium text-sm">{product.produktBasis}</td>
                      <td className="py-3 px-2 text-right font-semibold text-green-600">{formatCurrency(product.revenue)}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(product.unitsSold)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(product.avgPrice)}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium border',
                            product.stockStatus === 'healthy' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                            product.stockStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600' :
                            'bg-red-500/10 border-red-500/20 text-red-600'
                          )}>
                            {product.stockStatus === 'healthy' ? (isGerman ? 'Gut' : 'Bom') :
                             product.stockStatus === 'warning' ? (isGerman ? 'Warnung' : 'Alerta') :
                             (isGerman ? 'Kritisch' : 'Crítico')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Unprofitable Products Tab */}
        <TabsContent value="unprofitable" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold">{isGerman ? 'Schwache Performer (Basis-Artikel)' : 'Performers Fracos (Artigos Base)'}</h4>
            </div>
            {roasData.unprofitableProducts.length === 0 ? (
              <p className="text-muted-foreground">{isGerman ? 'Keine schwachen Produkte gefunden' : 'Nenhum produto fraco encontrado'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Artikel-Basis' : 'Artigo Base'}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Produkt' : 'Produto'}</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Umsatz' : 'Receita'}</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Verkauft' : 'Vendido'}</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Verfügbar' : 'Disponível'}</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Empfehlung' : 'Recomendação'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roasData.unprofitableProducts.map((product, index) => (
                      <tr key={`unprofitable-${product.artikelBasis}-${index}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 font-mono text-sm">{product.artikelBasis}</td>
                        <td className="py-3 px-2 font-medium text-sm">{product.produktBasis}</td>
                        <td className="py-3 px-2 text-right text-yellow-600">{formatCurrency(product.revenue)}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(product.unitsSold)}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(product.available)}</td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-muted-foreground">
                            {product.available > 10 
                              ? (isGerman ? 'SEO optimieren / Preis prüfen' : 'Otimizar SEO / Verificar preço')
                              : (isGerman ? 'Bestand prüfen' : 'Verificar estoque')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold">{isGerman ? 'Performance-Trends' : 'Tendências de Performance'}</h4>
            </div>
            {roasData.improvements.length === 0 ? (
              <p className="text-muted-foreground">{isGerman ? 'Keine Trenddaten verfügbar' : 'Nenhum dado de tendência disponível'}</p>
            ) : (
              <div className="space-y-4">
                {roasData.improvements.map((improvement, index) => (
                  <div key={`improvement-${index}`} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{improvement.product}</p>
                      <p className="text-sm text-muted-foreground">{improvement.metric}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {improvement.isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={cn('font-bold', improvement.isPositive ? 'text-green-600' : 'text-red-600')}>
                          {improvement.isPositive ? '+' : ''}{improvement.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(improvement.previousValue)} → {formatCurrency(improvement.currentValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What's Working Well */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-700">{isGerman ? 'Was gut läuft' : 'O que está funcionando'}</h4>
              </div>
              <ul className="space-y-3">
                {roasData.overallROAS >= 3 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{isGerman ? 'ROAS liegt über dem Branchendurchschnitt von 3x' : 'ROAS está acima da média do setor de 3x'}</span>
                  </li>
                )}
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{isGerman ? `${roasData.profitableProducts.length} Produkte performen überdurchschnittlich` : `${roasData.profitableProducts.length} produtos performando acima da média`}</span>
                </li>
                {metrics.healthyStock > metrics.totalProducts * 0.5 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{isGerman ? 'Mehr als 50% der Produkte haben gesunden Bestand' : 'Mais de 50% dos produtos têm estoque saudável'}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-700">{isGerman ? 'Verbesserungspotenzial' : 'Potencial de Melhoria'}</h4>
              </div>
              <ul className="space-y-3">
                {roasData.unprofitableProducts.length > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>{isGerman ? `${roasData.unprofitableProducts.length} Produkte brauchen Optimierung` : `${roasData.unprofitableProducts.length} produtos precisam de otimização`}</span>
                  </li>
                )}
                {metrics.criticalStock > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>{isGerman ? `${metrics.criticalStock} Produkte mit kritischem Bestand` : `${metrics.criticalStock} produtos com estoque crítico`}</span>
                  </li>
                )}
                {roasData.overallROAS < 3 && (
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>{isGerman ? 'ROAS liegt unter dem Zielwert - Kampagnen optimieren' : 'ROAS está abaixo do objetivo - otimizar campanhas'}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
