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

// Fallback sample campaign data
const sampleCampaignData: CampaignData[] = [
  { name: 'Brand Search', clicks: 4520, impressions: 45200, conversions: 312, spend: 1200 },
  { name: 'Shopping', clicks: 3890, impressions: 38900, conversions: 245, spend: 980 },
  { name: 'Display', clicks: 2100, impressions: 42000, conversions: 89, spend: 650 },
  { name: 'Remarketing', clicks: 1850, impressions: 18500, conversions: 167, spend: 420 },
  { name: 'Video', clicks: 980, impressions: 19600, conversions: 42, spend: 380 },
];

export function CampaignChart({ className, loading = false, data }: CampaignChartProps) {
  const { t } = useTranslation();
  const chartData = data && data.length > 0 ? data : sampleCampaignData;

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
        <div className="shimmer h-5 w-48 rounded mb-2" />
        <div className="shimmer h-4 w-72 rounded mb-6" />
        <div className="shimmer h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-card p-6 shadow-card card-interactive', className)}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-foreground">
          {t('dashboard.charts.campaignPerformance')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        {t('dashboard.charts.campaignDesc')}
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
                  const item = payload[0].payload as CampaignData;
                  return (
                    <div className="chart-tooltip">
                      <p className="font-medium text-foreground mb-1">{item.name}</p>
                      <p className="text-primary">
                        {t('dashboard.metrics.clicks')}: {item.clicks.toLocaleString()}
                      </p>
                      <p className="text-success">
                        {t('dashboard.metrics.conversions')}: {item.conversions}
                      </p>
                      {item.spend > 0 && (
                        <p className="text-muted-foreground">
                          Spend: €{item.spend.toLocaleString()}
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
