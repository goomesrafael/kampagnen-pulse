import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

// Types for product data - now using base product aggregation
export interface ProductData {
  artikelBasis: string;        // Base article ID (before first "-")
  produktBasis: string;        // Base product name (before first "-" or "|")
  unitsSold: number;
  revenue: number;
  stockOnHand: number;
  inOrders: number;
  available: number;
  stockStatus: 'healthy' | 'warning' | 'critical';
  salesChannel?: string;
  variationsCount: number;     // Number of variations aggregated
  avgPrice: number;
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
  artikelBasis: string;
  produktBasis: string;
  type: 'opportunity' | 'waste' | 'optimize' | 'ads_invest' | 'ads_reduce';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  details: string;
}

export interface ROASData {
  totalAdSpend: number;
  totalRevenue: number;
  overallROAS: number;
  profitableProducts: ProductData[];
  unprofitableProducts: ProductData[];
  topROASProducts: ProductData[];
  suggestions: ROASSuggestion[];
  alerts: ROASAlert[];
  improvements: ROASImprovement[];
}

export interface ROASSuggestion {
  type: 'increase_budget' | 'decrease_budget' | 'pause_ads' | 'optimize_listing' | 'bundle' | 'restock';
  priority: 'high' | 'medium' | 'low';
  product: string;
  message: string;
  impact: string;
}

export interface ROASAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  product?: string;
}

export interface ROASImprovement {
  product: string;
  metric: string;
  previousValue: number;
  currentValue: number;
  changePercent: number;
  isPositive: boolean;
}

export interface ShopAnalytics {
  shopName: string;
  totalRevenue: number;
  totalUnitsSold: number;
  productCount: number;
  avgRevenue: number;
  percentageOfTotal: number;
}

export interface ProductAnalyticsData {
  products: ProductData[];
  metrics: ProductMetrics;
  topProducts: ProductData[];
  slowProducts: ProductData[];
  criticalAlerts: ProductData[];
  seoOpportunities: SEORecommendation[];
  seoWaste: SEORecommendation[];
  roasData: ROASData;
  shopAnalytics: ShopAnalytics[];
  lastUpdated: Date | null;
}

export interface RawProductRow {
  [key: string]: string | number;
}

const PRODUCT_API_URL = 'https://script.google.com/macros/s/AKfycbyPQWeRYtnpf9PsmxPw962L47a8__VBDIv61UsjkNzr1qExwmPa_9M2AgFrr_cr5xn9RQ/exec';

const PRODUCT_CACHE_KEY = 'kampagnenradar_product_data_v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[^a-z0-9äöüß_]/g, '');
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

// Extract base article ID (everything before first "-")
function extractArtikelBasis(artikelnummer: string): string {
  if (!artikelnummer) return '';
  const dashIndex = artikelnummer.indexOf('-');
  return dashIndex > 0 ? artikelnummer.substring(0, dashIndex).trim() : artikelnummer.trim();
}

// Extract base product name (everything before first "-" or "|")
function extractProduktBasis(name: string): string {
  if (!name) return '';
  let baseName = name;
  const dashIndex = baseName.indexOf('-');
  const pipeIndex = baseName.indexOf('|');
  
  if (dashIndex > 0 && pipeIndex > 0) {
    baseName = baseName.substring(0, Math.min(dashIndex, pipeIndex));
  } else if (dashIndex > 0) {
    baseName = baseName.substring(0, dashIndex);
  } else if (pipeIndex > 0) {
    baseName = baseName.substring(0, pipeIndex);
  }
  
  return baseName.trim();
}

