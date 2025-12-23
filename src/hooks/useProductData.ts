import { useState, useEffect, useCallback, useMemo } from 'react';

// Types for product data
export interface ProductData {
  artikelnummer: string;
  name: string;
  unitsSold: number;
  revenue: number;
  stockOnHand: number;
  inOrders: number;
  available: number;
  stockStatus: 'healthy' | 'warning' | 'critical';
  salesChannel?: string;
}

export interface ProductMetrics {
  totalProducts: number;
  totalRevenue: number;
  totalUnitsSold: number;
  avgPrice: number;
  healthyStock: number;
  warningStock: number;
  criticalStock: number;
}

export interface SEORecommendation {
  artikelnummer: string;
  name: string;
  type: 'opportunity' | 'waste' | 'optimize' | 'ads_invest' | 'ads_reduce';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  details: string;
}

export interface ProductAnalyticsData {
  products: ProductData[];
  metrics: ProductMetrics;
  topProducts: ProductData[];
  slowProducts: ProductData[];
  criticalAlerts: ProductData[];
  seoOpportunities: SEORecommendation[];
  seoWaste: SEORecommendation[];
  lastUpdated: Date | null;
}

export interface RawProductRow {
  [key: string]: string | number;
}

const PRODUCT_API_URL = 'https://script.google.com/macros/s/AKfycby8NDRnPpykItjzdyx4WnewBG6kdlBkXFvJXvTywsg6aOwceg26UYqVAcL8yF9fzMrQtQ/exec';

const PRODUCT_CACHE_KEY = 'kampagnenradar_product_data_v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[^a-z0-9äöüß]/g, '');
}

function findColumn(row: RawProductRow, patterns: string[]): string | number | undefined {
  for (const key of Object.keys(row)) {
    const normalized = normalizeKey(key);
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return row[key];
      }
    }
  }
  return undefined;
}

function getStockStatus(available: number): 'healthy' | 'warning' | 'critical' {
  if (available > 10) return 'healthy';
  if (available >= 1) return 'warning';
  return 'critical';
}

function generateSEORecommendations(products: ProductData[]): { opportunities: SEORecommendation[], waste: SEORecommendation[] } {
  const opportunities: SEORecommendation[] = [];
  const waste: SEORecommendation[] = [];
  
  const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
  const avgRevenue = products.reduce((sum, p) => sum + p.revenue, 0) / products.length || 0;
  const avgUnits = products.reduce((sum, p) => sum + p.unitsSold, 0) / products.length || 0;
  
  for (const product of products) {
    // High revenue, healthy stock = invest more in ads
    if (product.revenue > avgRevenue * 1.5 && product.stockStatus === 'healthy') {
      opportunities.push({
        artikelnummer: product.artikelnummer,
        name: product.name,
        type: 'ads_invest',
        priority: 'high',
        suggestion: 'Mehr in Google Ads investieren',
        details: `Hoher Umsatz (${product.revenue.toFixed(2)}€) mit guter Verfügbarkeit (${product.available} Stück). Empfehlung: Budget für Google Shopping erhöhen.`
      });
    }
    
    // Low revenue with high stock = SEO/pricing opportunity
    if (product.revenue < avgRevenue * 0.3 && product.available > 10) {
      opportunities.push({
        artikelnummer: product.artikelnummer,
        name: product.name,
        type: 'opportunity',
        priority: 'medium',
        suggestion: 'SEO-Optimierung & Preisanpassung',
        details: `Niedriger Umsatz (${product.revenue.toFixed(2)}€) trotz Verfügbarkeit (${product.available}). Empfehlung: Produkttitel optimieren, Keywords verbessern, Preis überprüfen.`
      });
    }
    
    // Low sales, high stock = potential bundle candidate
    if (product.unitsSold < avgUnits * 0.2 && product.available > 5) {
      opportunities.push({
        artikelnummer: product.artikelnummer,
        name: product.name,
        type: 'optimize',
        priority: 'low',
        suggestion: 'Bundle oder Cross-Sell Möglichkeit',
        details: `Wenig Verkäufe (${product.unitsSold} Stück). Empfehlung: Als Bundle mit Bestseller kombinieren oder als Cross-Sell anbieten.`
      });
    }
    
    // Critical: out of stock but has sales history
    if (product.stockStatus === 'critical' && product.unitsSold > avgUnits) {
      waste.push({
        artikelnummer: product.artikelnummer,
        name: product.name,
        type: 'waste',
        priority: 'high',
        suggestion: 'Dringend Nachbestellen!',
        details: `Gute Verkaufszahlen (${product.unitsSold} Stück) aber nicht verfügbar. Umsatzverlust durch fehlende Ware.`
      });
    }
    
    // Low performance = reduce ads spend
    if (product.revenue < avgRevenue * 0.1 && product.unitsSold < avgUnits * 0.1) {
      waste.push({
        artikelnummer: product.artikelnummer,
        name: product.name,
        type: 'ads_reduce',
        priority: 'medium',
        suggestion: 'Ads-Budget reduzieren',
        details: `Sehr geringer Umsatz (${product.revenue.toFixed(2)}€) und wenige Verkäufe. Empfehlung: Werbeausgaben streichen oder stark reduzieren.`
      });
    }
  }
  
  return { opportunities, waste };
}

