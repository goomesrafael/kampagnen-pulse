import { useTranslation } from 'react-i18next';
import { CampaignData } from '@/hooks/useGoogleSheetsData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CampaignPerformanceTableProps {
  campaigns: CampaignData[] | undefined;
  loading?: boolean;
}

function ChangeIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;
  
  if (Math.abs(value) < 0.1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
    }`}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatCurrency(num: number): string {
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function formatPercent(num: number): string {
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
}

export function CampaignPerformanceTable({ campaigns, loading }: CampaignPerformanceTableProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = campaigns.reduce((acc, c) => ({
    clicks: acc.clicks + c.clicks,
    impressions: acc.impressions + c.impressions,
    conversions: acc.conversions + c.conversions,
    spend: acc.spend + c.spend,
  }), { clicks: 0, impressions: 0, conversions: 0, spend: 0 });

  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const totalAvgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const totalCostPerConv = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
  const totalConvRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg">{t('table.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-semibold min-w-[180px] sticky left-0 bg-muted/20">{t('table.campaign')}</TableHead>
                <TableHead className="text-right font-semibold">{t('table.clicks')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.impressions')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">CTR</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.avgCpc')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.cost')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.conversions')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.costPerConv')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
                <TableHead className="text-right font-semibold">{t('table.convRate')}</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">% Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.campaignId} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium min-w-[180px] sticky left-0 bg-background">
                    <div className="flex flex-col">
                      <span className="text-sm">{campaign.name}</span>
                      <span className={`text-xs ${campaign.status === 'ENABLED' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {campaign.status === 'ENABLED' ? '● Active' : '○ Paused'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(campaign.clicks)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.clicksChange} /></TableCell>
                  <TableCell className="text-right tabular-nums font-medium bg-amber-50/50">{formatNumber(campaign.impressions)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.impressionsChange} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(campaign.ctr)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.ctrChange} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(campaign.avgCpc)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.avgCpcChange} inverted /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(campaign.spend)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.costChange} inverted /></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatNumber(campaign.conversions)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.conversionsChange} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(campaign.costPerConversion)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.costPerConversionChange} inverted /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(campaign.conversionRate)}</TableCell>
                  <TableCell className="text-right"><ChangeIndicator value={campaign.conversionRateChange} /></TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-muted/40 font-semibold border-t-2">
                <TableCell className="sticky left-0 bg-muted/40">Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(totals.clicks)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(totals.impressions)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(totalCtr)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totalAvgCpc)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totals.spend)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(totals.conversions)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totalCostPerConv)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(totalConvRate)}</TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/20">
          1 - {campaigns.length} / {campaigns.length}
        </div>
      </CardContent>
    </Card>
  );
}
