import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ProductData {
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  stock: number;
  price: number;
  status: 'bestseller' | 'good' | 'slow' | 'critical';
}

export interface ProductMetrics {
  totalProducts: number;
  totalRevenue: number;
  totalUnitsSold: number;
  avgPrice: number;
  bestsellers: number;
  slowMoving: number;
}

export interface ProductAnalyticsData {
  products: ProductData[];
  metrics: ProductMetrics;
  topProducts: ProductData[];
  slowProducts: ProductData[];
  lastUpdated: Date | null;
}

export interface RawProductRow {
  [key: string]: string | number;
}

const PRODUCT_API_URL = 'https://script.google.com/macros/s/AKfycby8NDRnPpykItjzdyx4WnewBG6kdlBkXFvJXvTywsg6aOwceg26UYqVAcL8yF9fzMrQtQ/exec';

const PRODUCT_CACHE_KEY = 'kampagnenradar_product_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function normalizeKey(key: string): string {
  return key.toLowerCase().trim()
    .replace(/[^a-z0-9]/g, '');
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

function parseProductData(rows: RawProductRow[]): ProductAnalyticsData {
  const defaultData: ProductAnalyticsData = {
    products: [],
    metrics: {
      totalProducts: 0,
      totalRevenue: 0,
      totalUnitsSold: 0,
      avgPrice: 0,
      bestsellers: 0,
      slowMoving: 0,
    },
    topProducts: [],
    slowProducts: [],
    lastUpdated: new Date(),
  };

  if (!rows || rows.length === 0) return defaultData;

  const products: ProductData[] = rows.map((row) => {
    const name = String(findColumn(row, ['name', 'product', 'nome', 'produkt', 'produktname', 'artikel']) || 'Unknown');
    const category = String(findColumn(row, ['category', 'kategorie', 'categoria', 'cat']) || 'Uncategorized');
    const unitsSold = Number(findColumn(row, ['sold', 'units', 'quantity', 'vendas', 'vendido', 'verkauft', 'menge', 'qty']) || 0);
    const revenue = Number(findColumn(row, ['revenue', 'receita', 'umsatz', 'total', 'sales', 'valor']) || 0);
    const stock = Number(findColumn(row, ['stock', 'estoque', 'bestand', 'inventory', 'lager']) || 0);
    const price = Number(findColumn(row, ['price', 'preco', 'preis', 'valor', 'cost']) || 0);

    // Determine status based on units sold
    let status: ProductData['status'] = 'good';
    if (unitsSold >= 50) {
      status = 'bestseller';
    } else if (unitsSold >= 20) {
      status = 'good';
    } else if (unitsSold >= 5) {
      status = 'slow';
    } else {
      status = 'critical';
    }

    return {
      name,
      category,
      unitsSold,
      revenue,
      stock,
      price,
      status,
    };
  }).filter(p => p.name !== 'Unknown' && p.name !== '');

  // Calculate metrics
  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnitsSold = products.reduce((sum, p) => sum + p.unitsSold, 0);
  const avgPrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
  const bestsellers = products.filter(p => p.status === 'bestseller').length;
  const slowMoving = products.filter(p => p.status === 'slow' || p.status === 'critical').length;

  // Sort for top and slow products
  const sortedByUnits = [...products].sort((a, b) => b.unitsSold - a.unitsSold);
  const topProducts = sortedByUnits.slice(0, 5);
  const slowProducts = sortedByUnits.slice(-5).reverse();

  return {
    products,
    metrics: {
      totalProducts,
      totalRevenue,
      totalUnitsSold,
      avgPrice,
      bestsellers,
      slowMoving,
    },
    topProducts,
    slowProducts,
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
      const response = await fetch(PRODUCT_API_URL);
      if (!response.ok) throw new Error('Fetch failed');
      
      const jsonData = await response.json();
      
      if (!jsonData.success || !jsonData.rows) {
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
