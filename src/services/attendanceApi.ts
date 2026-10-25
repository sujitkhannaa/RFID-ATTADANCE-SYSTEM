import { AttendanceRecord } from '../types/attendance';
import { normalizeStudentData } from '../utils/attendance';

export const STORAGE_KEY_API_URL = 'rfid_apps_script_url';
export const STORAGE_KEY_AUTO_REFRESH = 'rfid_auto_refresh_enabled';
export const STORAGE_KEY_REFRESH_INTERVAL = 'rfid_refresh_interval_sec';

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZo6DNyExR5lFH6LbqNE3iw23h5DQqUDfUzch_HJL3CPEcvubElxb2aKCO4cZ5SJKO/exec';

export interface FetchAttendanceResult {
  success: boolean;
  records: AttendanceRecord[];
  workingDays: number;
  presentTodayCount?: number;
  lowAttendanceCount?: number;
  isRealApi: boolean;
  error?: string;
  timestamp: string;
  totalFromApi?: number;
  usedProxy?: boolean;
}

/**
 * Gets configured API URL from localStorage, environment, or default deployed URL
 */
export function getConfiguredApiUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_API_URL);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch (e) {
    // Ignore storage errors in restrictive environments
  }
  return import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;
}

/**
 * Saves configured API URL to localStorage
 */
export function setConfiguredApiUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY_API_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Validates whether a URL looks like a Google Apps Script Web App URL
 */
export function isValidAppsScriptUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.hostname === 'script.google.com' || parsed.hostname.endsWith('.google.com')) &&
      parsed.pathname.includes('/macros/s/')
    );
  } catch {
    return false;
  }
}

/**
 * Fetches live attendance data from Google Apps Script Web App endpoint.
 * Tries the backend proxy first to avoid browser CORS and 302 redirect blocks,
 * with direct client-side fetch fallback.
 */
export async function fetchAttendanceData(
  customUrl?: string,
  selectedDate?: string
): Promise<FetchAttendanceResult> {
  const apiUrl = (customUrl !== undefined ? customUrl : getConfiguredApiUrl()).trim();
  const timestamp = new Date().toLocaleTimeString();

  if (!apiUrl) {
    return {
      success: false,
      records: [],
      workingDays: 0,
      isRealApi: false,
      error: 'Google Apps Script Web App URL is not configured.',
      timestamp,
    };
  }

  let jsonData: any = null;
  let usedProxy = false;
  let lastError = '';

  // 1. Try Backend Proxy (/api/proxy-attendance) to handle CORS and 302 redirect cleanly
  try {
    const proxyUrl = `/api/proxy-attendance?url=${encodeURIComponent(apiUrl)}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ''}`;
    const proxyRes = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && (data.success !== false || Array.isArray(data.students) || Array.isArray(data))) {
        jsonData = data;
        usedProxy = true;
      } else if (data && data.error) {
        lastError = data.error;
      }
    } else {
      const errText = await proxyRes.text().catch(() => '');
      lastError = `Proxy error HTTP ${proxyRes.status}: ${errText.slice(0, 150)}`;
    }
  } catch (proxyErr: any) {
    lastError = proxyErr?.message || 'Proxy request failed';
  }

  // 2. Direct browser fetch fallback (if backend proxy is not reachable)
  if (!jsonData) {
    try {
      const urlObj = new URL(apiUrl);
      if (selectedDate && !urlObj.searchParams.has('date')) {
        urlObj.searchParams.set('date', selectedDate);
      }
      urlObj.searchParams.set('_t', Date.now().toString());

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script responded with HTTP ${response.status} (${response.statusText})`);
      }

      const textData = await response.text();
      try {
        jsonData = JSON.parse(textData);
      } catch {
        if (textData.includes('Google Drive') || textData.includes('accounts.google.com') || textData.includes('Script error')) {
          throw new Error(
            'Google Apps Script returned an authentication or permission error page. Verify your Web App deployment settings: "Execute as: Me" and "Who has access: Anyone".'
          );
        }
        throw new Error('API returned a non-JSON response. Ensure your Apps Script returns ContentService JSON.');
      }
    } catch (directErr: any) {
      return {
        success: false,
        records: [],
        workingDays: 0,
        isRealApi: true,
        error: directErr?.message || lastError || 'Failed to connect to Google Apps Script. Check network and CORS permissions.',
        timestamp,
      };
    }
  }

  // Check if API returned an error payload: { success: false, error: "..." }
  if (jsonData && jsonData.success === false) {
    return {
      success: false,
      records: [],
      workingDays: 0,
      isRealApi: true,
      error: jsonData.error || jsonData.message || 'Google Apps Script returned success: false',
      timestamp,
    };
  }

  // Normalize student list from real API response { success: true, students: [...] }
  const records = normalizeStudentData(jsonData);
  const rawWorkingDays = jsonData?.workingDays !== undefined ? Number(jsonData.workingDays) : 0;
  const workingDays = isNaN(rawWorkingDays) ? 0 : rawWorkingDays;

  return {
    success: true,
    records,
    workingDays,
    presentTodayCount: typeof jsonData.presentToday === 'number' ? jsonData.presentToday : undefined,
    lowAttendanceCount: typeof jsonData.lowAttendance === 'number' ? jsonData.lowAttendance : undefined,
    isRealApi: true,
    timestamp,
    totalFromApi: records.length,
    usedProxy,
  };
}
