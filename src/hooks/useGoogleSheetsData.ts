import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';

export interface CampaignMetrics {
  clicks: number;
  impressions: number;
  conversions: number;
  roas: number;
  bounceRate: number;
  ctr: number;
  spend: number;
  revenue: number;
}

export interface DailyData {
  date: string;
  sessions: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export interface CampaignData {
  name: string;
  campaignId: number;
  status: string;
  clicks: number;
  impressions: number;
  conversions: number;
  spend: number;
  ctr: number;
  avgCpc: number;
  costPerConversion: number;
  conversionRate: number;
  // Previous period comparisons (calculated as % change)
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  avgCpcChange: number;
  costChange: number;
  conversionsChange: number;
  costPerConversionChange: number;
  conversionRateChange: number;
}

export interface GoogleSheetsData {
  metrics: CampaignMetrics;
  dailyData: DailyData[];
  campaigns: CampaignData[];
  lastUpdated: Date | null;
  rawRows: RawDataRow[];
  dateRange: { min: Date; max: Date } | null;
}

export interface RawDataRow {
  Date: string;
  'Campaign ID': number;
  'Campaign Name': string;
  Status: string;
  Clicks: number;
  Impressions: number;
  'Cost (€)': number;
  Conversions: number;
}

const JSON_API_URL = 'https://script.google.com/macros/s/AKfycbxqw6M3CTHNKIbIqPDTVLHy0uKt-Q6KGiMEa0cbyYmMkLDWDIw_mLSoPETrz-GOEN8b/exec';

const CACHE_KEY = 'kampagnenradar_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function parseJsonToMetrics(rows: RawDataRow[], dateFilter?: DateRange): GoogleSheetsData {
  const defaultData: GoogleSheetsData = {
    metrics: {
      clicks: 0,
      impressions: 0,
      conversions: 0,
      roas: 0,
      bounceRate: 42.3,
      ctr: 0,
      spend: 0,
      revenue: 0,
    },
    dailyData: [],
    campaigns: [],
    lastUpdated: new Date(),
    rawRows: [],
    dateRange: null,
  };

  if (!rows || rows.length === 0) return defaultData;

  // Filter rows by date if dateFilter is provided
  let filteredRows = rows;
  if (dateFilter?.from) {
    filteredRows = rows.filter(row => {
      const rowDate = new Date(row.Date);
      if (dateFilter.from && rowDate < dateFilter.from) return false;
      if (dateFilter.to && rowDate > dateFilter.to) return false;
      return true;
    });
  }

  if (filteredRows.length === 0) return defaultData;

  // Sort rows by date (newest first)
  const sortedRows = [...filteredRows].sort((a, b) => 
    new Date(b.Date).getTime() - new Date(a.Date).getTime()
  );

  // Calculate date range from all data
  const allDates = rows.map(r => new Date(r.Date));
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Calculate TOTAL metrics from ALL filtered rows first
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalSpend = 0;

  sortedRows.forEach(row => {
    totalClicks += row.Clicks || 0;
    totalImpressions += row.Impressions || 0;
    totalConversions += row.Conversions || 0;
    totalSpend += row['Cost (€)'] || 0;
  });

  // For comparison purposes, split into current/previous periods (for percentage changes only)
  const midpoint = Math.floor(sortedRows.length / 2);
  const currentPeriodRows = sortedRows.slice(0, midpoint);
  const previousPeriodRows = sortedRows.slice(midpoint);

  // Aggregate by campaign - use ALL data for totals, split data for comparison
  const campaignMapAll = new Map<string, {
    total: { clicks: number; impressions: number; conversions: number; spend: number };
    current: { clicks: number; impressions: number; conversions: number; spend: number };
    previous: { clicks: number; impressions: number; conversions: number; spend: number };
    campaignId: number;
    status: string;
  }>();

  // Process ALL rows for total metrics per campaign
  sortedRows.forEach(row => {
    const name = row['Campaign Name'];
    const existing = campaignMapAll.get(name) || {
      total: { clicks: 0, impressions: 0, conversions: 0, spend: 0 },
      current: { clicks: 0, impressions: 0, conversions: 0, spend: 0 },
      previous: { clicks: 0, impressions: 0, conversions: 0, spend: 0 },
      campaignId: row['Campaign ID'],
      status: row.Status,
    };
    existing.total.clicks += row.Clicks || 0;
    existing.total.impressions += row.Impressions || 0;
    existing.total.conversions += row.Conversions || 0;
    existing.total.spend += row['Cost (€)'] || 0;
    campaignMapAll.set(name, existing);
  });

  // Process current period for comparison
  currentPeriodRows.forEach(row => {
    const name = row['Campaign Name'];
    const existing = campaignMapAll.get(name);
    if (existing) {
      existing.current.clicks += row.Clicks || 0;
      existing.current.impressions += row.Impressions || 0;
      existing.current.conversions += row.Conversions || 0;
      existing.current.spend += row['Cost (€)'] || 0;
    }
  });

