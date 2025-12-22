import { useTranslation } from 'react-i18next';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Star,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductData, ProductData } from '@/hooks/useProductData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductAnalyticsProps {
  className?: string;
  onRefresh?: () => void;
}

export function ProductAnalytics({ className, onRefresh }: ProductAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, refresh } = useProductData();

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'pt-BR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'pt-BR');
  };

  const getStatusColor = (status: ProductData['status']) => {
    switch (status) {
      case 'bestseller':
        return 'bg-green-500/10 border-green-500/20 text-green-600';
      case 'good':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      case 'slow':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
    }
  };

  const getStatusLabel = (status: ProductData['status']) => {
    switch (status) {
      case 'bestseller':
        return t('products.status.bestseller');
      case 'good':
        return t('products.status.good');
      case 'slow':
        return t('products.status.slow');
      case 'critical':
        return t('products.status.critical');
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
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
          {t('common.retry') || 'Retry'}
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
      </div>
    );
  }

  const metrics = data.metrics;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Metrics */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t('products.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('products.subtitle')}</p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language === 'de' ? 'Aktualisieren' : 'Atualizar'}</span>
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{t('products.metrics.totalProducts')}</span>
            </div>
            <span className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</span>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">{t('products.metrics.totalRevenue')}</span>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</span>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">{t('products.metrics.unitsSold')}</span>
            </div>
            <span className="text-2xl font-bold">{formatNumber(metrics.totalUnitsSold)}</span>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium">{t('products.metrics.avgPrice')}</span>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(metrics.avgPrice)}</span>
          </div>

          <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">{t('products.metrics.bestsellers')}</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{formatNumber(metrics.bestsellers)}</span>
          </div>

          <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">{t('products.metrics.slowMoving')}</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{formatNumber(metrics.slowMoving)}</span>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold">{t('products.topSelling')}</h4>
        </div>
        <div className="space-y-3">
          {data.topProducts.map((product, index) => (
            <div
              key={`${product.name}-${index}`}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatNumber(product.unitsSold)} {t('products.units')}</p>
                <p className="text-sm text-green-600">{formatCurrency(product.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slow Moving Products */}
      <div className="rounded-xl bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="h-5 w-5 text-yellow-600" />
          <h4 className="font-semibold">{t('products.slowMoving')}</h4>
        </div>
        <div className="space-y-3">
          {data.slowProducts.map((product, index) => (
            <div
              key={`${product.name}-${index}`}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'px-2 py-1 rounded text-xs font-medium border',
                  getStatusColor(product.status)
                )}>
                  {getStatusLabel(product.status)}
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatNumber(product.unitsSold)} {t('products.units')}</p>
                <p className="text-sm text-muted-foreground">{t('products.stock')}: {formatNumber(product.stock)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Products Table */}
      <div className="rounded-xl bg-card p-6 shadow-card overflow-x-auto">
        <h4 className="font-semibold mb-4">{t('products.allProducts')}</h4>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.name')}</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.category')}</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.unitsSold')}</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.revenue')}</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.stock')}</th>
              <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">{t('products.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product, index) => (
              <tr key={`${product.name}-${index}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 font-medium">{product.name}</td>
                <td className="py-3 px-2 text-muted-foreground">{product.category}</td>
                <td className="py-3 px-2 text-right">{formatNumber(product.unitsSold)}</td>
                <td className="py-3 px-2 text-right text-green-600">{formatCurrency(product.revenue)}</td>
                <td className="py-3 px-2 text-right">{formatNumber(product.stock)}</td>
                <td className="py-3 px-2">
                  <div className="flex justify-center">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium border',
                      getStatusColor(product.status)
                    )}>
                      {getStatusLabel(product.status)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