function generateSEORecommendations(products: ProductData[]): { opportunities: SEORecommendation[], waste: SEORecommendation[] } {
  const opportunities: SEORecommendation[] = [];
  const waste: SEORecommendation[] = [];
  
  const avgRevenue = products.reduce((sum, p) => sum + p.revenue, 0) / products.length || 0;
  const avgUnits = products.reduce((sum, p) => sum + p.unitsSold, 0) / products.length || 0;
  
  for (const product of products) {
    // High revenue, healthy stock = invest more in ads
    if (product.revenue > avgRevenue * 1.5 && product.stockStatus === 'healthy') {
      opportunities.push({
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        type: 'ads_invest',
        priority: 'high',
        suggestion: 'Mehr in Google Ads investieren',
        details: `Hoher Umsatz (${product.revenue.toFixed(2)}€) mit guter Verfügbarkeit (${product.available} Stück). Empfehlung: Budget für Google Shopping erhöhen.`
      });
    }
    
    // Low revenue with high stock = SEO/pricing opportunity
    if (product.revenue < avgRevenue * 0.3 && product.available > 10) {
      opportunities.push({
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        type: 'opportunity',
        priority: 'medium',
        suggestion: 'SEO-Optimierung & Preisanpassung',
        details: `Niedriger Umsatz (${product.revenue.toFixed(2)}€) trotz Verfügbarkeit (${product.available}). Empfehlung: Produkttitel optimieren, Keywords verbessern, Preis überprüfen.`
      });
    }
    
    // Low sales, high stock = potential bundle candidate
    if (product.unitsSold < avgUnits * 0.2 && product.available > 5) {
      opportunities.push({
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        type: 'optimize',
        priority: 'low',
        suggestion: 'Bundle oder Cross-Sell Möglichkeit',
        details: `Wenig Verkäufe (${product.unitsSold} Stück). Empfehlung: Als Bundle mit Bestseller kombinieren oder als Cross-Sell anbieten.`
      });
    }
    
    // Critical: out of stock but has sales history
    if (product.stockStatus === 'critical' && product.unitsSold > avgUnits) {
      waste.push({
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        type: 'waste',
        priority: 'high',
        suggestion: 'Dringend Nachbestellen!',
        details: `Gute Verkaufszahlen (${product.unitsSold} Stück) aber nicht verfügbar. Umsatzverlust durch fehlende Ware.`
      });
    }
    
    // Low performance = reduce ads spend
    if (product.revenue < avgRevenue * 0.1 && product.unitsSold < avgUnits * 0.1) {
      waste.push({
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        type: 'ads_reduce',
        priority: 'medium',
        suggestion: 'Ads-Budget reduzieren',
        details: `Sehr geringer Umsatz (${product.revenue.toFixed(2)}€) und wenige Verkäufe. Empfehlung: Werbeausgaben streichen oder stark reduzieren.`
      });
    }
  }
  
  return { opportunities, waste };
}

