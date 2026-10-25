import { AttendanceRecord, AttendanceMetrics, AttendanceStatus } from '../types/attendance';

export const ATTENDANCE_THRESHOLD = 75; // 75% threshold

/**
 * Robust case-insensitive and whitespace-tolerant field reader
 */
export function getField(obj: any, ...fieldNames: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;

  // Direct check
  for (const name of fieldNames) {
    if (obj[name] !== undefined && obj[name] !== null) {
      return obj[name];
    }
  }

  // Case-insensitive & trimmed check
  const entries = Object.entries(obj);
  for (const targetName of fieldNames) {
    const cleanTarget = targetName.trim().toLowerCase();
    for (const [key, val] of entries) {
      if (key.trim().toLowerCase() === cleanTarget && val !== undefined && val !== null) {
        return val;
      }
    }
  }

  return undefined;
}

/**
 * Calculates attendance percentage strictly using (classes attended / total classes conducted) * 100
 */
export function calculateAttendancePercentage(attended: number, total: number): number {
  if (typeof total !== 'number' || typeof attended !== 'number' || total <= 0) {
    return 0;
  }
  const safeAttended = Math.max(0, attended);
  const percentage = (safeAttended / total) * 100;
  return Math.min(100, Math.round(percentage * 10) / 10);
}

/**
 * Checks if a student is at or below attendance threshold (75% or less)
 * Requirement 6: "Show a clear warning when attendance is 75% or less. Show a normal status when it is above 75%."
 */
export function isAttendanceBelowThreshold(percentage: number | null, threshold = ATTENDANCE_THRESHOLD): boolean {
  if (percentage === null || percentage === undefined) return false;
  return percentage <= threshold;
}

/**
 * Generates student initials from actual name for the circular avatar
 * Handles spaced names ("Alex Johnson" -> "AJ") and initialed names ("M.VICKY" -> "MV", "R.SALIH" -> "RS")
 */
export function getStudentInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??';
  const clean = name.trim();
  if (!clean) return '??';

  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const first = parts[0][0] || '';
  const second = parts[1][0] || '';
  return (first + second).toUpperCase();
}

/**
 * Computes live summary metrics for the dashboard using backend data
 */
export function computeAttendanceMetrics(
  students: AttendanceRecord[],
  workingDays = 0,
  threshold = ATTENDANCE_THRESHOLD
): AttendanceMetrics {
  const totalStudents = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let registeredCount = 0;
  let belowThresholdCount = 0;
  let totalPercentageSum = 0;
  let studentsWithPercentage = 0;

  for (const s of students) {
    if (s.presentToday || s.status === 'Present') {
      presentCount++;
    } else if (s.status === 'Absent') {
      absentCount++;
    } else if (s.status === 'Late') {
      lateCount++;
    } else {
      registeredCount++;
    }

    // Requirement 6: 75% or less warning
    if (s.percentage !== null && isAttendanceBelowThreshold(s.percentage, threshold)) {
      belowThresholdCount++;
    }

    if (s.percentage !== null) {
      studentsWithPercentage++;
      totalPercentageSum += s.percentage;
    }
  }

  const averagePercentage = studentsWithPercentage > 0 
    ? Math.round((totalPercentageSum / studentsWithPercentage) * 10) / 10 
    : null;

  return {
    totalStudents,
    presentCount,
    absentCount,
    lateCount,
    registeredCount,
    belowThresholdCount,
    averagePercentage,
    workingDays,
    threshold,
  };
}

/**
 * Filters and searches attendance records
 */
