/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendanceHistoryView } from './components/AttendanceHistoryView';
import { StudentDetailsModal } from './components/StudentDetailsModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ApiGuideModal } from './components/ApiGuideModal';
import { AttendanceRecord, AttendanceMetrics } from './types/attendance';
import { 
  computeAttendanceMetrics, 
  filterAttendanceRecords, 
  ATTENDANCE_THRESHOLD 
} from './utils/attendance';
import { 
  getConfiguredApiUrl, 
  setConfiguredApiUrl, 
  fetchAttendanceData,
  STORAGE_KEY_AUTO_REFRESH,
  STORAGE_KEY_REFRESH_INTERVAL
} from './services/attendanceApi';
import { Radio, ShieldAlert, Sparkles, Database, Link2, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'defaulters' | 'guide'>('live');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecord | null>(null);
  const [historyTargetStudent, setHistoryTargetStudent] = useState<AttendanceRecord | null>(null);

  // API & Sync Configuration
  const [apiUrl, setApiUrl] = useState<string>(() => getConfiguredApiUrl());
  const [urlInput, setUrlInput] = useState<string>(() => getConfiguredApiUrl());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTO_REFRESH);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REFRESH_INTERVAL);
      return stored ? Math.max(5, Number(stored)) : 60;
    } catch {
      return 60;
    }
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(60);

  // Live Attendance State (No mock data fallback)
  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [isRealApi, setIsRealApi] = useState<boolean>(Boolean(apiUrl));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proxyUsed, setProxyUsed] = useState<boolean>(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [belowThresholdOnly, setBelowThresholdOnly] = useState<boolean>(false);

  // Fetch Live Attendance from Google Apps Script Web App
  const loadAttendance = useCallback(async (isManual = false) => {
    const currentUrl = getConfiguredApiUrl();
    
    if (!currentUrl) {
      setIsRealApi(false);
      setStudents([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchAttendanceData(currentUrl);
    setIsLoading(false);
    setLastSyncTime(result.timestamp);
    setIsRealApi(true);
    setProxyUsed(Boolean(result.usedProxy));

    if (result.success) {
      setStudents(result.records);
      setWorkingDays(result.workingDays || 0);
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || 'Failed to fetch attendance data from Google Apps Script.');
      // Requirement 10: "Do not use mock data as a fallback"
      setStudents([]);
      setWorkingDays(0);
    }
  }, []);

  // Initial Load on mount or when API URL changes
  useEffect(() => {
    if (apiUrl) {
      loadAttendance();
    }
  }, [apiUrl, loadAttendance]);

  // Auto-refresh Timer (Default 10s)
  useEffect(() => {
    if (!autoRefreshEnabled || !apiUrl) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          loadAttendance(false);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshInterval, apiUrl, loadAttendance]);

  // Handle Save Settings from Modal or Inline Input
  const handleSaveConfig = (newUrl: string, newAutoRefresh: boolean, newInterval: number) => {
    const trimmed = newUrl.trim();
    setConfiguredApiUrl(trimmed);
    setApiUrl(trimmed);
    setUrlInput(trimmed);
    setAutoRefreshEnabled(newAutoRefresh);
    setRefreshInterval(newInterval);
    setSecondsLeft(newInterval);

    try {
      localStorage.setItem(STORAGE_KEY_AUTO_REFRESH, String(newAutoRefresh));
      localStorage.setItem(STORAGE_KEY_REFRESH_INTERVAL, String(newInterval));
    } catch {
      // ignore
    }

    if (trimmed) {
      setIsRealApi(true);
      setIsLoading(true);
      fetchAttendanceData(trimmed).then((res) => {
        setIsLoading(false);
        setLastSyncTime(res.timestamp);
        setProxyUsed(Boolean(res.usedProxy));
        if (res.success) {
          setStudents(res.records);
          setWorkingDays(res.workingDays || 0);
          setErrorMessage(null);
        } else {
          setErrorMessage(res.error || 'Failed to connect to Google Apps Script endpoint.');
          setStudents([]);
          setWorkingDays(0);
        }
      });
    } else {
      setIsRealApi(false);
      setErrorMessage(null);
      setStudents([]);
      setWorkingDays(0);
    }
  };

  // Quick inline URL submission
  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleSaveConfig(urlInput.trim(), autoRefreshEnabled, refreshInterval);
  };

  // Toggle Auto-refresh from Header
  const handleToggleAutoRefresh = () => {
    const nextVal = !autoRefreshEnabled;
    setAutoRefreshEnabled(nextVal);
    try {
      localStorage.setItem(STORAGE_KEY_AUTO_REFRESH, String(nextVal));
    } catch {
      // ignore
    }
    if (nextVal) {
      setSecondsLeft(refreshInterval);
    }
  };

  // Manual Refresh Now
  const handleRefreshNow = () => {
    setSecondsLeft(refreshInterval);
    loadAttendance(true);
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const isDefaultersTab = activeTab === 'defaulters';
    return filterAttendanceRecords(students, {
      searchTerm,
      department: departmentFilter,
      year: yearFilter,
      status: statusFilter,
      belowThresholdOnly: belowThresholdOnly || isDefaultersTab,
    });
  }, [students, searchTerm, departmentFilter, yearFilter, statusFilter, belowThresholdOnly, activeTab]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return computeAttendanceMetrics(students, workingDays, ATTENDANCE_THRESHOLD);
  }, [students, workingDays]);

  // Handle View History for specific student
  const handleViewHistoryForStudent = (student: AttendanceRecord) => {
    setHistoryTargetStudent(student);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRealApi={isRealApi}
        isConfigured={Boolean(apiUrl)}
        isLoading={isLoading}
        lastSyncTime={lastSyncTime}
        refreshSecondsLeft={secondsLeft}
        isAutoRefreshActive={autoRefreshEnabled && Boolean(apiUrl)}
        toggleAutoRefresh={handleToggleAutoRefresh}
        onRefreshNow={handleRefreshNow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        defaultersCount={metrics.belowThresholdCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Banner: Prompt to enter deployed Google Apps Script Web App URL */}
        {!apiUrl ? (
          <div className="mb-6 p-6 rounded-2xl bg-white border border-blue-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Connect Live Google Sheets Web App API</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      API URL Required
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Paste your deployed Google Apps Script Web App GET endpoint URL below to fetch real student records from your spreadsheet (fields: <code>Name</code>, <code>RegisterNumber</code>, <code>Department</code>, <code>Year</code>, <code>UID</code>, <code>Email</code>).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer shadow-2xs"
                >
                  View Setup Guide
                </button>
              </div>
            </div>

            {/* Quick URL Input Form */}
            <form onSubmit={handleInlineSubmit} className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer shrink-0"
              >
                Fetch Live Attendance
              </button>
            </form>
          </div>
        ) : (
          /* When API is connected, show subtle connection bar */
          <div className="mb-4 px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800">Connected Endpoint:</span>
              <span className="font-mono text-slate-500 truncate max-w-md">{apiUrl}</span>
              {proxyUsed && (
                <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  CORS Proxy Active
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer shrink-0 ml-2"
            >
              Change URL
            </button>
          </div>
        )}

        {/* VIEW 1: LIVE ATTENDANCE DASHBOARD */}
        {activeTab === 'live' && (
          <div>
            {/* Live Summary Cards */}
            <SummaryCards
              metrics={metrics}
              onFilterDefaulters={() => {
                setBelowThresholdOnly(true);
                setStatusFilter('ALL');
              }}
              onFilterPresent={() => {
                setStatusFilter('Present');
                setBelowThresholdOnly(false);
              }}
              onFilterAbsent={() => {
                setStatusFilter('Absent');
                setBelowThresholdOnly(false);
              }}
              onResetFilter={() => {
                setStatusFilter('ALL');
                setBelowThresholdOnly(false);
                setDepartmentFilter('ALL');
                setYearFilter('ALL');
              }}
              activeStatusFilter={statusFilter}
              isDefaulterFilterActive={belowThresholdOnly}
            />

            {/* Attendance Table */}
            <AttendanceTable
              students={filteredStudents}
              allStudentsCount={students.length}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              yearFilter={yearFilter}
              setYearFilter={setYearFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              belowThresholdOnly={belowThresholdOnly}
              setBelowThresholdOnly={setBelowThresholdOnly}
              isLoading={isLoading}
              errorMessage={errorMessage}
              isRealApi={isRealApi}
              onSelectStudent={(std) => setSelectedStudent(std)}
              onViewHistory={(std) => handleViewHistoryForStudent(std)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onRetry={() => loadAttendance(true)}
            />
          </div>
        )}

        {/* VIEW 2: ATTENDANCE HISTORY VIEW */}
        {activeTab === 'history' && (
          <AttendanceHistoryView
            students={students}
            selectedStudent={historyTargetStudent}
            onClearSelectedStudent={() => setHistoryTargetStudent(null)}
            onBackToLive={() => setActiveTab('live')}
          />
        )}

        {/* VIEW 3: DEFAULTERS / LOW ATTENDANCE (<75%) WARNING LIST */}
        {activeTab === 'defaulters' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-red-200 border-l-4 border-l-red-600 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Students Below Statutory 75% Attendance Threshold
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      {metrics.belowThresholdCount} Students at Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    Under academic university guidelines, students with less than 75% aggregate attendance are subject to shortage warnings and may not be permitted to sit for term-end examinations.
                  </p>
                </div>
              </div>
            </div>

            <AttendanceTable
              students={filteredStudents}
              allStudentsCount={students.length}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              yearFilter={yearFilter}
              setYearFilter={setYearFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              belowThresholdOnly={true}
              setBelowThresholdOnly={() => {}}
              isLoading={isLoading}
              errorMessage={errorMessage}
              isRealApi={isRealApi}
              onSelectStudent={(std) => setSelectedStudent(std)}
              onViewHistory={(std) => handleViewHistoryForStudent(std)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onRetry={() => loadAttendance(true)}
            />
          </div>
        )}

        {/* VIEW 4: API & ESP32 SETUP GUIDE EMBED */}
        {activeTab === 'guide' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Google Apps Script &amp; ESP32 RC522 Setup Guide</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step-by-step instructions for wiring, sheet columns, and API endpoint configuration.
                </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
              >
                Configure Web App URL &rarr;
              </button>
            </div>
            
            <button
              onClick={() => setIsGuideOpen(true)}
              className="w-full py-8 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition cursor-pointer group bg-slate-50/50"
            >
              <Sparkles className="w-8 h-8 text-blue-600 group-hover:scale-110 transition" />
              <span className="font-bold text-sm text-slate-800">Open Full Interactive Integration Manual</span>
              <span className="text-xs text-slate-500">Includes complete Code.gs, ESP32 Arduino code, and JSON schema</span>
            </button>
          </div>
        )}

      </main>

      {/* Modals */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onViewHistory={(std) => {
            setSelectedStudent(null);
            handleViewHistoryForStudent(std);
          }}
        />
      )}

      {isSettingsOpen && (
        <ApiSettingsModal
          currentUrl={apiUrl}
          isRealApi={isRealApi}
          autoRefreshEnabled={autoRefreshEnabled}
          refreshInterval={refreshInterval}
          onSaveConfig={handleSaveConfig}
          onClose={() => setIsSettingsOpen(false)}
          onOpenGuide={() => {
            setIsSettingsOpen(false);
            setIsGuideOpen(true);
          }}
        />
      )}

      {isGuideOpen && (
        <ApiGuideModal
          onClose={() => setIsGuideOpen(false)}
          onOpenSettings={() => {
            setIsGuideOpen(false);
            setIsSettingsOpen(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">ESP32 + RC522 RFID Attendance Monitoring System</span>
          </div>
          <div>
            Attendance Metric: <code className="text-slate-700 font-semibold">(Attended / Conducted) × 100</code> &bull; Auto-Sync: 60s
          </div>
        </div>
      </footer>

    </div>
  );
}
