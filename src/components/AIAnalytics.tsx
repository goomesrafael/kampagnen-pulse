import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CampaignData, CampaignMetrics } from '@/hooks/useGoogleSheetsData';

interface AIAnalyticsProps {
  campaigns?: CampaignData[];
  metrics?: CampaignMetrics;
  seoScore?: number;
  className?: string;
}

interface AnalysisResult {
  summary: string;
  improvements: {
    type: 'positive' | 'negative' | 'neutral';
    category?: 'campaign' | 'seo';
    title: string;
    description: string;
    value?: string;
    action?: string;
  }[];
  recommendations: string[];
}

export function AIAnalytics({ campaigns, metrics, seoScore = 83, className }: AIAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const performAnalysis = () => {
    if (!campaigns || !metrics) return;

    setIsAnalyzing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const totalClicks = metrics.clicks;
      const totalImpressions = metrics.impressions;
      const totalConversions = metrics.conversions;
      const totalSpend = metrics.spend;
      const avgCtr = (totalClicks / totalImpressions) * 100;
      const avgCostPerConv = totalSpend / totalConversions;

      // Find best and worst performing campaigns
      const sortedByCtr = [...campaigns].sort((a, b) => b.ctr - a.ctr);
      const bestCtrCampaign = sortedByCtr[0];
      const worstCtrCampaign = sortedByCtr[sortedByCtr.length - 1];

      const sortedByCostPerConv = [...campaigns].sort((a, b) => a.costPerConversion - b.costPerConversion);
      const bestCostCampaign = sortedByCostPerConv[0];
      const worstCostCampaign = sortedByCostPerConv[sortedByCostPerConv.length - 1];

      const isGerman = i18n.language === 'de';

      const result: AnalysisResult = {
        summary: isGerman
          ? `Ihre ${campaigns.length} Kampagnen haben insgesamt ${totalClicks.toLocaleString()} Klicks und ${totalConversions.toLocaleString()} Conversions generiert. Die durchschnittliche CTR betraegt ${avgCtr.toFixed(2)}% und die durchschnittlichen Kosten pro Conversion liegen bei ${avgCostPerConv.toFixed(2)} EUR. Ihr SEO-Score liegt bei ${seoScore}/100.`
          : `Suas ${campaigns.length} campanhas geraram um total de ${totalClicks.toLocaleString()} cliques e ${totalConversions.toLocaleString()} conversoes. O CTR medio e de ${avgCtr.toFixed(2)}% e o custo medio por conversao e de ${avgCostPerConv.toFixed(2)} EUR. Seu score SEO e ${seoScore}/100.`,
        improvements: [
          {
            type: 'positive',
            category: 'campaign',
            title: isGerman ? 'Beste CTR-Leistung' : 'Melhor desempenho de CTR',
            description: isGerman
              ? `Die Kampagne "${bestCtrCampaign?.name}" hat die beste CTR mit ${bestCtrCampaign?.ctr.toFixed(2)}%.`
              : `A campanha "${bestCtrCampaign?.name}" tem o melhor CTR com ${bestCtrCampaign?.ctr.toFixed(2)}%.`,
            value: `${bestCtrCampaign?.ctr.toFixed(2)}%`,
          },
          {
            type: 'negative',
            category: 'campaign',
            title: isGerman ? 'CTR optimierungsbeduerftigt' : 'CTR precisa de otimizacao',
            description: isGerman
              ? `Die Kampagne "${worstCtrCampaign?.name}" hat eine niedrige CTR von ${worstCtrCampaign?.ctr.toFixed(2)}%. Empfehlung: Anzeigentexte ueberarbeiten.`
              : `A campanha "${worstCtrCampaign?.name}" tem um CTR baixo de ${worstCtrCampaign?.ctr.toFixed(2)}%. Recomendacao: Revisar textos dos anuncios.`,
            value: `${worstCtrCampaign?.ctr.toFixed(2)}%`,
            action: isGerman 
              ? `Google Ads > Kampagnen > ${worstCtrCampaign?.name} > Anzeigen bearbeiten`
              : `Google Ads > Campanhas > ${worstCtrCampaign?.name} > Editar anuncios`,
          },
          {
            type: 'positive',
            category: 'campaign',
            title: isGerman ? 'Effizienteste Kampagne' : 'Campanha mais eficiente',
            description: isGerman
              ? `"${bestCostCampaign?.name}" hat die niedrigsten Kosten pro Conversion: ${bestCostCampaign?.costPerConversion.toFixed(2)} EUR.`
              : `"${bestCostCampaign?.name}" tem o menor custo por conversao: ${bestCostCampaign?.costPerConversion.toFixed(2)} EUR.`,
            value: `${bestCostCampaign?.costPerConversion.toFixed(2)} EUR`,
          },
          {
            type: 'negative',
            category: 'campaign',
            title: isGerman ? 'Hohe Kosten pro Conversion' : 'Alto custo por conversao',
            description: isGerman
              ? `"${worstCostCampaign?.name}" hat hohe Kosten pro Conversion: ${worstCostCampaign?.costPerConversion.toFixed(2)} EUR. Budget um 20% reduzieren koennte ${(worstCostCampaign?.spend * 0.2).toFixed(2)} EUR sparen.`
              : `"${worstCostCampaign?.name}" tem alto custo por conversao: ${worstCostCampaign?.costPerConversion.toFixed(2)} EUR. Reduzir o orcamento em 20% poderia economizar ${(worstCostCampaign?.spend * 0.2).toFixed(2)} EUR.`,
            value: `${worstCostCampaign?.costPerConversion.toFixed(2)} EUR`,
            action: isGerman
              ? `Google Ads > Kampagnen > ${worstCostCampaign?.name} > Budget > -20%`
              : `Google Ads > Campanhas > ${worstCostCampaign?.name} > Orcamento > -20%`,
          },
          // SEO Findings
          {
            type: seoScore >= 80 ? 'positive' : seoScore >= 60 ? 'neutral' : 'negative',
            category: 'seo',
            title: isGerman ? 'SEO-Gesamtbewertung' : 'Avaliacao geral de SEO',
            description: isGerman
              ? `Ihr SEO-Score betraegt ${seoScore}/100. ${seoScore >= 80 ? 'Sehr gute Leistung!' : seoScore >= 60 ? 'Gute Basis, aber Optimierung empfohlen.' : 'Dringender Handlungsbedarf!'}`
              : `Seu score SEO e ${seoScore}/100. ${seoScore >= 80 ? 'Muito bom desempenho!' : seoScore >= 60 ? 'Boa base, mas otimizacao recomendada.' : 'Acao urgente necessaria!'}`,
            value: `${seoScore}/100`,
          },
          {
            type: 'negative',
            category: 'seo',
            title: isGerman ? 'Fehlende strukturierte Daten' : 'Dados estruturados ausentes',
            description: isGerman
              ? 'Schema.org Markup fehlt auf 65% der Seiten. Dies reduziert die Sichtbarkeit in den Suchergebnissen um ca. 15-20%.'
              : 'Markup Schema.org ausente em 65% das paginas. Isso reduz a visibilidade nos resultados de busca em cerca de 15-20%.',
            value: '35%',
            action: isGerman
              ? 'Google Search Console > Verbesserungen > Strukturierte Daten hinzufuegen'
              : 'Google Search Console > Melhorias > Adicionar dados estruturados',
          },
          {
            type: 'warning' as any,
            category: 'seo',
            title: isGerman ? 'Core Web Vitals optimieren' : 'Otimizar Core Web Vitals',
            description: isGerman
              ? 'LCP (Largest Contentful Paint) liegt bei 2.3s, Ziel ist unter 2.5s. CLS-Score koennte um 0.05 verbessert werden fuer besseres Ranking.'
              : 'LCP (Largest Contentful Paint) esta em 2.3s, meta e abaixo de 2.5s. Score CLS poderia melhorar em 0.05 para melhor ranking.',
            value: '65%',
            action: isGerman
              ? 'PageSpeed Insights > Bilder komprimieren, CSS/JS minimieren'
              : 'PageSpeed Insights > Comprimir imagens, minimizar CSS/JS',
          },
        ],
        recommendations: isGerman
          ? [
              `KAMPAGNEN: Erhoehen Sie das Budget fuer "${bestCostCampaign?.name}" um 15% (potenzielle +${Math.round(bestCostCampaign?.conversions * 0.15)} Conversions).`,
              `KAMPAGNEN: Fuer "${worstCtrCampaign?.name}": Testen Sie neue Anzeigenvarianten - erwartete CTR-Steigerung: +0.5%.`,
              `KAMPAGNEN: ROAS liegt bei ${metrics.roas.toFixed(2)}x - ${metrics.roas > 3 ? 'Gute Leistung!' : `Ziel: 3.0x (+${((3 - metrics.roas) / metrics.roas * 100).toFixed(0)}% Steigerung noetig).`}`,
              `SEO: Strukturierte Daten hinzufuegen koennte 15-20% mehr organischen Traffic bringen (ca. +${Math.round(totalClicks * 0.35 * 0.17)} Besucher/Monat).`,
              `SEO: Meta-Beschreibungen fuer alle Seiten optimieren - erwartete CTR-Steigerung in SERPs: +5-10%.`,
              `SEO: Ladezeit von 2.3s auf unter 2s reduzieren koennte Absprungrate um 3-5% senken.`,
            ]
          : [
              `CAMPANHAS: Aumente o orcamento de "${bestCostCampaign?.name}" em 15% (potencial +${Math.round(bestCostCampaign?.conversions * 0.15)} conversoes).`,
              `CAMPANHAS: Para "${worstCtrCampaign?.name}": Teste novas variantes de anuncios - aumento esperado de CTR: +0.5%.`,
              `CAMPANHAS: ROAS esta em ${metrics.roas.toFixed(2)}x - ${metrics.roas > 3 ? 'Bom desempenho!' : `Meta: 3.0x (+${((3 - metrics.roas) / metrics.roas * 100).toFixed(0)}% de aumento necessario).`}`,
              `SEO: Adicionar dados estruturados pode trazer 15-20% mais trafego organico (aprox. +${Math.round(totalClicks * 0.35 * 0.17)} visitantes/mes).`,
              `SEO: Otimizar meta descricoes para todas as paginas - aumento esperado de CTR em SERPs: +5-10%.`,
              `SEO: Reduzir tempo de carregamento de 2.3s para menos de 2s pode diminuir taxa de rejeicao em 3-5%.`,
            ],
      };

      setAnalysis(result);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getIcon = (type: 'positive' | 'negative' | 'neutral', category?: 'campaign' | 'seo') => {
    if (category === 'seo') {
      return <Search className="h-4 w-4 text-primary" />;
    }
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className={cn('rounded-xl bg-card p-6 shadow-card', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{t('aiAnalytics.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('aiAnalytics.subtitle')}</p>
          </div>
        </div>
        <Button
          onClick={performAnalysis}
          disabled={isAnalyzing || !campaigns || campaigns.length === 0}
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('aiAnalytics.analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('aiAnalytics.analyze')}
            </>
          )}
        </Button>
      </div>

      {!analysis && !isAnalyzing && (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('aiAnalytics.clickToAnalyze')}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t('aiAnalytics.processing')}</span>
          </div>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t('aiAnalytics.summary')}
            </h4>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>

          {/* Improvements */}
          <div>
            <h4 className="font-medium mb-3">{t('aiAnalytics.findings')}</h4>
            <div className="grid gap-3">
              {analysis.improvements.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border',
                    item.type === 'positive' && 'bg-green-500/5 border-green-500/20',
                    item.type === 'negative' && 'bg-red-500/5 border-red-500/20',
                    item.type === 'neutral' && 'bg-muted/50 border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {getIcon(item.type, item.category)}
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        {item.action && (
                          <div className="mt-2 flex items-center gap-2 text-xs bg-background/50 px-2 py-1 rounded">
                            <AlertCircle className="h-3 w-3" />
                            <code className="text-primary">{item.action}</code>
                          </div>
                        )}
                      </div>
                    </div>
                    {item.value && (
                      <span className={cn(
                        'text-sm font-semibold whitespace-nowrap',
                        item.type === 'positive' && 'text-green-600',
                        item.type === 'negative' && 'text-red-600'
                      )}>
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-3">{t('aiAnalytics.recommendations')}</h4>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}