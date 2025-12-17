import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CampaignData } from '@/hooks/useGoogleSheetsData';

interface CampaignChartProps {
  className?: string;
  loading?: boolean;
  data?: CampaignData[];
}

interface ChartDataPoint {
  name: string;
  clicks: number;
  conversions: number;
  spend: number;
}

export function CampaignChart({ className, loading = false, data }: CampaignChartProps) {
  const { t } = useTranslation();
  
  // Transform campaign data to chart format
  const chartData: ChartDataPoint[] = data?.map(c => ({
    name: c.name,
    clicks: c.clicks,
    conversions: c.conversions,
    spend: c.spend,
  })) || [];

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <div className="shimmer h-5 w-48 rounded mb-2" />
        <div className="shimmer h-4 w-72 rounded mb-6" />
        <div className="shimmer h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <h3 className="text-base font-semibold text-foreground mb-2">
          {t('charts.campaigns')}
        </h3>
        <p className="text-muted-foreground text-center py-12">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-card p-6 shadow-card card-interactive', className)}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-foreground">
          {t('charts.campaigns')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        {t('charts.campaignsDesc')}
      </p>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis 
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={75}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="chart-tooltip">
                      <p className="font-medium text-foreground mb-1">{item.name}</p>
                      <p className="text-primary">
                        {t('table.clicks')}: {item.clicks.toLocaleString()}
                      </p>
                      <p className="text-success">
                        {t('table.conversions')}: {item.conversions}
                      </p>
                      {item.spend > 0 && (
                        <p className="text-muted-foreground">
                          {t('table.cost')}: {item.spend.toFixed(2)} €
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="clicks" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
