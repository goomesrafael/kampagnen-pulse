import { useState, useEffect, useCallback } from 'react';

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
  clicks: number;
  impressions: number;
  conversions: number;
  spend: number;
}

export interface GoogleSheetsData {
  metrics: CampaignMetrics;
  dailyData: DailyData[];
  campaigns: CampaignData[];
  lastUpdated: Date | null;
}

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Z6RHS6gJYm1XXV2O9dUkt_yNV5KYeO3YNNPwm2icGsM/gviz/tq?tqx=out:csv';
const JSON_API_URL = 'https://script.google.com/macros/s/AKfycbxqw6M3CTHNKIbIqPDTVLHy0uKt-Q6KGiMEa0cbyYmMkLDWDIw_mLSoPETrz-GOEN8b/exec';

const CACHE_KEY = 'kampagnenradar_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseCsvToMetrics(rows: string[][]): GoogleSheetsData {
  // Default structure
  const defaultData: GoogleSheetsData = {
    metrics: {
      clicks: 0,
      impressions: 0,
      conversions: 0,
      roas: 0,
      bounceRate: 0,
      ctr: 0,
      spend: 0,
      revenue: 0,
    },
    dailyData: [],
    campaigns: [],
    lastUpdated: new Date(),
  };

  if (rows.length < 2) return defaultData;

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  // Try to find column indices
  const clicksIdx = headers.findIndex(h => h.includes('click'));
  const impressionsIdx = headers.findIndex(h => h.includes('impression'));
  const conversionsIdx = headers.findIndex(h => h.includes('conversion'));
  const roasIdx = headers.findIndex(h => h.includes('roas'));
  const bounceIdx = headers.findIndex(h => h.includes('bounce'));
  const ctrIdx = headers.findIndex(h => h.includes('ctr'));
  const spendIdx = headers.findIndex(h => h.includes('spend') || h.includes('cost'));
  const revenueIdx = headers.findIndex(h => h.includes('revenue'));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('day'));
  const sessionsIdx = headers.findIndex(h => h.includes('session'));
  const campaignIdx = headers.findIndex(h => h.includes('campaign') || h.includes('name'));

  // Aggregate metrics
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalSpend = 0;
  let totalRevenue = 0;
  let bounceRateSum = 0;
  let bounceCount = 0;

  const dailyMap = new Map<string, DailyData>();
  const campaignMap = new Map<string, CampaignData>();

  dataRows.forEach(row => {
    const clicks = clicksIdx >= 0 ? parseNumber(row[clicksIdx]) : 0;
    const impressions = impressionsIdx >= 0 ? parseNumber(row[impressionsIdx]) : 0;
    const conversions = conversionsIdx >= 0 ? parseNumber(row[conversionsIdx]) : 0;
    const spend = spendIdx >= 0 ? parseNumber(row[spendIdx]) : 0;
    const revenue = revenueIdx >= 0 ? parseNumber(row[revenueIdx]) : 0;
    const bounce = bounceIdx >= 0 ? parseNumber(row[bounceIdx]) : 0;
    const date = dateIdx >= 0 ? row[dateIdx] : '';
    const sessions = sessionsIdx >= 0 ? parseNumber(row[sessionsIdx]) : clicks;
    const campaignName = campaignIdx >= 0 ? row[campaignIdx] : '';

    totalClicks += clicks;
    totalImpressions += impressions;
    totalConversions += conversions;
    totalSpend += spend;
    totalRevenue += revenue;
    
    if (bounce > 0) {
      bounceRateSum += bounce;
      bounceCount++;
    }

    // Daily data aggregation
    if (date) {
      const existing = dailyMap.get(date) || { date, sessions: 0, clicks: 0, impressions: 0, conversions: 0 };
      existing.sessions += sessions;
      existing.clicks += clicks;
      existing.impressions += impressions;
      existing.conversions += conversions;
      dailyMap.set(date, existing);
    }

    // Campaign aggregation
    if (campaignName) {
      const existing = campaignMap.get(campaignName) || { name: campaignName, clicks: 0, impressions: 0, conversions: 0, spend: 0 };
      existing.clicks += clicks;
      existing.impressions += impressions;
      existing.conversions += conversions;
      existing.spend += spend;
      campaignMap.set(campaignName, existing);
    }
  });

  const avgBounceRate = bounceCount > 0 ? bounceRateSum / bounceCount : 42.3;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return {
    metrics: {
      clicks: totalClicks,
      impressions: totalImpressions,
      conversions: totalConversions,
      roas: roas || parseNumber(dataRows[0]?.[roasIdx >= 0 ? roasIdx : 0] || '0'),
      bounceRate: avgBounceRate,
      ctr,
      spend: totalSpend,
      revenue: totalRevenue,
    },
    dailyData: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    campaigns: Array.from(campaignMap.values()),
    lastUpdated: new Date(),
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

export function useGoogleSheetsData() {
  const [data, setData] = useState<GoogleSheetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Try CSV endpoint first
      const response = await fetch(SHEETS_CSV_URL);
      if (!response.ok) throw new Error('CSV fetch failed');
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      const parsedData = parseCsvToMetrics(rows);
      
      setData(parsedData);
      setCachedData(parsedData);
    } catch (csvError) {
      // Fallback to JSON API
      try {
        const response = await fetch(JSON_API_URL);
        if (!response.ok) throw new Error('JSON fetch failed');
        
        const jsonData = await response.json();
        
        // Parse JSON response - adapt based on actual API structure
        const parsedData: GoogleSheetsData = {
          metrics: {
            clicks: jsonData.clicks || 0,
            impressions: jsonData.impressions || 0,
            conversions: jsonData.conversions || 0,
            roas: jsonData.roas || 0,
            bounceRate: jsonData.bounceRate || 0,
            ctr: jsonData.ctr || 0,
            spend: jsonData.spend || 0,
            revenue: jsonData.revenue || 0,
          },
          dailyData: jsonData.dailyData || [],
          campaigns: jsonData.campaigns || [],
          lastUpdated: new Date(),
        };
        
        setData(parsedData);
        setCachedData(parsedData);
      } catch (jsonError) {
        setError('Failed to fetch data from both sources');
        
        // Use cached data if available, even if expired
        const cached = getCachedData();
        if (cached) {
          setData(cached.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