  // Process previous period for comparison
  previousPeriodRows.forEach(row => {
    const name = row['Campaign Name'];
    const existing = campaignMapAll.get(name);
    if (existing) {
      existing.previous.clicks += row.Clicks || 0;
      existing.previous.impressions += row.Impressions || 0;
      existing.previous.conversions += row.Conversions || 0;
      existing.previous.spend += row['Cost (€)'] || 0;
    }
  });

  // Calculate campaign metrics using TOTAL data
  const campaigns: CampaignData[] = [];
  
  campaignMapAll.forEach((data, name) => {
    const { total, current, previous, campaignId, status } = data;
    
    // Use TOTAL metrics for the displayed values
    const ctr = total.impressions > 0 ? (total.clicks / total.impressions) * 100 : 0;
    const avgCpc = total.clicks > 0 ? total.spend / total.clicks : 0;
    const costPerConversion = total.conversions > 0 ? total.spend / total.conversions : 0;
    const conversionRate = total.clicks > 0 ? (total.conversions / total.clicks) * 100 : 0;

    // Previous metrics for comparison
    const prevCtr = previous.impressions > 0 ? (previous.clicks / previous.impressions) * 100 : 0;
    const prevAvgCpc = previous.clicks > 0 ? previous.spend / previous.clicks : 0;
    const prevCostPerConversion = previous.conversions > 0 ? previous.spend / previous.conversions : 0;
    const prevConversionRate = previous.clicks > 0 ? (previous.conversions / previous.clicks) * 100 : 0;

    // Current period metrics for comparison
    const currCtr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0;
    const currAvgCpc = current.clicks > 0 ? current.spend / current.clicks : 0;
    const currCostPerConversion = current.conversions > 0 ? current.spend / current.conversions : 0;
    const currConversionRate = current.clicks > 0 ? (current.conversions / current.clicks) * 100 : 0;

    // Calculate percentage changes (current period vs previous period)
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    campaigns.push({
      name,
      campaignId,
      status,
      clicks: total.clicks,  // Use TOTAL
      impressions: total.impressions,  // Use TOTAL
      conversions: total.conversions,  // Use TOTAL
      spend: total.spend,  // Use TOTAL
      ctr,
      avgCpc,
      costPerConversion,
      conversionRate,
      clicksChange: calcChange(current.clicks, previous.clicks),
      impressionsChange: calcChange(current.impressions, previous.impressions),
      ctrChange: calcChange(currCtr, prevCtr),
      avgCpcChange: calcChange(currAvgCpc, prevAvgCpc),
      costChange: calcChange(current.spend, previous.spend),
      conversionsChange: calcChange(current.conversions, previous.conversions),
      costPerConversionChange: calcChange(currCostPerConversion, prevCostPerConversion),
      conversionRateChange: calcChange(currConversionRate, prevConversionRate),
    });
  });

  // Sort campaigns by spend (highest first)
  campaigns.sort((a, b) => b.spend - a.spend);

  const totalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Create daily data for charts
  const dailyMap = new Map<string, DailyData>();
  sortedRows.forEach(row => {
    const dateStr = new Date(row.Date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    const existing = dailyMap.get(dateStr) || { date: dateStr, sessions: 0, clicks: 0, impressions: 0, conversions: 0 };
    existing.clicks += row.Clicks || 0;
    existing.impressions += row.Impressions || 0;
    existing.conversions += row.Conversions || 0;
    existing.sessions += row.Clicks || 0;
    dailyMap.set(dateStr, existing);
  });

  const dailyData = Array.from(dailyMap.values()).reverse();

  return {
    metrics: {
      clicks: totalClicks,
      impressions: totalImpressions,
      conversions: totalConversions,
      roas: totalSpend > 0 ? (totalConversions * 50) / totalSpend : 0,
      bounceRate: 42.3,
      ctr: totalCtr,
      spend: totalSpend,
      revenue: totalConversions * 50,
    },
    dailyData,
    campaigns,
    lastUpdated: new Date(),
    rawRows: rows,
    dateRange: { min: minDate, max: maxDate },
  };
}

function getCachedData(): { data: GoogleSheetsData; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
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

function setCachedData(data: GoogleSheetsData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full or unavailable
  }
}

export function useGoogleSheetsData(dateFilter?: DateRange) {
  const [rawData, setRawData] = useState<RawDataRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setRawData(cached.data.rawRows);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(JSON_API_URL);
      if (!response.ok) throw new Error('Fetch failed');
      
      const jsonData = await response.json();
      
      if (!jsonData.success || !jsonData.rows) {
        throw new Error('Invalid data format');
      }
      
      setRawData(jsonData.rows);
      // Cache the full data without filter
      const fullData = parseJsonToMetrics(jsonData.rows);
      setCachedData(fullData);
    } catch (fetchError) {
      console.error('Failed to fetch data:', fetchError);
      setError('Failed to fetch campaign data');
      
      // Use cached data if available, even if expired
      const cached = getCachedData();
      if (cached) {
        setRawData(cached.data.rawRows);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute filtered data based on date range
  const data = useMemo(() => {
    if (!rawData) return null;
    return parseJsonToMetrics(rawData, dateFilter);
  }, [rawData, dateFilter]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
