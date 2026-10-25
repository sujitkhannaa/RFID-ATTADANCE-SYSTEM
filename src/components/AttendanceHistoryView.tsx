import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  ArrowLeft,
  Users,
  AlertTriangle
} from 'lucide-react';
import { AttendanceRecord, AttendanceHistoryItem, AttendanceStatus } from '../types/attendance';

interface AttendanceHistoryViewProps {
  students: AttendanceRecord[];
  selectedStudent: AttendanceRecord | null;
  onClearSelectedStudent: () => void;
  onBackToLive: () => void;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  students,
  selectedStudent,
  onClearSelectedStudent,
  onBackToLive,
}) => {
  const [historySearch, setHistorySearch] = useState<string>('');

  interface FlattenedLog {
    studentName: string;
    registerNumber: string;
    department: string;
    rfidUid: string;
    date: string;
    time: string;
    status: AttendanceStatus;
    percentage: number | null;
  }

  const allLogs: FlattenedLog[] = [];

  students.forEach((student) => {
    if (student.history && student.history.length > 0) {
      student.history.forEach((h: AttendanceHistoryItem) => {
        allLogs.push({
          studentName: student.name,
          registerNumber: student.registerNumber,
          department: student.department,
          rfidUid: student.rfidUid,
          date: h.date,
          time: h.time,
          status: h.status,
          percentage: student.percentage,
        });
      });
    } else {
      allLogs.push({
        studentName: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
        rfidUid: student.rfidUid,
        date: student.attendanceDate,
        time: student.attendanceTime,
        status: student.status,
        percentage: student.percentage,
      });
    }
  });

  const filteredLogs = allLogs.filter((log) => {
    if (selectedStudent && log.registerNumber !== selectedStudent.registerNumber) {
      return false;
    }
    if (historySearch) {
      const q = historySearch.toLowerCase();
      const matchName = log.studentName.toLowerCase().includes(q);
      const matchReg = log.registerNumber.toLowerCase().includes(q);
      const matchUid = log.rfidUid.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchUid) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Register Number', 'Student Name', 'Department', 'RFID UID', 'Date', 'Time', 'Status', 'Attendance %'];
    const rows = filteredLogs.map(l => [
      l.registerNumber,
      `"${l.studentName}"`,
      `"${l.department}"`,
      `"${l.rfidUid}"`,
      l.date,
      l.time,
      l.status,
      l.percentage,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RFID_Attendance_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLive}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Return to Live Attendance Dashboard"
              aria-label="Back to Live"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Attendance History &amp; RFID Audit Log</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8">
            Complete swipe timestamps recorded from ESP32 &bull; RC522 reader into Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedStudent && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium">
              <span>Filtered by: <strong>{selectedStudent.name}</strong></span>
              <button
                onClick={onClearSelectedStudent}
                className="text-blue-600 hover:text-blue-900 font-bold ml-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* History Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search history by student name, roll number, or RFID UID..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap self-end md:self-center">
          <span>Total Logged Punches: <strong className="text-slate-900 font-mono font-bold">{filteredLogs.length}</strong></span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Student &amp; Register No</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Card UID (RC522)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cumulative %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 bg-slate-50/30">
                    No historical logs found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const isPresent = log.status === 'Present';
                  const isLow = log.percentage !== null && log.percentage < 75;

                  return (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{log.date}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 pl-5">
                          {log.time}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.studentName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{log.registerNumber}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {log.department}
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          <Radio className="w-3 h-3 text-emerald-600" />
                          <span>{log.rfidUid}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Present</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <XCircle className="w-3 h-3 text-amber-600" />
                            <span>{log.status}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {log.percentage !== null ? (
                          <>
                            <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                              {log.percentage}%
                            </span>
                            {isLow && (
                              <span className="ml-1 text-red-600" title="Below 75% warning">
                                ⚠️
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