export function filterAttendanceRecords(
  records: AttendanceRecord[],
  filters: {
    searchTerm?: string;
    department?: string;
    year?: string;
    status?: string;
    belowThresholdOnly?: boolean;
    date?: string;
  }
): AttendanceRecord[] {
  const search = (filters.searchTerm || '').trim().toLowerCase();
  const dept = (filters.department || '').trim();
  const year = (filters.year || '').trim();
  const status = (filters.status || '').trim();
  const belowThresholdOnly = Boolean(filters.belowThresholdOnly);
  const targetDate = (filters.date || '').trim();

  return records.filter((student) => {
    // Search query matches name, registerNumber, department, or rfidUid
    if (search) {
      const matchName = student.name.toLowerCase().includes(search);
      const matchReg = student.registerNumber.toLowerCase().includes(search);
      const matchDept = student.department.toLowerCase().includes(search);
      const matchRfid = student.rfidUid.toLowerCase().includes(search);
      if (!matchName && !matchReg && !matchDept && !matchRfid) {
        return false;
      }
    }

    // Department filter
    if (dept && dept !== 'ALL' && student.department.toLowerCase() !== dept.toLowerCase()) {
      return false;
    }

    // Year filter
    if (year && year !== 'ALL' && student.year.toLowerCase() !== year.toLowerCase()) {
      return false;
    }

    // Status filter
    if (status && status !== 'ALL') {
      if (status === 'Present' && !student.presentToday && student.status !== 'Present') return false;
      if (status === 'Absent' && (student.presentToday || student.status === 'Present')) return false;
      if (status !== 'Present' && status !== 'Absent' && student.status.toLowerCase() !== status.toLowerCase()) {
        return false;
      }
    }

    // Below 75% warning filter: 75% or less
    if (belowThresholdOnly) {
      if (student.percentage === null || !isAttendanceBelowThreshold(student.percentage, ATTENDANCE_THRESHOLD)) {
        return false;
      }
    }

    // Date filter
    if (targetDate && student.attendanceDate !== targetDate) {
      return false;
    }

    return true;
  });
}

/**
 * Normalizes raw API response from Google Apps Script Web App.
 * Uses `student.attendancePercentage` directly from backend (Requirement 10).
 * Uses `student.presentToday` directly from backend (Requirement 3).
 * Extracts `workingDays` and `attendance` swipe logs.
 */