function parseProductData(rows: RawProductRow[]): ProductAnalyticsData {
  const defaultData: ProductAnalyticsData = {
    products: [],
    metrics: {
      totalProducts: 0,
      totalRevenue: 0,
      totalUnitsSold: 0,
      avgPrice: 0,
      healthyStock: 0,
      warningStock: 0,
      criticalStock: 0,
    },
    topProducts: [],
    slowProducts: [],
    criticalAlerts: [],
    seoOpportunities: [],
    seoWaste: [],
    lastUpdated: new Date(),
  };

  if (!rows || rows.length === 0) return defaultData;

  const products: ProductData[] = rows.map((row) => {
    const artikelnummer = String(findColumn(row, ['artikelnummer', 'artikelnr', 'sku', 'artnum']) || '');
    const name = String(findColumn(row, ['bezeichnung', 'name', 'product', 'produkt', 'produktname', 'artikel', 'artikelname']) || 'Unbekannt');
    const unitsSold = Number(findColumn(row, ['menge', 'sold', 'units', 'quantity', 'verkauft', 'qty', 'anzahl']) || 0);
    const revenue = Number(findColumn(row, ['total', 'revenue', 'umsatz', 'sales', 'erlös', 'euro', 'betrag']) || 0);
    const stockOnHand = Number(findColumn(row, ['auflager', 'lager', 'stock', 'bestand', 'lagerbestand']) || 0);
    const inOrders = Number(findColumn(row, ['inaufträgen', 'inauftragen', 'reserviert', 'orders', 'aufträge']) || 0);
    const available = Number(findColumn(row, ['verfügbar', 'verfugbar', 'available', 'frei']) || stockOnHand - inOrders);
    const salesChannel = String(findColumn(row, ['shopfix', 'shop', 'channel', 'kanal', 'plattform']) || '');

    return {
      artikelnummer,
      name,
      unitsSold,
      revenue,
      stockOnHand,
      inOrders,
      available,
      stockStatus: getStockStatus(available),
      salesChannel,
    };
  }).filter(p => p.name !== 'Unbekannt' && p.name !== '' && (p.revenue > 0 || p.unitsSold > 0 || p.stockOnHand > 0));

  // Calculate metrics
  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnitsSold = products.reduce((sum, p) => sum + p.unitsSold, 0);
  const avgPrice = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;
  const healthyStock = products.filter(p => p.stockStatus === 'healthy').length;
  const warningStock = products.filter(p => p.stockStatus === 'warning').length;
  const criticalStock = products.filter(p => p.stockStatus === 'critical').length;

  // Sort products
  const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
  const topProducts = sortedByRevenue.slice(0, 5);
  
  const sortedByUnitsAsc = [...products].filter(p => p.revenue > 0 || p.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold);
  const slowProducts = sortedByUnitsAsc.slice(0, 5);
  
  // Critical alerts: products with sales but no stock
  const criticalAlerts = products.filter(p => p.stockStatus === 'critical' && p.unitsSold > 0);
  
  // Generate SEO recommendations
  const { opportunities, waste } = generateSEORecommendations(products);

  return {
    products,
    metrics: {
      totalProducts,
      totalRevenue,
      totalUnitsSold,
      avgPrice,
      healthyStock,
      warningStock,
      criticalStock,
    },
    topProducts,
    slowProducts,
    criticalAlerts,
    seoOpportunities: opportunities,
    seoWaste: waste,
    lastUpdated: new Date(),
  };
}

function getCachedProductData(): { data: ProductAnalyticsData; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(PRODUCT_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data.lastUpdated) {
        parsed.data.lastUpdated = new Date(parsed.data.lastUpdated);
      }
      return parsed;
    }
  } catch {
    // Invalid cache
  }
  return null;
}

function setCachedProductData(data: ProductAnalyticsData) {
  try {
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full or unavailable
  }
}

export function useProductData() {
  const [rawData, setRawData] = useState<RawProductRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedProductData();
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setRawData(cached.data.products as unknown as RawProductRow[]);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch DASHBOARD_DATA sheet first, fallback to default
      const url = new URL(PRODUCT_API_URL);
      url.searchParams.set('sheet', 'DASHBOARD_DATA');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Fetch failed');
      
      const jsonData = await response.json();
      
      if (!jsonData.success) {
        // If DASHBOARD_DATA doesn't exist, try without sheet parameter
        const fallbackResponse = await fetch(PRODUCT_API_URL);
        if (!fallbackResponse.ok) throw new Error('Fetch failed');
        const fallbackData = await fallbackResponse.json();
        if (!fallbackData.success || !fallbackData.rows) {
          throw new Error('Invalid data format');
        }
        setRawData(fallbackData.rows);
        const fullData = parseProductData(fallbackData.rows);
        setCachedProductData(fullData);
        return;
      }
      
      if (!jsonData.rows) {
        throw new Error('Invalid data format');
      }
      
      setRawData(jsonData.rows);
      const fullData = parseProductData(jsonData.rows);
      setCachedProductData(fullData);
    } catch (fetchError) {
      console.error('Failed to fetch product data:', fetchError);
      setError('Failed to fetch product data');
      
      // Use cached data if available, even if expired
      const cached = getCachedProductData();
      if (cached) {
        setRawData(cached.data.products as unknown as RawProductRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    if (!rawData) return null;
    return parseProductData(rawData);
  }, [rawData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
