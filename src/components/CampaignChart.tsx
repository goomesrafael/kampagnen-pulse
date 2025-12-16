import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignChartProps {
  className?: string;
  loading?: boolean;
}

// Sample campaign data
const campaignData = [
  { name: 'Brand Search', clicks: 4520, conversions: 312, roas: 4.2 },
  { name: 'Shopping', clicks: 3890, conversions: 245, roas: 3.8 },
  { name: 'Display', clicks: 2100, conversions: 89, roas: 2.1 },
  { name: 'Remarketing', clicks: 1850, conversions: 167, roas: 5.2 },
  { name: 'Video', clicks: 980, conversions: 42, roas: 1.8 },
];

export function CampaignChart({ className, loading = false }: CampaignChartProps) {
  const { t } = useTranslation();

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
          <BarChart data={campaignData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
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
                  const data = payload[0].payload;
                  return (
                    <div className="chart-tooltip">
                      <p className="font-medium text-foreground mb-1">{data.name}</p>
                      <p className="text-primary">
                        {t('dashboard.metrics.clicks')}: {data.clicks.toLocaleString()}
                      </p>
                      <p className="text-success">
                        {t('dashboard.metrics.conversions')}: {data.conversions}
                      </p>
                      <p className="text-accent-foreground">
                        ROAS: {data.roas}x
                      </p>
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
