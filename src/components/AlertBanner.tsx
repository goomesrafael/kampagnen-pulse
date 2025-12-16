import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lightbulb, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  messageKey: string;
  interpolation?: Record<string, string | number>;
}

const sampleAlerts: Alert[] = [
  { id: '1', type: 'warning', messageKey: 'alerts.trafficDrop', interpolation: { percent: 35 } },
  { id: '2', type: 'error', messageKey: 'alerts.lowCtr' },
  { id: '3', type: 'info', messageKey: 'suggestions.improving' },
];

interface AlertBannerProps {
  className?: string;
}

export function AlertBanner({ className }: AlertBannerProps) {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState(sampleAlerts);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning-foreground';
      case 'info':
        return 'bg-primary/10 border-primary/30 text-primary';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'info':
        return <Lightbulb className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 animate-fade-in',
            getAlertStyles(alert.type)
          )}
        >
          <div className="flex items-center gap-3">
            {getAlertIcon(alert.type)}
            <p className="text-sm font-medium">
              {t(alert.messageKey, alert.interpolation)}
            </p>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="rounded-md p-1 hover:bg-background/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
