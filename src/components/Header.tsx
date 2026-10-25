import React from 'react';
import { 
  Radio, 
  RefreshCw, 
  Settings, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Pause,
  Play,
  Layers
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'live' | 'history' | 'defaulters' | 'guide';
  setActiveTab: (tab: 'live' | 'history' | 'defaulters' | 'guide') => void;
  isRealApi: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  lastSyncTime: string | null;
  refreshSecondsLeft: number;
  isAutoRefreshActive: boolean;
  toggleAutoRefresh: () => void;
  onRefreshNow: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  defaultersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRealApi,
  isConfigured,
  isLoading,
  lastSyncTime,
  refreshSecondsLeft,
  isAutoRefreshActive,
  toggleAutoRefresh,
  onRefreshNow,
  onOpenSettings,
  onOpenGuide,
  defaultersCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Institution / Project Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  ESP32 RFID Attendance Dashboard
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  RC522 Online
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Institutional IoT Reader &bull; Google Sheets Database &bull; Auto-Sync: 60s
              </p>
            </div>
          </div>

          {/* Sync Controls & API Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Real API Status Badge */}
            {isRealApi && isConfigured ? (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                title="Connected to Google Apps Script Web App API"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Google Sheet</span>
              </button>
            ) : (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                title="Click to configure Google Apps Script Web App URL"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Preview Mode (Configure API)</span>
              </button>
            )}

            {/* Auto refresh countdown */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
              <button
                onClick={toggleAutoRefresh}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  isAutoRefreshActive 
                    ? 'text-blue-600 hover:bg-white hover:shadow-xs' 
                    : 'text-slate-500 hover:bg-white hover:shadow-xs'
                }`}
                title={isAutoRefreshActive ? 'Pause 60s Auto-Refresh' : 'Resume 60s Auto-Refresh'}
                aria-label={isAutoRefreshActive ? 'Pause auto refresh' : 'Resume auto refresh'}
              >
                {isAutoRefreshActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700 min-w-16 text-center">
                {isAutoRefreshActive ? `${refreshSecondsLeft}s` : 'Paused'}
              </span>
              <button
                onClick={onRefreshNow}
                disabled={isLoading}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs transition disabled:opacity-50 cursor-pointer"
                title="Refresh Attendance Data Now"
                aria-label="Refresh now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Guide & API Setup */}
            <button
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
              title="ESP32 RC522 & Google Apps Script Setup Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Setup Guide</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Connect API</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-2.5 border-t border-slate-100 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Live Attendance
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Attendance History
          </button>

          <button
            onClick={() => setActiveTab('defaulters')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'defaulters'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span>&lt; 75% Warning List</span>
            {defaultersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                activeTab === 'defaulters'
                  ? 'bg-white text-red-700'
                  : 'bg-red-100 text-red-800'
              }`}>
                {defaultersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>API Docs &amp; ESP32 Code</span>
          </button>

          {lastSyncTime && (
            <div className="ml-auto text-xs text-slate-500 hidden lg:block whitespace-nowrap">
              Last Synced: <span className="font-mono font-medium text-slate-700">{lastSyncTime}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
