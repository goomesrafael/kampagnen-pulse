import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon,
  className,
  loading = false,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <div className={cn('metric-card', className)}>
        <div className="flex items-start justify-between mb-4">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-8 w-8 rounded-lg" />
        </div>
        <div className="shimmer h-8 w-32 rounded mb-2" />
        <div className="shimmer h-4 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('metric-card card-interactive group', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                <p className="text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs font-medium',
              isPositive ? 'text-success' : 'text-destructive'
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
