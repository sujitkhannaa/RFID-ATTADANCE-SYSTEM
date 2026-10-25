import React from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  History, 
  Copy, 
  Check, 
  Radio, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { AttendanceRecord } from '../types/attendance';
import { ATTENDANCE_THRESHOLD, getStudentInitials, isAttendanceBelowThreshold } from '../utils/attendance';

interface AttendanceTableProps {
  students: AttendanceRecord[];
  allStudentsCount: number;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (d: string) => void;
  yearFilter: string;
  setYearFilter: (y: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  belowThresholdOnly: boolean;
  setBelowThresholdOnly: (b: boolean) => void;
  isLoading: boolean;
  errorMessage: string | null;
  isRealApi: boolean;
  onSelectStudent: (student: AttendanceRecord) => void;
  onViewHistory: (student: AttendanceRecord) => void;
  onOpenSettings: () => void;
  onRetry: () => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  allStudentsCount,
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  yearFilter,
  setYearFilter,
  statusFilter,
  setStatusFilter,
  belowThresholdOnly,
  setBelowThresholdOnly,
  isLoading,
  errorMessage,
  isRealApi,
  onSelectStudent,
  onViewHistory,
  onOpenSettings,
  onRetry,
}) => {
  const [copiedUid, setCopiedUid] = React.useState<string | null>(null);

  const copyUid = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 1800);
  };

  const departments = ['ALL', 'Computer Science & Engineering', 'Electronics & Communication', 'Information Technology', 'Mechanical Engineering', 'Electrical & Electronics Engineering', 'Artificial Intelligence & Data Science'];
  const years = ['ALL', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, register no, department, RFID UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs sm:text-sm text-slate-700 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.filter(d => d !== 'ALL').map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs sm:text-sm text-slate-700 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="ALL">All Years</option>
              {years.filter(y => y !== 'ALL').map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs sm:text-sm text-slate-700 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Late">Late Only</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* <75% Toggle button */}
          <button
            onClick={() => setBelowThresholdOnly(!belowThresholdOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition cursor-pointer shadow-2xs ${
              belowThresholdOnly
                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-current" />
            <span>&lt; 75% Only</span>
          </button>
        </div>
      </div>

      {/* Active Filter Indicators Bar */}
      {(searchTerm || departmentFilter !== 'ALL' || yearFilter !== 'ALL' || statusFilter !== 'ALL' || belowThresholdOnly) && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Showing filtered:</span>
            <span className="font-bold text-slate-900">{students.length}</span> of {allStudentsCount} students
            {belowThresholdOnly && (
              <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">
                Attendance &lt; 75% Warning
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                Status: {statusFilter}
              </span>
            )}
            {departmentFilter !== 'ALL' && (
              <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-semibold">
                Dept: {departmentFilter}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('ALL');
              setYearFilter('ALL');
              setStatusFilter('ALL');
              setBelowThresholdOnly(false);
            }}
            className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && isRealApi && (
        <div className="p-5 m-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900">Failed to sync with Google Apps Script Web App</h4>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
              <p className="text-xs text-red-600 mt-1">
                Tip: In Apps Script Deployments, verify <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
            >
              Retry Sync
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer"
            >
              Check URL
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold">
              <th className="py-3.5 px-4">Student &amp; Register No</th>
              <th className="py-3.5 px-4">Department &amp; Year</th>
              <th className="py-3.5 px-4">RFID UID (RC522)</th>
              <th className="py-3.5 px-4">Today&apos;s Status</th>
              <th className="py-3.5 px-4">Punch Time</th>
              <th className="py-3.5 px-4">Attendance %</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && students.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-36 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-16 mb-1"></div>
                    <div className="h-2 bg-slate-200 rounded-full w-28"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center bg-slate-50/30">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No attendance records found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchTerm || departmentFilter !== 'ALL' || yearFilter !== 'ALL' || statusFilter !== 'ALL' || belowThresholdOnly
                        ? 'No students match your active search and filter criteria. Try clearing or relaxing filters.'
                        : isRealApi
                        ? 'The connected Google Sheet returned an empty student list. Ensure your "Students" sheet tab has registered rows.'
                        : 'No records available. Configure your Google Apps Script Web App URL to stream live sheet data.'}
                    </p>
                    {isRealApi && (
                      <button
                        onClick={onRetry}
                        className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
                      >
                        Refresh from Google Sheets
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isDefaulter = student.hasAttendanceStats && student.attendancePercentage !== null && isAttendanceBelowThreshold(student.attendancePercentage, ATTENDANCE_THRESHOLD);
                const isPresent = Boolean(student.presentToday);
                const isAbsent = !student.presentToday && student.status !== 'Late';
                const isLate = student.status === 'Late';

                return (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className={`group hover:bg-slate-50/80 transition cursor-pointer ${
                      isDefaulter ? 'bg-red-50/30' : ''
                    }`}
                  >
                    {/* Student Name & Register No */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                          isDefaulter 
                            ? 'bg-red-100 text-red-800 border border-red-300' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {getStudentInitials(student.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{student.name}</span>
                            {isDefaulter && (
                              <span 
                                title="Warning: Attendance is 75% or less"
                                className="inline-flex items-center text-red-600"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">
                            {student.registerNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Year */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800 max-w-[200px] truncate" title={student.department}>
                        {student.department}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {student.year}
                      </div>
                    </td>

                    {/* RFID UID with Copy */}
                    <td className="py-3.5 px-4" onClick={(e) => copyUid(student.rfidUid, e)}>
                      <div 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-medium text-slate-800 border border-slate-200 hover:border-slate-400 hover:bg-slate-200/60 transition group/copy cursor-pointer shadow-2xs"
                        title="Click to copy RFID UID for ESP32 testing"
                      >
                        <Radio className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{student.rfidUid}</span>
                        {copiedUid === student.rfidUid ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover/copy:text-slate-600 opacity-0 group-hover/copy:opacity-100 transition" />
                        )}
                      </div>
                    </td>

                    {/* Today's Status (using student.presentToday) */}
                    <td className="py-3.5 px-4">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Present Today</span>
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Late</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Absent Today</span>
                        </span>
                      )}
                    </td>

                    {/* Punch Time */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {student.attendanceTime || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.attendanceDate}
                      </div>
                    </td>

                    {/* Attendance % & Progress (using student.attendancePercentage directly) */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      {student.hasAttendanceStats && student.attendancePercentage !== null ? (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-extrabold ${
                              isDefaulter ? 'text-red-600' : 'text-emerald-700'
                            }`}>
                              {student.attendancePercentage}%
                            </span>
                            <span className="text-slate-500 font-mono text-[11px] font-semibold">
                              {student.classesAttended}/{student.totalClasses}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDefaulter ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, student.attendancePercentage))}%` }}
                            />
                          </div>

                          {/* Requirement 6: Clear warning when <= 75%, normal status when > 75% */}
                          {isDefaulter ? (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-red-600 font-bold">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Warning (&le;75%)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-semibold">
                              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Normal (&gt;75%)</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                            Pending Swipes
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            RC522 Tag Ready
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                          title="View Student Full Details"
                          aria-label={`View details for ${student.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewHistory(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                          title="View Attendance History"
                          aria-label={`View history for ${student.name}`}
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span>Showing <strong className="text-slate-800 font-bold">{students.length}</strong> of <strong className="text-slate-800 font-bold">{allStudentsCount}</strong> students</span>
          <span className="hidden sm:inline text-slate-300">&bull;</span>
          <span className="hidden sm:inline">Formula: <code className="text-slate-700 font-semibold">(Attended / Total) × 100</code></span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&ge; 75% Safe</span>
          </span>
          <span className="flex items-center gap-1.5 text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>&lt; 75% Warning</span>
          </span>
        </div>
      </div>

    </div>
  );
};
