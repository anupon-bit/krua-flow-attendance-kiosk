function wf2AttendanceRowsForRange_(sheet, dateColumn, startKey, endKey, width, fallbackTimestampColumn) {
  const lastRow = sheet ? sheet.getLastRow() : 0;
  if (!sheet || lastRow < 2) return [];

  const fallbackColumn = Number(fallbackTimestampColumn) || dateColumn;
  const firstColumn = Math.min(dateColumn, fallbackColumn);
  const scanWidth = Math.max(dateColumn, fallbackColumn) - firstColumn + 1;
  const dateValues = sheet.getRange(2, firstColumn, lastRow - 1, scanWidth).getValues();
  const matchingRows = [];

  for (let index = 0; index < dateValues.length; index++) {
    const primary = dateValues[index][dateColumn - firstColumn];
    const fallback = dateValues[index][fallbackColumn - firstColumn];
    const key = attendanceDateKey_(primary) || (fallback instanceof Date ? Utilities.formatDate(fallback, TZ, 'yyyy-MM-dd') : '');
    if (key >= startKey && key <= endKey) matchingRows.push(index + 2);
  }
  if (!matchingRows.length) return [];

  const groups = [];
  let groupStart = matchingRows[0], groupEnd = matchingRows[0];
  for (let index = 1; index < matchingRows.length; index++) {
    if (matchingRows[index] === groupEnd + 1) {
      groupEnd = matchingRows[index];
      continue;
    }
    groups.push([groupStart, groupEnd]);
    groupStart = groupEnd = matchingRows[index];
  }
  groups.push([groupStart, groupEnd]);

  const rows = [];
  groups.forEach(group => {
    sheet.getRange(group[0], 1, group[1] - group[0] + 1, width).getValues().forEach(row => {
      const primary = row[dateColumn - 1];
      const fallback = row[fallbackColumn - 1];
      const key = attendanceDateKey_(primary) || (fallback instanceof Date ? Utilities.formatDate(fallback, TZ, 'yyyy-MM-dd') : '');
      if (key >= startKey && key <= endKey) rows.push(row);
    });
  });
  return rows;
}

function wf2AttendanceKeys_(startKey, endKey) {
  const start = new Date(startKey + 'T00:00:00Z');
  const end = new Date(endKey + 'T00:00:00Z');
  const keys = [];
  for (let cursor = start; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10));
  }
  return keys;
}

function wf2AttendanceTimeText_(value) {
  return value instanceof Date ? Utilities.formatDate(value, TZ, 'HH:mm') : String(value || '');
}

function wf2AttendanceRowForDay_(id, employee, schedule, events, leaveIds, dateKey, now, shiftCache) {
  const ins = events.filter(event => event.kind === 'IN');
  const outs = events.filter(event => event.kind === 'OUT');
  const firstIn = ins[0] || null;
  const lastOut = outs.length ? outs[outs.length - 1] : null;
  const branchCode = String(employee.branch || (schedule && schedule.branchCode) || '');
  const departmentCode = String(employee.department || (schedule && schedule.departmentCode) || '');
  let shiftWindow = null;

  if (schedule) {
    const key = dateKey + '|' + schedule.shiftCode;
    if (!Object.prototype.hasOwnProperty.call(shiftCache, key)) {
      try {
        shiftCache[key] = shiftWindowV7_(dateKey, schedule.shiftCode);
      } catch (error) {
        shiftCache[key] = null;
      }
    }
    shiftWindow = shiftCache[key];
  }

  let status = 'NORMAL', lateMinutes = 0;
  if (leaveIds.has(id)) status = 'LEAVE';
  else if (!schedule && events.length) status = 'UNPLANNED';
  else if (schedule && !firstIn) status = shiftWindow && now > shiftWindow.end ? 'ABSENT' : 'NOT_CHECKED_IN';
  else if (schedule && firstIn) {
    const grace = shiftWindow ? Number(shiftWindow.shift.lateGraceMinutes) || 0 : 0;
    if (shiftWindow && firstIn.timestamp.getTime() > shiftWindow.start.getTime() + grace * 60000) {
      status = 'LATE';
      lateMinutes = Math.max(0, Math.floor((firstIn.timestamp.getTime() - shiftWindow.start.getTime()) / 60000));
    }
    if (!lastOut && shiftWindow && now > shiftWindow.end) status = 'NO_CHECK_OUT';
  }

  const workedMinutes = firstIn && lastOut && lastOut.timestamp > firstIn.timestamp ? Math.floor((lastOut.timestamp - firstIn.timestamp) / 60000) : 0;
  const standardMinutes = shiftWindow ? (Number(shiftWindow.shift.standardHours) || 0) * 60 : 0;
  const overtimeMinutes = Math.max(0, workedMinutes - standardMinutes);
  const verified = event => Boolean(event && event.photoFileId && String(event.status || '').toUpperCase() === 'VERIFIED_PHOTO');

  return {
    date: dateKey,
    employeeId: id,
    employeeName: String(employee.name || (schedule && schedule.employeeName) || ''),
    nickname: String(employee.nickname || ''),
    branchCode: branchCode,
    departmentCode: departmentCode,
    shiftCode: schedule ? String(schedule.shiftCode) : '',
    scheduledShift: schedule ? wf2AttendanceTimeText_(schedule.startTime) + '–' + wf2AttendanceTimeText_(schedule.endTime) : '-',
    expected: Boolean(schedule),
    checkIn: firstIn ? Utilities.formatDate(firstIn.timestamp, TZ, 'HH:mm') : '',
    checkOut: lastOut ? Utilities.formatDate(lastOut.timestamp, TZ, 'HH:mm') : '',
    workedHours: Math.round(workedMinutes / 6) / 10,
    lateMinutes: lateMinutes,
    otHours: Math.round(overtimeMinutes / 6) / 10,
    status: status,
    checkInPhotoFileId: firstIn ? firstIn.photoFileId : '',
    checkOutPhotoFileId: lastOut ? lastOut.photoFileId : '',
    checkInPhotoVerified: verified(firstIn),
    checkOutPhotoVerified: verified(lastOut)
  };
}

