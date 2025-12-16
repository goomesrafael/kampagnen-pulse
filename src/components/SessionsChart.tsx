import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionsChartProps {
  className?: string;
  loading?: boolean;
}

// Sample data - in production this would come from GA4 API
const generateSampleData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      sessions: Math.floor(Math.random() * 500) + 800,
      pageviews: Math.floor(Math.random() * 1200) + 1500,
    });
  }
  return data;
};

const data = generateSampleData();

export function SessionsChart({ className, loading = false }: SessionsChartProps) {
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
          {t('dashboard.charts.sessionsTitle')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        {t('dashboard.charts.sessionsDesc')}
      </p>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={10}
              width={50}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="chart-tooltip">
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-primary">
                        {t('dashboard.metrics.sessions')}: {payload[0].value?.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#sessionsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
