import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { isValidAppsScriptUrl, fetchAttendanceData } from '../services/attendanceApi';

interface ApiSettingsModalProps {
  currentUrl: string;
  isRealApi: boolean;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
  onSaveConfig: (url: string, autoRefresh: boolean, interval: number) => void;
  onClose: () => void;
  onOpenGuide: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  currentUrl,
  isRealApi,
  autoRefreshEnabled,
  refreshInterval,
  onSaveConfig,
  onClose,
  onOpenGuide,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentUrl);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(autoRefreshEnabled);
  const [intervalVal, setIntervalVal] = useState<number>(refreshInterval);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testCount, setTestCount] = useState<number | null>(null);

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter a valid Google Apps Script Web App URL first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);
    setTestCount(null);

    const result = await fetchAttendanceData(urlInput.trim());
    if (result.success) {
      setTestStatus('success');
      setTestCount(result.records.length);
      setTestMessage(`Successfully connected! Found ${result.records.length} student records in your Google Sheet.`);
    } else {
      setTestStatus('error');
      setTestMessage(result.error || 'Connection failed. Verify Web App deployment settings.');
    }
  };

  const handleSave = () => {
    onSaveConfig(urlInput.trim(), autoRefresh, Math.max(5, intervalVal));
    onClose();
  };

  const handleClear = () => {
    setUrlInput('');
    setTestStatus('idle');
    setTestMessage(null);
    onSaveConfig('', autoRefresh, intervalVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Sheets &amp; Web App API Config</h2>
              <p className="text-xs text-slate-500">Configure your Google Apps Script Web App endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Web App URL input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Apps Script Web App URL</span>
              </span>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold lowercase flex items-center gap-1 cursor-pointer"
              >
                <span>Where do I get this?</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestStatus('idle');
                  setTestMessage(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Paste the deployed Web App URL from your Google Apps Script editor (ends with <code>/exec</code>).
            </p>
          </div>

          {/* Test Connection Button & Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                Connection Test
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !urlInput.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Connection Verified!</div>
                  <div>{testMessage}</div>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Connection Failed</div>
                  <div className="text-red-700">{testMessage}</div>
                  <div className="mt-1.5 text-[11px] text-red-600 font-normal">
                    Important: In Google Apps Script Deployments, verify <strong>Who has access</strong> is set to <strong>Anyone</strong>.
                  </div>
                </div>
              </div>
            )}

            {testStatus === 'idle' && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>
                  {urlInput.trim() ? 'Click Test Connection to verify live response.' : 'Enter your URL above to test.'}
                </span>
              </div>
            )}
          </div>

          {/* Refresh Intervals & Auto-sync */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Automatic Refresh Settings
            </h4>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div>
                <div className="text-xs font-bold text-slate-800">Enable Auto-Sync</div>
                <div className="text-[11px] text-slate-500">
                  Continuously polls Google Sheets for fresh RC522 RFID swipes
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div>
                <div className="text-xs font-bold text-slate-800">Refresh Interval</div>
                <div className="text-[11px] text-slate-500">
                  Standard requirement is every 10 seconds
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={60}
                  step={1}
                  value={intervalVal}
                  onChange={(e) => setIntervalVal(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center font-mono font-bold"
                />
                <span className="text-xs text-slate-500 font-medium">seconds</span>
              </div>
            </div>
          </div>

          {/* Privacy & Security note */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Client-Side Safe: The URL is stored locally in your browser session. No credentials or private tokens are leaked or hardcoded.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
          {currentUrl ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear URL</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Connect</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