function wf2AdminAttendanceRange_(payload) {
  const startKey = String(payload.startDate || payload.date || '');
  const endKey = String(payload.endDate || payload.date || payload.startDate || '');
  if (!parseIsoDate_(startKey) || !parseIsoDate_(endKey) || endKey < startKey) throw new Error('ช่วงวันที่ไม่ถูกต้อง');
  const keys = wf2AttendanceKeys_(startKey, endKey);
  if (keys.length > 31) throw new Error('เลือกช่วงเวลาได้ไม่เกิน 31 วัน');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const employees = getEmployeesAdmin_();
  const employeeMap = {};
  employees.forEach(employee => { employeeMap[employee.id] = employee; });
  const published = new Set(scheduleVersionRowsV7_().filter(version => version.status === 'PUBLISHED').map(version => version.versionId));
  const scheduleSheet = ss.getSheetByName(WORK_SCHEDULES_SHEET);
  const scheduleWidth = scheduleSheet ? Math.min(17, scheduleSheet.getLastColumn()) : 0;
  const scheduledByDay = {};

  if (scheduleWidth >= 12) {
    wf2AttendanceRowsForRange_(scheduleSheet, 4, startKey, endKey, scheduleWidth, 4).forEach(row => {
      if (!published.has(String(row[1]))) return;
      const workStatus = String(row[9] || 'WORK').toUpperCase();
      if (['OFF', 'LEAVE', 'WEEKLY_OFF'].indexOf(workStatus) >= 0) return;
      const dateKey = attendanceDateKey_(row[3]);
      const employeeId = String(row[4] || '');
      if (!dateKey || !employeeId) return;
      const byEmployee = scheduledByDay[dateKey] || (scheduledByDay[dateKey] = {});
      byEmployee[employeeId] = {
        employeeId: employeeId,
        employeeName: String(row[5] || ''),
        branchCode: String(row[6] || ''),
        departmentCode: String(row[7] || ''),
        shiftCode: String(row[8] || ''),
        startTime: row[10],
        endTime: row[11]
      };
    });
  }

  const eventByDay = {};
  const attendanceSheet = ss.getSheetByName(ATTENDANCE_SHEET);
  const attendanceWidth = attendanceSheet ? Math.min(19, attendanceSheet.getLastColumn()) : 0;
  if (attendanceWidth >= 12) {
    wf2AttendanceRowsForRange_(attendanceSheet, 3, startKey, endKey, attendanceWidth, 2).forEach(row => {
      const timestamp = row[1] instanceof Date ? row[1] : null;
      const dateKey = attendanceDateKey_(row[2]) || (timestamp ? Utilities.formatDate(timestamp, TZ, 'yyyy-MM-dd') : '');
      const employeeId = String(row[4] || '');
      const status = String(row[11] || '');
      if (!timestamp || !dateKey || !employeeId || status.indexOf('VOID') === 0) return;
      const byEmployee = eventByDay[dateKey] || (eventByDay[dateKey] = {});
      (byEmployee[employeeId] || (byEmployee[employeeId] = [])).push({
        timestamp: timestamp,
        action: String(row[6] || ''),
        kind: actionKindServer_(row[6]),
        status: status,
        photoUrl: String(row[8] || ''),
        photoFileId: String(row[9] || '')
      });
    });
  }
  Object.keys(eventByDay).forEach(dateKey => {
    Object.keys(eventByDay[dateKey]).forEach(employeeId => eventByDay[dateKey][employeeId].sort((a, b) => a.timestamp - b.timestamp));
  });

  const leaveByDay = {};
  const leaveSheet = ss.getSheetByName(LEAVE_SHEET);
  const leaveLast = leaveSheet ? leaveSheet.getLastRow() : 0;
  if (leaveSheet && leaveLast >= 2 && leaveSheet.getLastColumn() >= 9) {
    const leaveCount = leaveLast - 1;
    const leaveStatusEmployees = leaveSheet.getRange(2, 3, leaveCount, 2).getValues();
    const leaveDateRanges = leaveSheet.getRange(2, 8, leaveCount, 2).getValues();
    for (let index = 0; index < leaveCount; index++) {
      if (String(leaveStatusEmployees[index][0]) !== 'APPROVED') continue;
      const leaveStart = attendanceDateKey_(leaveDateRanges[index][0]);
      const leaveEnd = attendanceDateKey_(leaveDateRanges[index][1]);
      const employeeId = String(leaveStatusEmployees[index][1] || '');
      if (!leaveStart || !leaveEnd || !employeeId) continue;
      keys.forEach(dateKey => {
        if (dateKey >= leaveStart && dateKey <= leaveEnd) {
          (leaveByDay[dateKey] || (leaveByDay[dateKey] = new Set())).add(employeeId);
        }
      });
    }
  }

  const now = new Date(), shiftCache = {}, rows = [];
  keys.forEach(dateKey => {
    const scheduled = scheduledByDay[dateKey] || {};
    const events = eventByDay[dateKey] || {};
    const leaveIds = leaveByDay[dateKey] || new Set();
    const ids = new Set(Object.keys(scheduled).concat(Object.keys(events), Array.from(leaveIds)));
    ids.forEach(employeeId => {
      rows.push(wf2AttendanceRowForDay_(employeeId, employeeMap[employeeId] || {}, scheduled[employeeId] || null, events[employeeId] || [], leaveIds, dateKey, now, shiftCache));
    });
  });
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName, 'th'));

  const employeeId = String(payload.employeeId || ''), branch = String(payload.branchCode || ''), department = String(payload.departmentCode || '');
  const query = String(payload.employeeQuery || '').trim().toLowerCase(), statusFilter = String(payload.status || '');
  const scoped = rows.filter(row => (!employeeId || row.employeeId === employeeId) && (!branch || row.branchCode === branch) && (!department || row.departmentCode === department) && (!query || (row.employeeId + ' ' + row.employeeName + ' ' + row.nickname).toLowerCase().indexOf(query) >= 0));
  const summary = {
    expected: scoped.filter(row => row.expected).length,
    present: scoped.filter(row => row.checkIn).length,
    notCheckedIn: scoped.filter(row => row.status === 'NOT_CHECKED_IN').length,
    leave: scoped.filter(row => row.status === 'LEAVE').length,
    absent: scoped.filter(row => row.status === 'ABSENT').length,
    late: scoped.filter(row => row.status === 'LATE').length,
    noCheckOut: scoped.filter(row => row.status === 'NO_CHECK_OUT').length,
    unplanned: scoped.filter(row => row.status === 'UNPLANNED').length,
    ot: Math.round(scoped.reduce((sum, row) => sum + (Number(row.otHours) || 0), 0) * 10) / 10
  };
  const filtered = statusFilter ? scoped.filter(row => row.status === statusFilter) : scoped;
  const limit = 5000;
  return {
    startDate: startKey,
    endDate: endKey,
    summary: summary,
    rows: filtered.slice(0, limit),
    total: filtered.length,
    truncated: filtered.length > limit,
    employees: employees.filter(employee => employee.active).map(employee => ({
      employeeId: employee.id,
      name: employee.name,
      nickname: employee.nickname,
      branchCode: employee.branch,
      departmentCode: employee.department
    })),
    serverEpochMs: Date.now()
  };
}
