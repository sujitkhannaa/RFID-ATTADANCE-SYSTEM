import React from 'react';
import { 
  X, 
  User, 
  Radio, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { AttendanceRecord } from '../types/attendance';
import { ATTENDANCE_THRESHOLD, getStudentInitials, isAttendanceBelowThreshold } from '../utils/attendance';

interface StudentDetailsModalProps {
  student: AttendanceRecord | null;
  onClose: () => void;
  onViewHistory: (student: AttendanceRecord) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  onClose,
  onViewHistory,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!student) return null;

  const isDefaulter = Boolean(student.hasAttendanceStats && student.attendancePercentage !== null && isAttendanceBelowThreshold(student.attendancePercentage, ATTENDANCE_THRESHOLD));
  const classesNeededFor75 = (student.totalClasses && student.classesAttended !== null)
    ? Math.max(0, Math.ceil((0.75 * student.totalClasses - student.classesAttended) / (1 - 0.75)))
    : 0;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(student.rfidUid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl uppercase ${
              isDefaulter 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {getStudentInitials(student.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                {isDefaulter && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>&lt;75% Shortage</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                Reg No: {student.registerNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Below 75% Critical Warning Box */}
          {isDefaulter && student.percentage !== null && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
              <div className="flex items-center gap-2 font-bold text-red-800 text-sm mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Attendance Shortage Warning ({student.percentage}%)</span>
              </div>
              <p className="text-xs text-red-800/90 leading-relaxed">
                This student does not meet the minimum statutory 75% attendance criteria. 
                They have attended <strong>{student.classesAttended}</strong> out of <strong>{student.totalClasses}</strong> classes conducted.
                {classesNeededFor75 > 0 && (
                  <span> Minimum <strong>{classesNeededFor75}</strong> consecutive classes required to reach 75%.</span>
                )}
              </p>
            </div>
          )}

          {/* Attendance Gauge & Statistics (if tracked) */}
          {student.hasAttendanceStats && student.percentage !== null ? (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Attendance Percentage
                </span>
                <span className={`text-2xl font-black ${
                  isDefaulter ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {student.percentage}%
                </span>
              </div>

              {/* Meter Bar */}
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isDefaulter ? 'bg-red-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, student.percentage))}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-600 z-10"
                  style={{ left: '75%' }}
                  title="75% Required Threshold"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>0%</span>
                <span className="text-yellow-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  75% Threshold Target
                </span>
                <span>100%</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 text-center">
                <div>
                  <span className="text-xs text-slate-500 block">Attended</span>
                  <span className="text-lg font-extrabold text-slate-900">{student.classesAttended}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Total Conducted</span>
                  <span className="text-lg font-extrabold text-slate-900">{student.totalClasses}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Absent Days</span>
                  <span className="text-lg font-extrabold text-red-600">
                    {Math.max(0, (student.totalClasses || 0) - (student.classesAttended || 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendance Tracking</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  UID <strong>{student.rfidUid}</strong> is registered on the system. Swipe card on ESP32 + RC522 reader to log daily sessions.
                </p>
              </div>
            </div>
          )}

          {/* Academic & Hardware Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-medium">Department</span>
                <span className="font-bold text-slate-800">{student.department}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-medium">Academic Year</span>
                <span className="font-bold text-slate-800">{student.year}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 sm:col-span-2 shadow-2xs">
              <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">RC522 RFID Card UID</span>
                  <button
                    onClick={handleCopyUid}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy UID'}</span>
                  </button>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                  {student.rfidUid}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Punch Information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Today&apos;s RFID Status &bull; {student.attendanceDate}
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {student.status === 'Present' ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-900 text-sm">{student.status}</span>
                  <p className="text-xs text-slate-500">
                    {student.status === 'Present' ? 'Swiped on ESP32 Reader' : 'No swipe detected today'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800 justify-end">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{student.attendanceTime || '—'}</span>
                </div>
                <span className="text-[11px] text-slate-500">Punch Timestamp</span>
              </div>
            </div>
          </div>

          {/* Quick History Preview */}
          {student.history && student.history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Recent RFID Logs
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onViewHistory(student);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  View full history &rarr;
                </button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                {student.history.slice(0, 4).map((h, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${h.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-mono font-medium text-slate-800">{h.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500">{h.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.status === 'Present' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Details */}
          {(student.email || student.phone) && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
              {student.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onViewHistory(student);
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
          >
            Attendance Logs History
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
