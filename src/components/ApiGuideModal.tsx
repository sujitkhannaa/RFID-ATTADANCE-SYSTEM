import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Copy, 
  Check, 
  Cpu, 
  FileSpreadsheet, 
  Code2, 
  HelpCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { APPS_SCRIPT_CODE, ESP32_ARDUINO_SNIPPET, EXPECTED_JSON_SCHEMA } from '../data/apiDocs';

interface ApiGuideModalProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ApiGuideModal: React.FC<ApiGuideModalProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'appsScript' | 'jsonSchema' | 'esp32'>('sheet');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-xl relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ESP32 + RC522 &amp; Google Apps Script Integration Guide</h2>
              <p className="text-xs text-slate-500">Required API response format, endpoints, and sheet schema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-2 shrink-0 overflow-x-auto text-xs sm:text-sm bg-slate-50/50">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sheet'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Google Sheet Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('appsScript')}
            className={`px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'appsScript'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('jsonSchema')}
            className={`px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'jsonSchema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Required API Format</span>
          </button>

          <button
            onClick={() => setActiveTab('esp32')}
            className={`px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'esp32'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>4. ESP32 Arduino Code</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
          
          {/* TAB 1: Google Sheet Structure */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                Create a new Google Sheet and add two tabs with the exact names below:
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">A</span>
                  <span>Tab 1: <code>Students</code></span>
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Row 1 must contain the following exact column headers:
                </p>
                <div className="p-3 bg-slate-100 rounded-lg font-mono text-xs text-slate-800 border border-slate-200 overflow-x-auto font-medium">
                  Register Number | Student Name | Department | Year | RFID UID | Total Classes | Classes Attended
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>Register Number:</strong> e.g. <code>920121104001</code></div>
                  <div>&bull; <strong>RFID UID:</strong> 4-byte hex from RC522 reader e.g. <code>E2 80 68 3A</code></div>
                  <div>&bull; <strong>Total Classes:</strong> Total classes conducted to date (e.g. <code>48</code>)</div>
                  <div>&bull; <strong>Classes Attended:</strong> Total sessions attended by this student</div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">B</span>
                  <span>Tab 2: <code>AttendanceLogs</code></span>
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Row 1 contains attendance swipe logs recorded automatically by ESP32:
                </p>
                <div className="p-3 bg-slate-100 rounded-lg font-mono text-xs text-slate-800 border border-slate-200 overflow-x-auto font-medium">
                  Date | Time | RFID UID | Register Number | Student Name | Status
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Apps Script Code */}
          {activeTab === 'appsScript' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Google Apps Script Web App Code (`Code.gs`)</h4>
                  <p className="text-xs text-slate-500">
                    Open Extensions &gt; Apps Script in your Google Sheet, paste this code, and deploy as Web App.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(APPS_SCRIPT_CODE, 'script')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-2xs"
                >
                  {copiedType === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'script' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Deployment Critical Setting:</strong> When clicking <em>Deploy &gt; New deployment &gt; Select type: Web app</em>:
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li><strong>Execute as:</strong> Me (your Google account)</li>
                  <li><strong>Who has access:</strong> Anyone (DO NOT choose &quot;Only myself&quot; so the frontend and ESP32 can connect without browser login)</li>
                </ul>
              </div>

              <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 border border-slate-800 max-h-72 overflow-y-auto overflow-x-auto whitespace-pre">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}

          {/* TAB 3: Expected JSON Schema & Endpoints */}
          {activeTab === 'jsonSchema' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Required Endpoint URLs</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-bold text-blue-700">1. Attendance Retrieval (Dashboard):</div>
                    <code className="text-slate-900 block mt-1 break-all font-mono">
                      GET https://script.google.com/macros/s/&#123;SCRIPT_ID&#125;/exec?action=getAttendance&amp;date=YYYY-MM-DD
                    </code>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-bold text-emerald-700">2. Attendance Swipe Logging (ESP32 RC522):</div>
                    <code className="text-slate-900 block mt-1 break-all font-mono">
                      GET https://script.google.com/macros/s/&#123;SCRIPT_ID&#125;/exec?action=logAttendance&amp;uid=E2%2080%2068%203A
                    </code>
                    <span className="text-slate-500 block mt-1">
                      (Or send a JSON POST request with <code>{`{ "uid": "E2 80 68 3A" }`}</code>)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900">Expected JSON API Response Format</h4>
                  <button
                    onClick={() => copyToClipboard(EXPECTED_JSON_SCHEMA, 'schema')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    {copiedType === 'schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'schema' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800 max-h-60 overflow-y-auto overflow-x-auto whitespace-pre">
                  {EXPECTED_JSON_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: ESP32 Code */}
          {activeTab === 'esp32' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">ESP32 + RC522 Arduino C++ Firmware</h4>
                  <p className="text-xs text-slate-500">
                    Connects to WiFi and transmits card swipes to your Google Apps Script URL.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(ESP32_ARDUINO_SNIPPET, 'esp32')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-2xs"
                >
                  {copiedType === 'esp32' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'esp32' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 mb-1">RC522 to ESP32 Pin Wiring:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-700 font-medium">
                  <div>SDA (SS): GPIO 5</div>
                  <div>SCK: GPIO 18</div>
                  <div>MOSI: GPIO 23</div>
                  <div>MISO: GPIO 19</div>
                  <div>RST: GPIO 22</div>
                  <div>3.3V: 3.3V</div>
                  <div>GND: GND</div>
                  <div>IRQ: Not connected</div>
                </div>
              </div>

              <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 border border-slate-800 max-h-64 overflow-y-auto overflow-x-auto whitespace-pre">
                {ESP32_ARDUINO_SNIPPET}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Ready with your deployed URL?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
            >
              Configure API URL Now &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