function generateROASData(products: ProductData[]): ROASData {
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  // Estimated ad spend (assuming ~20% of revenue is ads for e-commerce)
  const estimatedAdSpend = totalRevenue * 0.15;
  const overallROAS = estimatedAdSpend > 0 ? totalRevenue / estimatedAdSpend : 0;
  
  const avgRevenue = totalRevenue / products.length || 0;
  const avgUnits = products.reduce((sum, p) => sum + p.unitsSold, 0) / products.length || 0;
  
  // Products performing above average
  const profitableProducts = products
    .filter(p => p.revenue > avgRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Products performing below average
  const unprofitableProducts = products
    .filter(p => p.revenue < avgRevenue * 0.3 && p.revenue > 0)
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 10);
  
  // Top ROAS products (high revenue, good stock)
  const topROASProducts = products
    .filter(p => p.revenue > avgRevenue && p.stockStatus !== 'critical')
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // Generate suggestions
  const suggestions: ROASSuggestion[] = [];
  
  // Increase budget suggestions
  for (const p of profitableProducts.slice(0, 3)) {
    if (p.stockStatus === 'healthy') {
      suggestions.push({
        type: 'increase_budget',
        priority: 'high',
        product: `${p.artikelBasis} - ${p.produktBasis}`,
        message: `Budget für "${p.produktBasis}" erhöhen - hohe Nachfrage und guter Bestand`,
        impact: `Potenzial: +${Math.round(p.revenue * 0.2).toLocaleString('de-DE')}€ zusätzlicher Umsatz`
      });
    }
  }
  
  // Decrease budget suggestions
  for (const p of unprofitableProducts.slice(0, 3)) {
    suggestions.push({
      type: 'decrease_budget',
      priority: 'medium',
      product: `${p.artikelBasis} - ${p.produktBasis}`,
      message: `Budget für "${p.produktBasis}" reduzieren - geringer ROI`,
      impact: `Einsparung: ~${Math.round(p.revenue * 0.15).toLocaleString('de-DE')}€ Werbekosten`
    });
  }
  
  // Restock suggestions
  const needsRestock = products.filter(p => p.stockStatus === 'critical' && p.unitsSold > avgUnits);
  for (const p of needsRestock.slice(0, 3)) {
    suggestions.push({
      type: 'restock',
      priority: 'high',
      product: `${p.artikelBasis} - ${p.produktBasis}`,
      message: `"${p.produktBasis}" dringend nachbestellen - Verkäufe bei 0 Bestand`,
      impact: `Umsatzverlust: ~${Math.round(p.revenue * 0.5).toLocaleString('de-DE')}€/Monat`
    });
  }
  
  // Bundle suggestions
  const lowSellers = products.filter(p => p.unitsSold < avgUnits * 0.2 && p.available > 10);
  for (const p of lowSellers.slice(0, 2)) {
    suggestions.push({
      type: 'bundle',
      priority: 'low',
      product: `${p.artikelBasis} - ${p.produktBasis}`,
      message: `"${p.produktBasis}" als Bundle anbieten - hoher Bestand, wenig Verkäufe`,
      impact: `Bestandsreduktion und Cross-Selling Potenzial`
    });
  }
  
  // Generate alerts
  const alerts: ROASAlert[] = [];
  
  if (overallROAS < 3) {
    alerts.push({
      type: 'warning',
      message: `Gesamt-ROAS liegt bei ${overallROAS.toFixed(1)}x - unter dem Zielwert von 3x`
    });
  } else if (overallROAS >= 4) {
    alerts.push({
      type: 'info',
      message: `Ausgezeichneter ROAS von ${overallROAS.toFixed(1)}x - Ads-Investitionen rentabel`
    });
  }
  
  const criticalCount = products.filter(p => p.stockStatus === 'critical').length;
  if (criticalCount > 0) {
    alerts.push({
      type: 'critical',
      message: `${criticalCount} Produkte mit kritischem Bestand - Umsatzverluste möglich`
    });
  }
  
  if (unprofitableProducts.length > products.length * 0.3) {
    alerts.push({
      type: 'warning',
      message: `${unprofitableProducts.length} Produkte mit unterdurchschnittlicher Performance`
    });
  }
  
  // Generate improvements (mock data for now - could be compared with previous period)
  const improvements: ROASImprovement[] = [];
  
  for (const p of profitableProducts.slice(0, 3)) {
    const mockChange = Math.random() * 30 - 10; // -10% to +20%
    improvements.push({
      product: `${p.artikelBasis} - ${p.produktBasis}`,
      metric: 'Umsatz',
      previousValue: p.revenue / (1 + mockChange / 100),
      currentValue: p.revenue,
      changePercent: mockChange,
      isPositive: mockChange > 0
    });
  }
  
  return {
    totalAdSpend: estimatedAdSpend,
    totalRevenue,
    overallROAS,
    profitableProducts,
    unprofitableProducts,
    topROASProducts,
    suggestions,
    alerts,
    improvements
  };
}

