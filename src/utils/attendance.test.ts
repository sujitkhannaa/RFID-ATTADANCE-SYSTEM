import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendancePercentage,
  isAttendanceBelowThreshold,
  computeAttendanceMetrics,
  filterAttendanceRecords,
  normalizeStudentData,
  getStudentInitials,
  getField,
} from './attendance';

test('getStudentInitials generates proper initials for avatars including initials like M.VICKY and R.SALIH', () => {
  assert.equal(getStudentInitials('M.VICKY'), 'MV');
  assert.equal(getStudentInitials('R.SALIH'), 'RS');
  assert.equal(getStudentInitials('Alex Johnson'), 'AJ');
  assert.equal(getStudentInitials('Vigneshwaran Murugan'), 'VM');
  assert.equal(getStudentInitials('Divya'), 'DI');
  assert.equal(getStudentInitials(''), '??');
});

test('getField retrieves case-insensitive and trimmed fields', () => {
  const item = {
    'UID ': '83346A27',
    NAME: 'M.VICKY',
    REGISTERNUMBER: '73152519060',
    DEPARTMENT: 'IOT',
    YEAR: 'II',
    EMAIL: 'vigneshwaran2007@gmail.com',
  };

  assert.equal(getField(item, 'UID', 'uid'), '83346A27');
  assert.equal(getField(item, 'Name', 'name'), 'M.VICKY');
  assert.equal(getField(item, 'RegisterNumber'), '73152519060');
  assert.equal(getField(item, 'Department'), 'IOT');
  assert.equal(getField(item, 'Year'), 'II');
  assert.equal(getField(item, 'Email'), 'vigneshwaran2007@gmail.com');
});

test('isAttendanceBelowThreshold correctly identifies 75% or less as warning', () => {
  assert.equal(isAttendanceBelowThreshold(75), true); // 75% is warning
  assert.equal(isAttendanceBelowThreshold(74.9), true); // < 75% is warning
  assert.equal(isAttendanceBelowThreshold(68), true);
  assert.equal(isAttendanceBelowThreshold(75.1), false); // > 75% is normal
  assert.equal(isAttendanceBelowThreshold(100), false);
  assert.equal(isAttendanceBelowThreshold(null), false);
});

test('normalizeStudentData maps user live Apps Script payload accurately with attendancePercentage, presentToday, and workingDays', () => {
  const livePayload = {
    success: true,
    students: [
      {
        uid: '83346A27',
        name: 'M.VICKY',
        registerNumber: '73152519060',
        department: 'IOT',
        year: 'II',
        email: 'vigneshwaranmurugan2007@gmail.com',
        presentToday: true,
        attendancePercentage: 100,
        attendanceCount: 1,
      },
      {
        uid: '61BEE006',
        name: 'R.SALIH',
        registerNumber: '73152519029',
        department: 'IOT',
        year: 'II',
        email: 'mdsalih0007@gmail.com',
        presentToday: false,
        attendancePercentage: 68,
        attendanceCount: 1,
      },
      {
        uid: '4C97E106',
        name: 'Sujit Khannaa M',
        registerNumber: '73152513167',
        department: 'CSE',
        year: 'II',
        email: 'sujitkhannaam@gmail.com',
        presentToday: true,
        attendancePercentage: 100,
        attendanceCount: 1,
      },
    ],
    attendance: [
      { uid: '61BEE006', name: 'R.SALIH', registerNumber: '73152519029', date: '2026-10-25', time: '12:37:41', status: 'PRESENT' },
      { uid: '4C97E106', name: 'Sujit Khannaa M', registerNumber: '73152513167', date: '2026-10-25', time: '12:27:31', status: 'PRESENT' },
      { uid: '83346A27', name: 'M.VICKY', registerNumber: '73152519060', date: '2026-10-25', time: '10:34:56', status: 'PRESENT' },
    ],
    workingDays: 1,
    presentToday: 2,
    lowAttendance: 1,
  };

  const students = normalizeStudentData(livePayload);
  assert.equal(students.length, 3);

  // Student 1: M.VICKY
  assert.equal(students[0].name, 'M.VICKY');
  assert.equal(students[0].registerNumber, '73152519060');
  assert.equal(students[0].department, 'IOT');
  assert.equal(students[0].year, 'II');
  assert.equal(students[0].rfidUid, '83346A27');
  assert.equal(students[0].email, 'vigneshwaranmurugan2007@gmail.com');
  assert.equal(students[0].presentToday, true);
  assert.equal(students[0].attendancePercentage, 100);
  assert.equal(students[0].status, 'Present');
  assert.equal(students[0].attendanceTime, '10:34:56');

  // Student 2: R.SALIH with 68% (low attendance warning)
  assert.equal(students[1].name, 'R.SALIH');
  assert.equal(students[1].presentToday, false);
  assert.equal(students[1].attendancePercentage, 68);
  assert.equal(isAttendanceBelowThreshold(students[1].attendancePercentage), true);

  // Student 3: Sujit Khannaa M
  assert.equal(students[2].name, 'Sujit Khannaa M');
  assert.equal(students[2].presentToday, true);
  assert.equal(students[2].attendancePercentage, 100);
  assert.equal(isAttendanceBelowThreshold(students[2].attendancePercentage), false);
});

test('computeAttendanceMetrics accurately computes summaries with workingDays', () => {
  const livePayload = {
    success: true,
    students: [
      {
        uid: '83346A27',
        name: 'M.VICKY',
        registerNumber: '73152519060',
        presentToday: true,
        attendancePercentage: 100,
      },
      {
        uid: '61BEE006',
        name: 'R.SALIH',
        registerNumber: '73152519029',
        presentToday: false,
        attendancePercentage: 68,
      },
    ],
    workingDays: 5,
  };

  const students = normalizeStudentData(livePayload);
  const metrics = computeAttendanceMetrics(students, 5);

  assert.equal(metrics.totalStudents, 2);
  assert.equal(metrics.presentCount, 1);
  assert.equal(metrics.absentCount, 1);
  assert.equal(metrics.belowThresholdCount, 1); // R.SALIH is 68% <= 75%
  assert.equal(metrics.averagePercentage, 84); // (100 + 68) / 2
  assert.equal(metrics.workingDays, 5);
});