export function normalizeStudentData(rawData: any): AttendanceRecord[] {
  if (!rawData) return [];

  let items: any[] = [];
  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (Array.isArray(rawData.students)) {
    items = rawData.students;
  } else if (Array.isArray(rawData.data)) {
    items = rawData.data;
  } else {
    return [];
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Map attendance logs by UID and RegisterNumber if attendance array is present
  const attendanceLogMap = new Map<string, any>();
  if (rawData && Array.isArray(rawData.attendance)) {
    for (const log of rawData.attendance) {
      const logUid = String(log.uid || '').trim().toUpperCase();
      const logReg = String(log.registerNumber || '').trim();
      if (logUid) attendanceLogMap.set(logUid, log);
      if (logReg) attendanceLogMap.set(logReg, log);
    }
  }

  const globalWorkingDays = Number(rawData.workingDays) || 0;

  return items.map((item, index) => {
    // 1. Name: map `name`, `NAME`, `Student Name`
    const rawName = getField(item, 'name', 'NAME', 'studentName', 'Student Name', 'FullName');
    const name = rawName !== undefined && rawName !== null && String(rawName).trim() !== ''
      ? String(rawName).trim()
      : 'Unnamed Student';

    // 2. RegisterNumber: map `registerNumber`, `REGISTERNUMBER`, `regNo`
    const rawRegNo = getField(item, 'registerNumber', 'REGISTERNUMBER', 'RegisterNumber', 'regNo', 'RollNo', 'Roll No', 'Register Number');
    const regNo = rawRegNo !== undefined && rawRegNo !== null && String(rawRegNo).trim() !== ''
      ? String(rawRegNo).trim()
      : 'N/A';

    // 3. Department: map `department`, `DEPARTMENT`, `Dept`
    const rawDept = getField(item, 'department', 'DEPARTMENT', 'Department', 'dept', 'Dept');
    const department = rawDept !== undefined && rawDept !== null && String(rawDept).trim() !== ''
      ? String(rawDept).trim()
      : 'General';

    // 4. Year: map `year`, `YEAR`, `Year`
    const rawYear = getField(item, 'year', 'YEAR', 'Year');
    const year = rawYear !== undefined && rawYear !== null && String(rawYear).trim() !== ''
      ? String(rawYear).trim()
      : '1st Year';

    // 5. UID: map `uid`, `UID`, `UID `
    const rawUid = getField(item, 'uid', 'UID ', 'UID', 'rfidUid', 'cardUid', 'RFID UID');
    const rfidUid = rawUid !== undefined && rawUid !== null && String(rawUid).trim() !== ''
      ? String(rawUid).trim()
      : '—';

    // 6. Email: map `email`, `EMAIL`, `Email`
    const rawEmail = getField(item, 'email', 'EMAIL', 'Email');
    const email = rawEmail !== undefined && rawEmail !== null && String(rawEmail).trim() !== ''
      ? String(rawEmail).trim()
      : undefined;

    // 7. presentToday status: Use student.presentToday from backend (Requirement 3)
    const rawPresentToday = getField(item, 'presentToday', 'present_today', 'PresentToday');
    const rawStatus = getField(item, 'status', 'STATUS', 'AttendanceStatus');
    
    let presentToday = false;
    let status: AttendanceStatus = 'Absent';

    if (typeof rawPresentToday === 'boolean') {
      presentToday = rawPresentToday;
      status = rawPresentToday ? 'Present' : 'Absent';
    } else if (rawStatus) {
      const lower = String(rawStatus).trim().toLowerCase();
      if (lower === 'present' || lower === 'p') {
        presentToday = true;
        status = 'Present';
      } else if (lower === 'late' || lower === 'l') {
        presentToday = true;
        status = 'Late';
      } else {
        presentToday = false;
        status = 'Absent';
      }
    } else {
      // Check if logged in attendance array today
      const uidKey = rfidUid.trim().toUpperCase();
      const matchedLog = attendanceLogMap.get(uidKey) || attendanceLogMap.get(regNo);
      if (matchedLog && matchedLog.status?.toLowerCase() === 'present') {
        presentToday = true;
        status = 'Present';
      }
    }

    // 8. attendancePercentage: Requirement 10: "Do not calculate a different attendance percentage in the frontend. Use the percentage returned by Apps Script so the dashboard and email checker share the same value."
    const rawAttendancePercentage = getField(item, 'attendancePercentage', 'attendance_percentage', 'AttendancePercentage', 'percentage', 'PERCENTAGE');
    let attendancePercentage = 0;
    let hasAttendanceStats = false;

    if (rawAttendancePercentage !== undefined && rawAttendancePercentage !== null && !isNaN(Number(rawAttendancePercentage))) {
      attendancePercentage = Math.round(Number(rawAttendancePercentage) * 10) / 10;
      hasAttendanceStats = true;
    } else {
      // Fallback only if backend did not supply attendancePercentage: use attendanceCount / workingDays
      const count = Number(getField(item, 'attendanceCount', 'attendance_count', 'classesAttended')) || (presentToday ? 1 : 0);
      const total = globalWorkingDays > 0 ? globalWorkingDays : 1;
      attendancePercentage = calculateAttendancePercentage(count, total);
      hasAttendanceStats = count > 0 || globalWorkingDays > 0;
    }

    // 9. Attendance counts & total working days
    const attendanceCount = Number(getField(item, 'attendanceCount', 'classesAttended', 'attended')) || (presentToday ? 1 : 0);
    const classesAttended = attendanceCount;
    const totalClasses = globalWorkingDays > 0 ? globalWorkingDays : (Number(getField(item, 'totalClasses', 'total')) || 1);

    // 10. Date and Time from attendance log if available
    const uidKey = rfidUid.trim().toUpperCase();
    const matchedLog = attendanceLogMap.get(uidKey) || attendanceLogMap.get(regNo);

    const attendanceDate = matchedLog?.date || String(getField(item, 'date', 'DATE', 'attendanceDate') || todayStr);
    const attendanceTime = matchedLog?.time || String(getField(item, 'time', 'TIME', 'attendanceTime') || (presentToday ? '08:30:00 AM' : '—'));

    return {
      id: String(item.id || regNo || `std-${index}`),
      name,
      registerNumber: regNo,
      department,
      year,
      rfidUid,
      attendanceDate,
      attendanceTime,
      status,
      presentToday,
      attendancePercentage,
      attendanceCount,
      classesAttended,
      totalClasses,
      percentage: attendancePercentage, // Alias for existing components
      hasAttendanceStats,
      email,
      phone: item.phone || item.Phone || undefined,
      history: Array.isArray(item.history) ? item.history : (matchedLog ? [{
        date: matchedLog.date || todayStr,
        time: matchedLog.time || '—',
        status: (matchedLog.status?.toLowerCase() === 'present' ? 'Present' : 'Absent') as AttendanceStatus,
        rfidUid: matchedLog.uid || rfidUid,
      }] : undefined),
    };
  });
}
