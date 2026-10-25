export const APPS_SCRIPT_CODE = `/**
 * Google Apps Script for ESP32 + RC522 RFID Attendance System
 * Deployed as: Web App
 * Execute as: Me
 * Who has access: Anyone
 */

const SHEET_STUDENTS = "Students";
const SHEET_ATTENDANCE = "AttendanceLogs";

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAttendance";
    const dateParam = (e && e.parameter && e.parameter.date) ? e.parameter.date : Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");

    if (action === "getAttendance") {
      return handleGetAttendance(dateParam);
    } else if (action === "logAttendance") {
      // Allows ESP32 to log via HTTP GET: ?action=logAttendance&uid=E2 80 68 3A
      const uid = e.parameter.uid || "";
      return handleLogAttendance(uid);
    }

    return createJsonResponse({ status: "error", message: "Unknown action" }, 400);
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    // Allows ESP32 to log attendance via JSON POST: { "uid": "E2 80 68 3A" }
    let uid = "";
    if (e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        uid = body.uid || body.rfidUid || "";
      } catch (pErr) {
        uid = e.parameter.uid || "";
      }
    } else if (e.parameter && e.parameter.uid) {
      uid = e.parameter.uid;
    }

    if (!uid) {
      return createJsonResponse({ status: "error", message: "Missing RFID UID in payload" }, 400);
    }

    return handleLogAttendance(uid);
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

function handleGetAttendance(targetDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName(SHEET_STUDENTS);
  const logsSheet = ss.getSheetByName(SHEET_ATTENDANCE);

  if (!studentsSheet) {
    return createJsonResponse({ status: "error", message: "Students sheet tab not found" }, 404);
  }

  const studentData = studentsSheet.getDataRange().getValues();
  if (studentData.length <= 1) {
    return createJsonResponse({ status: "success", date: targetDate, students: [] });
  }

  // Headers in Students sheet:
  // Register Number | Student Name | Department | Year | RFID UID | Total Classes | Classes Attended
  const headers = studentData[0];
  const colReg = headers.indexOf("Register Number");
  const colName = headers.indexOf("Student Name");
  const colDept = headers.indexOf("Department");
  const colYear = headers.indexOf("Year");
  const colUid = headers.indexOf("RFID UID");
  const colTotal = headers.indexOf("Total Classes");
  const colAttended = headers.indexOf("Classes Attended");

  // Read logs for targetDate
  let presentUids = new Map();
  if (logsSheet && logsSheet.getLastRow() > 1) {
    const logs = logsSheet.getDataRange().getValues();
    for (let i = 1; i < logs.length; i++) {
      // Date | Time | RFID UID | Register Number | Student Name | Status
      const logDate = Utilities.formatDate(new Date(logs[i][0]), "Asia/Kolkata", "yyyy-MM-dd");
      if (logDate === targetDate) {
        const uid = String(logs[i][2]).trim();
        const timeStr = logs[i][1] instanceof Date ? Utilities.formatDate(logs[i][1], "Asia/Kolkata", "hh:mm:ss a") : String(logs[i][1]);
        presentUids.set(uid, { time: timeStr, status: logs[i][5] || "Present" });
      }
    }
  }

  const students = [];
  for (let i = 1; i < studentData.length; i++) {
    const row = studentData[i];
    const uid = String(row[colUid !== -1 ? colUid : 4]).trim();
    const regNo = String(row[colReg !== -1 ? colReg : 0]).trim();
    const name = String(row[colName !== -1 ? colName : 1]).trim();
    const dept = String(row[colDept !== -1 ? colDept : 2]).trim();
    const year = String(row[colYear !== -1 ? colYear : 3]).trim();
    const total = Number(row[colTotal !== -1 ? colTotal : 5]) || 45;
    const attended = Number(row[colAttended !== -1 ? colAttended : 6]) || 0;

    const logInfo = presentUids.get(uid);
    const isPresent = Boolean(logInfo);
    const status = isPresent ? (logInfo.status || "Present") : "Absent";
    const time = isPresent ? logInfo.time : "—";

    students.push({
      registerNumber: regNo,
      name: name,
      department: dept,
      year: year,
      rfidUid: uid,
      attendanceDate: targetDate,
      attendanceTime: time,
      status: status,
      totalClasses: total,
      classesAttended: attended,
      percentage: total > 0 ? Math.round((attended / total) * 1000) / 10 : 0
    });
  }

  return createJsonResponse({
    status: "success",
    date: targetDate,
    totalCount: students.length,
    students: students
  });
}

function handleLogAttendance(uid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName(SHEET_STUDENTS);
  const logsSheet = ss.getSheetByName(SHEET_ATTENDANCE);

  if (!studentsSheet || !logsSheet) {
    return createJsonResponse({ status: "error", message: "Sheets not configured" }, 500);
  }

  const now = new Date();
  const dateStr = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd");
  const timeStr = Utilities.formatDate(now, "Asia/Kolkata", "hh:mm:ss a");

  // Find student by UID
  const studentData = studentsSheet.getDataRange().getValues();
  let studentName = "Unknown Student";
  let regNo = "N/A";
  let rowIndex = -1;

  for (let i = 1; i < studentData.length; i++) {
    if (String(studentData[i][4]).trim() === uid.trim()) {
      regNo = studentData[i][0];
      studentName = studentData[i][1];
      rowIndex = i + 1;
      break;
    }
  }

  // Prevent multiple punches within 5 minutes or append log
  logsSheet.appendRow([dateStr, timeStr, uid, regNo, studentName, "Present"]);

  // Optionally increment student attended count
  if (rowIndex > 1) {
    const attendedCell = studentsSheet.getRange(rowIndex, 7);
    const currentAttended = Number(attendedCell.getValue()) || 0;
    attendedCell.setValue(currentAttended + 1);
  }

  return createJsonResponse({
    status: "success",
    message: "Attendance recorded",
    student: { name: studentName, registerNumber: regNo, rfidUid: uid, time: timeStr }
  });
}

function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;

export const ESP32_ARDUINO_SNIPPET = `/*
  ESP32 with RC522 RFID to Google Sheets
  Pins RC522 to ESP32:
  SDA (SS) -> GPIO 5
  SCK      -> GPIO 18
  MOSI     -> GPIO 23
  MISO     -> GPIO 19
  RST      -> GPIO 22
  3.3V     -> 3.3V
  GND      -> GND
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Your Google Apps Script Web App URL
const String scriptUrl = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected! Ready to scan RFID cards.");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Read UID
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) uidStr += " ";
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  Serial.println("Card Scanned UID: " + uidStr);

  // Send to Google Apps Script
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // Follow redirect from Google Apps Script
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
    
    String url = scriptUrl + "?action=logAttendance&uid=" + uidStr;
    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending GET: " + String(httpCode));
    }
    http.end();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(2000); // Debounce
}
`;

export const EXPECTED_JSON_SCHEMA = `{
  "status": "success",
  "date": "2026-10-24",
  "totalCount": 10,
  "students": [
    {
      "name": "Alex Johnson",
      "registerNumber": "920121104001",
      "department": "Computer Science & Engineering",
      "year": "4th Year",
      "rfidUid": "E2 80 68 3A",
      "attendanceDate": "2026-10-24",
      "attendanceTime": "08:42:15 AM",
      "status": "Present",
      "classesAttended": 44,
      "totalClasses": 48,
      "percentage": 91.7
    }
  ]
}`;
