import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lightbulb,
  Target,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductData, ProductData, SEORecommendation } from '@/hooks/useProductData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductAnalyticsProps {
  className?: string;
  onRefresh?: () => void;
  dateRange?: DateRange;
}

type StatusFilter = 'all' | 'healthy' | 'warning' | 'critical';
type SortField = 'artikelBasis' | 'produktBasis' | 'unitsSold' | 'revenue' | 'available' | 'stockStatus';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 15;

export function ProductAnalytics({ className, onRefresh, dateRange }: ProductAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, refresh } = useProductData(dateRange);
  const isGerman = i18n.language === 'de';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let result = data.products.filter(product => {
      const matchesStatus = statusFilter === 'all' || product.stockStatus === statusFilter;
      const matchesSearch = searchQuery === '' || 
        product.artikelBasis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.produktBasis.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'artikelBasis':
        case 'produktBasis':
          comparison = a[sortField].localeCompare(b[sortField]);
          break;
        case 'unitsSold':
        case 'revenue':
        case 'available':
          comparison = a[sortField] - b[sortField];
          break;
        case 'stockStatus':
          const statusOrder = { critical: 0, warning: 1, healthy: 2 };
          comparison = statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [data, statusFilter, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="text-left py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-primary" : "opacity-50")} />
      </div>
    </th>
  );

  // Export to CSV function
  const exportToCSV = () => {
    if (!filteredProducts.length) return;
    
    const headers = [
      isGerman ? 'Artikel-Basis' : 'Artigo Base',
      isGerman ? 'Produkt' : 'Produto',
      isGerman ? 'Verkauft' : 'Vendido',
      isGerman ? 'Umsatz' : 'Receita',
      isGerman ? 'Verfügbar' : 'Disponível',
      'Status'
    ];
    
    const statusLabels = {
      healthy: isGerman ? 'Gut' : 'Bom',
      warning: isGerman ? 'Warnung' : 'Alerta',
      critical: isGerman ? 'Kritisch' : 'Crítico'
    };
    
    const csvContent = [
      headers.join(';'),
      ...filteredProducts.map(p => [
        p.artikelBasis,
        `"${p.produktBasis.replace(/"/g, '""')}"`,
        p.unitsSold,
        p.revenue.toFixed(2),
        p.available,
        statusLabels[p.stockStatus]
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produtos_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

  const getStockStatusColor = (status: ProductData['stockStatus']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20 text-green-600';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
    }
  };

  const getStockStatusIcon = (status: ProductData['stockStatus']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'critical':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStockStatusLabel = (status: ProductData['stockStatus']) => {
    if (isGerman) {
      switch (status) {
        case 'healthy': return 'Gut';
        case 'warning': return 'Warnung';
        case 'critical': return 'Kritisch';
      }
    } else {
      switch (status) {
        case 'healthy': return 'Saudável';
        case 'warning': return 'Alerta';
        case 'critical': return 'Crítico';
      }
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

  const getTypeIcon = (type: SEORecommendation['type']) => {
    switch (type) {
      case 'opportunity': return <Search className="h-4 w-4" />;
      case 'waste': return <Trash2 className="h-4 w-4" />;
      case 'optimize': return <Lightbulb className="h-4 w-4" />;
      case 'ads_invest': return <ArrowUpRight className="h-4 w-4" />;
      case 'ads_reduce': return <ArrowDownRight className="h-4 w-4" />;
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

  if (!data || data.products.length === 0) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{t('products.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('products.subtitle')}</p>
          </div>
        </div>
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          {isGerman ? 'Aktualisieren' : 'Atualizar'}
        </Button>
      </div>
    );
  }

  const metrics = data.metrics;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{isGerman ? 'Verkaufsanalyse (Basis-Artikel)' : 'Análise de Vendas (Artigos Base)'}</h3>
            <p className="text-sm text-muted-foreground">
              {isGerman ? 'Aggregiert nach Produkt-Modell, nicht Varianten' : 'Agregado por modelo de produto, não variações'}
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">{isGerman ? 'Aktualisieren' : 'Atualizar'}</span>
        </Button>
      </div>

      {/* Critical Alerts */}
      {data.criticalAlerts.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-700">
              {isGerman ? 'Kritische Warnungen' : 'Alertas Críticos'} ({data.criticalAlerts.length})
            </h4>
          </div>
          <div className="space-y-2">
            {data.criticalAlerts.slice(0, 5).map((product, index) => (
              <div key={`alert-${product.artikelBasis}-${index}`} className="flex items-center justify-between text-sm">
                <span className="font-medium text-red-700">{product.artikelBasis} - {product.produktBasis}</span>
                <span className="text-red-600">
                  {isGerman ? 'Nicht verfügbar! Verkäufe:' : 'Indisponível! Vendas:'} {formatNumber(product.unitsSold)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="p-4 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Basis-Produkte' : 'Produtos Base'}</span>
          </div>
          <span className="text-xl font-bold">{formatNumber(metrics.totalProducts)}</span>
        </div>

        <div className="p-4 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Umsatz' : 'Receita'}</span>
          </div>
          <span className="text-xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</span>
        </div>

        <div className="p-4 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Verkauft' : 'Vendido'}</span>
          </div>
          <span className="text-xl font-bold">{formatNumber(metrics.totalUnitsSold)}</span>
        </div>

        <div className="p-4 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">{isGerman ? 'Ø Preis' : 'Preço Méd.'}</span>
          </div>
          <span className="text-xl font-bold">{formatCurrency(metrics.avgPrice)}</span>
        </div>

        <button
          onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
          className={cn(
            "p-4 rounded-lg border transition-all cursor-pointer hover:scale-105",
            statusFilter === 'healthy' 
              ? "bg-green-500/20 border-green-500/40 ring-2 ring-green-500/50" 
              : "bg-green-500/10 border-green-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">{isGerman ? 'Gut' : 'Bom'}</span>
          </div>
          <span className="text-xl font-bold text-green-600">{formatNumber(metrics.healthyStock)}</span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={cn(
            "p-4 rounded-lg border transition-all cursor-pointer hover:scale-105",
            statusFilter === 'warning' 
              ? "bg-yellow-500/20 border-yellow-500/40 ring-2 ring-yellow-500/50" 
              : "bg-yellow-500/10 border-yellow-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">{isGerman ? 'Warnung' : 'Alerta'}</span>
          </div>
          <span className="text-xl font-bold text-yellow-600">{formatNumber(metrics.warningStock)}</span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={cn(
            "p-4 rounded-lg border transition-all cursor-pointer hover:scale-105",
            statusFilter === 'critical' 
              ? "bg-red-500/20 border-red-500/40 ring-2 ring-red-500/50" 
              : "bg-red-500/10 border-red-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">{isGerman ? 'Kritisch' : 'Crítico'}</span>
          </div>
          <span className="text-xl font-bold text-red-600">{formatNumber(metrics.criticalStock)}</span>
        </button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">{isGerman ? 'Übersicht' : 'Visão Geral'}</TabsTrigger>
          <TabsTrigger value="seo">{isGerman ? 'SEO-Analyse' : 'Análise SEO'}</TabsTrigger>
          <TabsTrigger value="stock">{isGerman ? 'Bestand' : 'Estoque'}</TabsTrigger>
          <TabsTrigger value="all">{isGerman ? 'Alle Produkte' : 'Todos'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top 5 Best Selling */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">{isGerman ? 'Top 5 Meistverkaufte (Basis)' : 'Top 5 Mais Vendidos (Base)'}</h4>
              </div>
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div
                    key={`top-${product.artikelBasis}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{product.artikelBasis}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.produktBasis}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-semibold text-sm text-green-600">{formatCurrency(product.revenue)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-muted-foreground">{formatNumber(product.unitsSold)} {isGerman ? 'un.' : 'un.'}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium border', getStockStatusColor(product.stockStatus))}>
                          {product.available}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Slow Moving */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">{isGerman ? 'Top 5 Geringe Verkäufe (Basis)' : 'Top 5 Baixa Venda (Base)'}</h4>
              </div>
              <div className="space-y-3">
                {data.slowProducts.map((product, index) => (
                  <div
                    key={`slow-${product.artikelBasis}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'px-2 py-1 rounded text-xs font-medium border flex items-center gap-1',
                        getStockStatusColor(product.stockStatus)
                      )}>
                        {getStockStatusIcon(product.stockStatus)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{product.artikelBasis}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.produktBasis}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-semibold text-sm">{formatNumber(product.unitsSold)} {isGerman ? 'un.' : 'un.'}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SEO Analysis Tab */}
        <TabsContent value="seo" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* SEO Opportunities */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">{isGerman ? 'SEO-Chancen' : 'Oportunidades SEO'} ({data.seoOpportunities.length})</h4>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
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

            {/* SEO Waste */}
            <div className="rounded-xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold">{isGerman ? 'SEO-Verluste' : 'Perdas SEO'} ({data.seoWaste.length})</h4>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.seoWaste.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isGerman ? 'Keine Verluste' : 'Sem perdas'}</p>
                ) : (
                  data.seoWaste.map((rec, index) => (
                    <div key={`waste-${rec.artikelBasis}-${index}`} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-2">
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
          </div>

          {/* Strategic Insights */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold">{isGerman ? 'Strategische Empfehlungen' : 'Recomendações Estratégicas'}</h4>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h5 className="font-medium text-green-700 mb-2">{isGerman ? 'Google Ads' : 'Google Ads'}</h5>
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
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card overflow-x-auto">
            <h4 className="font-semibold mb-4">{isGerman ? 'Bestandsübersicht (Basis-Artikel)' : 'Visão de Estoque (Artigos Base)'}</h4>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Artikel-Basis' : 'Artigo Base'}</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Produkt' : 'Produto'}</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Auf Lager' : 'Em Estoque'}</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'In Aufträgen' : 'Em Pedidos'}</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{isGerman ? 'Verfügbar' : 'Disponível'}</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.products
                  .sort((a, b) => a.available - b.available)
                  .slice(0, 20)
                  .map((product, index) => (
                    <tr key={`stock-${product.artikelBasis}-${index}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-mono text-sm">{product.artikelBasis}</td>
                      <td className="py-3 px-2 font-medium text-sm">{product.produktBasis}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(product.stockOnHand)}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(product.inOrders)}</td>
                      <td className="py-3 px-2 text-right font-semibold">{formatNumber(product.available)}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium border flex items-center gap-1',
                            getStockStatusColor(product.stockStatus)
                          )}>
                            {getStockStatusIcon(product.stockStatus)}
                            {getStockStatusLabel(product.stockStatus)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* All Products Tab */}
        <TabsContent value="all" className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card overflow-x-auto">
            {/* Header with title and controls */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  {isGerman ? 'Alle Basis-Produkte' : 'Todos os Produtos Base'} 
                  ({filteredProducts.length})
                </h4>
                <Button 
                  onClick={exportToCSV} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  disabled={filteredProducts.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{isGerman ? 'Exportieren' : 'Exportar'}</span>
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isGerman ? 'Suche nach Artikelnummer oder Name...' : 'Buscar por número do artigo ou nome...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={isGerman ? 'Status filtern' : 'Filtrar status'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isGerman ? 'Alle Status' : 'Todos os Status'}</SelectItem>
                      <SelectItem value="healthy">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {isGerman ? 'Gut' : 'Bom'}
                        </div>
                      </SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          {isGerman ? 'Warnung' : 'Alerta'}
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          {isGerman ? 'Kritisch' : 'Crítico'}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {(statusFilter !== 'all' || searchQuery !== '') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                    >
                      {isGerman ? 'Zurücksetzen' : 'Limpar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Table */}
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <SortableHeader field="artikelBasis">{isGerman ? 'Artikel-Basis' : 'Artigo Base'}</SortableHeader>
                  <SortableHeader field="produktBasis">{isGerman ? 'Produkt' : 'Produto'}</SortableHeader>
                  <SortableHeader field="unitsSold">{isGerman ? 'Verkauft' : 'Vendido'}</SortableHeader>
                  <SortableHeader field="revenue">{isGerman ? 'Umsatz' : 'Receita'}</SortableHeader>
                  <SortableHeader field="available">{isGerman ? 'Verfügbar' : 'Disponível'}</SortableHeader>
                  <SortableHeader field="stockStatus">Status</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {isGerman ? 'Keine Produkte gefunden' : 'Nenhum produto encontrado'}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <tr key={`all-${product.artikelBasis}-${index}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-mono text-sm">{product.artikelBasis}</td>
                      <td className="py-3 px-2 font-medium text-sm">{product.produktBasis}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(product.unitsSold)}</td>
                      <td className="py-3 px-2 text-right text-green-600">{formatCurrency(product.revenue)}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(product.available)}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium border flex items-center gap-1',
                            getStockStatusColor(product.stockStatus)
                          )}>
                            {getStockStatusIcon(product.stockStatus)}
                            {getStockStatusLabel(product.stockStatus)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {isGerman 
                    ? `Seite ${currentPage} von ${totalPages} (${filteredProducts.length} Produkte)` 
                    : `Página ${currentPage} de ${totalPages} (${filteredProducts.length} produtos)`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