function generateShopAnalytics(rows: RawProductRow[], dateRange?: DateRange): ShopAnalytics[] {
  // Filter by date range if provided
  let filteredRows = rows;
  if (dateRange?.from) {
    filteredRows = rows.filter(row => {
      const dateStr = String(row['Auftragsdatum'] || row['Date'] || row['Datum'] || '');
      if (!dateStr) return true;
      try {
        const rowDate = parseISO(dateStr);
        const from = dateRange.from!;
        const to = dateRange.to || new Date();
        return isWithinInterval(rowDate, { start: from, end: to });
      } catch {
        return true;
      }
    });
  }

  // Aggregate by shop
  const shopMap = new Map<string, { revenue: number; units: number; products: Set<string> }>();
  
  for (const row of filteredRows) {
    const shopRaw = String(findColumn(row, ['shopfix', 'shop', 'channel', 'kanal', 'plattform']) || '').trim();
    const shopName = shopRaw === '' ? 'eBay' : shopRaw;
    const revenue = Number(findColumn(row, ['total', 'revenue', 'umsatz', 'sales', 'erlös', 'euro', 'betrag']) || 0);
    const units = Number(findColumn(row, ['menge', 'sold', 'units', 'quantity', 'verkauft', 'qty', 'anzahl']) || 0);
    const artikelBasis = String(row['Artikel_Basis'] || row['ArtikelBasis'] || '').trim() || 
      extractArtikelBasis(String(findColumn(row, ['artikelnummer', 'artikelnr', 'sku', 'artnum']) || ''));
    
    if (!shopMap.has(shopName)) {
      shopMap.set(shopName, { revenue: 0, units: 0, products: new Set() });
    }
    
    const shop = shopMap.get(shopName)!;
    shop.revenue += revenue;
    shop.units += units;
    if (artikelBasis) shop.products.add(artikelBasis);
  }
  
  const totalRevenue = Array.from(shopMap.values()).reduce((sum, s) => sum + s.revenue, 0);
  
  const analytics: ShopAnalytics[] = Array.from(shopMap.entries())
    .map(([shopName, data]) => ({
      shopName,
      totalRevenue: data.revenue,
      totalUnitsSold: data.units,
      productCount: data.products.size,
      avgRevenue: data.products.size > 0 ? data.revenue / data.products.size : 0,
      percentageOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  return analytics;
}

function parseProductData(rows: RawProductRow[], dateRange?: DateRange): ProductAnalyticsData {
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
    roasData: {
      totalAdSpend: 0,
      totalRevenue: 0,
      overallROAS: 0,
      profitableProducts: [],
      unprofitableProducts: [],
      topROASProducts: [],
      suggestions: [],
      alerts: [],
      improvements: []
    },
    shopAnalytics: [],
    lastUpdated: new Date(),
  };

  if (!rows || rows.length === 0) return defaultData;

  // First, filter rows by date range if provided
  let filteredRows = rows;
  if (dateRange?.from) {
    filteredRows = rows.filter(row => {
      const dateStr = String(row['Auftragsdatum'] || row['Date'] || row['Datum'] || '');
      if (!dateStr) return true; // Include rows without date
      
      try {
        const rowDate = parseISO(dateStr);
        const from = dateRange.from!;
        const to = dateRange.to || new Date();
        return isWithinInterval(rowDate, { start: from, end: to });
      } catch {
        return true; // Include if date parsing fails
      }
    });
  }

  // Collect all raw product data
  const rawProducts = filteredRows.map((row) => {
    // Try to get Artikel_Basis and Produkt_Basis directly first
    const artikelBasisDirect = String(row['Artikel_Basis'] || row['ArtikelBasis'] || '').trim();
    const produktBasisDirect = String(row['Produkt_Basis'] || row['ProduktBasis'] || '').trim();
    
    // Fall back to extracting from original columns
    const artikelnummer = String(findColumn(row, ['artikelnummer', 'artikelnr', 'sku', 'artnum']) || '').trim();
    const name = String(row['Bezeichnung'] ?? findColumn(row, ['bezeichnung', 'produktname', 'artikelname', 'name', 'product']) ?? '').trim();
    
    // Use direct columns if available, otherwise extract
    const artikelBasis = artikelBasisDirect || extractArtikelBasis(artikelnummer);
    const produktBasis = produktBasisDirect || extractProduktBasis(name) || name;
    
    const unitsSold = Number(findColumn(row, ['menge', 'sold', 'units', 'quantity', 'verkauft', 'qty', 'anzahl']) || 0);
    const revenue = Number(findColumn(row, ['total', 'revenue', 'umsatz', 'sales', 'erlös', 'euro', 'betrag']) || 0);
    const stockOnHand = Number(findColumn(row, ['auflager', 'lager', 'stock', 'bestand', 'lagerbestand']) || 0);
    const inOrders = Number(findColumn(row, ['inaufträgen', 'inauftragen', 'reserviert', 'orders', 'aufträge']) || 0);
    const available = Number(findColumn(row, ['verfügbar', 'verfugbar', 'available', 'frei']) || stockOnHand - inOrders);
    const salesChannel = String(findColumn(row, ['shopfix', 'shop', 'channel', 'kanal', 'plattform']) || '');

    return {
      artikelBasis,
      produktBasis,
      artikelnummer,
      name,
      unitsSold,
      revenue,
      stockOnHand,
      inOrders,
      available,
      salesChannel,
    };
  }).filter(p => p.artikelBasis !== '' && p.produktBasis !== '');

  // Aggregate products by Artikel_Basis - combine all variations
  const aggregatedMap = new Map<string, {
    artikelBasis: string;
    produktBasis: string;
    unitsSold: number;
    revenue: number;
    stockOnHand: number;
    inOrders: number;
    available: number;
    salesChannel: string;
    variationsCount: number;
  }>();

  for (const product of rawProducts) {
    const key = product.artikelBasis;
    if (aggregatedMap.has(key)) {
      const existing = aggregatedMap.get(key)!;
      existing.unitsSold += product.unitsSold;
      existing.revenue += product.revenue;
      // For stock, sum all variations
      existing.stockOnHand += product.stockOnHand;
      existing.inOrders += product.inOrders;
      existing.available += product.available;
      existing.variationsCount += 1;
    } else {
      aggregatedMap.set(key, { 
        artikelBasis: product.artikelBasis,
        produktBasis: product.produktBasis,
        unitsSold: product.unitsSold,
        revenue: product.revenue,
        stockOnHand: product.stockOnHand,
        inOrders: product.inOrders,
        available: product.available,
        salesChannel: product.salesChannel,
        variationsCount: 1
      });
    }
  }

  // Convert aggregated map to ProductData array
  const products: ProductData[] = Array.from(aggregatedMap.values())
    .filter(p => p.revenue > 0 || p.unitsSold > 0 || p.stockOnHand > 0)
    .map(p => ({
      artikelBasis: p.artikelBasis,
      produktBasis: p.produktBasis,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
      stockOnHand: p.stockOnHand,
      inOrders: p.inOrders,
      available: p.available,
      stockStatus: getStockStatus(p.available),
      salesChannel: p.salesChannel,
      variationsCount: p.variationsCount,
      avgPrice: p.unitsSold > 0 ? p.revenue / p.unitsSold : 0
    }));

  // Calculate metrics
  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnitsSold = products.reduce((sum, p) => sum + p.unitsSold, 0);
  const avgPrice = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;
  const healthyStock = products.filter(p => p.stockStatus === 'healthy').length;
  const warningStock = products.filter(p => p.stockStatus === 'warning').length;
  const criticalStock = products.filter(p => p.stockStatus === 'critical').length;

  // Sort products by revenue for top sellers
  const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
  const topProducts = sortedByRevenue.slice(0, 5);
  
  // Sort by units sold ascending for slow sellers (only products with some activity)
  const sortedByUnitsAsc = [...products].filter(p => p.revenue > 0 || p.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold);
  const slowProducts = sortedByUnitsAsc.slice(0, 5);
  
  // Critical alerts: products with sales but no stock
  const criticalAlerts = products.filter(p => p.stockStatus === 'critical' && p.unitsSold > 0);
  
  // Generate SEO recommendations
  const { opportunities, waste } = generateSEORecommendations(products);
  
  // Generate ROAS data
  const roasData = generateROASData(products);
  
  // Generate shop analytics from raw data
  const shopAnalytics = generateShopAnalytics(rows, dateRange);

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
    roasData,
    shopAnalytics,
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

export function useProductData(dateRange?: DateRange) {
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
        return;
      }
      
      if (!jsonData.rows) {
        throw new Error('Invalid data format');
      }
      
      setRawData(jsonData.rows);
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
    const parsed = parseProductData(rawData, dateRange);
    setCachedProductData(parsed);
    return parsed;
  }, [rawData, dateRange]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
