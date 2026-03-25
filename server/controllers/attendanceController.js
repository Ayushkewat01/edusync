const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// POST /api/attendance/generate-qr - Teacher generates QR session
exports.generateQR = async (req, res) => {
  try {
    const { classId } = req.body;
    // Shorten UUID to 8 characters for easier manual entry
    const sessionToken = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    const attendance = await Attendance.create({
      classId,
      sessionToken,
      expiresAt,
      date: new Date(),
      records: []
    });

    res.json({
      sessionToken,
      expiresAt,
      attendanceId: attendance._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/attendance/mark - Student marks attendance
exports.markAttendance = async (req, res) => {
  try {
    const { sessionToken, deviceFingerprint } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const attendance = await Attendance.findOne({ sessionToken });

    if (!attendance) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (new Date() > attendance.expiresAt) {
      return res.status(400).json({ message: 'QR code has expired. Ask teacher to generate a new one.' });
    }

    // Check if student already marked
    const alreadyMarked = attendance.records.find(
      r => r.studentId.toString() === req.user._id.toString()
    );
    if (alreadyMarked) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Anti-proxy: Check for duplicate device fingerprints
    const duplicateDevice = attendance.records.find(
      r => r.deviceFingerprint === deviceFingerprint && deviceFingerprint !== ''
    );

    const record = {
      studentId: req.user._id,
      status: 'present',
      markedAt: new Date(),
      deviceFingerprint: deviceFingerprint || '',
      ipAddress
    };

    attendance.records.push(record);
    await attendance.save();

    const warning = duplicateDevice
      ? '⚠️ Warning: Same device detected for multiple students!'
      : null;

    // Emit via socket if available
    if (req.app.get('io')) {
      req.app.get('io').to(attendance.classId.toString()).emit('attendance-update', {
        studentId: req.user._id,
        studentName: req.user.name,
        status: 'present',
        warning
      });
    }

    res.json({ message: 'Attendance marked successfully', warning });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/:classId - Get attendance records
exports.getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { classId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(query)
      .populate('records.studentId', 'name email')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/stats/:classId - Get stats
exports.getStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const totalStudents = classDoc.studentIds.length;

    // Last 7 days attendance
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const records = await Attendance.find({
      classId,
      date: { $gte: sevenDaysAgo }
    });

    const dailyStats = records.map(r => ({
      date: r.date,
      present: r.records.filter(rec => rec.status === 'present').length,
      total: totalStudents,
      percentage: totalStudents > 0
        ? Math.round((r.records.filter(rec => rec.status === 'present').length / totalStudents) * 100)
        : 0
    }));

    // Per-student attendance percentage
    const allRecords = await Attendance.find({ classId });
    const totalSessions = allRecords.length;
    const studentStats = {};

    allRecords.forEach(att => {
      att.records.forEach(rec => {
        const sid = rec.studentId.toString();
        if (!studentStats[sid]) studentStats[sid] = 0;
        if (rec.status === 'present') studentStats[sid]++;
      });
    });

    // At-risk students (below 75%)
    const atRisk = Object.entries(studentStats)
      .filter(([, count]) => totalSessions > 0 && (count / totalSessions) * 100 < 75)
      .map(([studentId, count]) => ({
        studentId,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
      }));

    res.json({
      totalStudents,
      totalSessions,
      dailyStats,
      atRisk
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/my-stats - Get aggregate stats for user's dashboards (Teacher & Student)
exports.getMyStats = async (req, res) => {
  try {
    const User = require('../models/User');
    let classes;
    
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacherId: req.user._id });
    } else {
      const user = await User.findById(req.user._id);
      classes = await Class.find({ _id: { $in: user?.classIds || [] } });
    }

    const classIds = classes.map(c => c._id);
    const totalStudents = classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0);

    // Get attendance records from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const records = await Attendance.find({
      classId: { $in: classIds },
      date: { $gte: sevenDaysAgo }
    }).populate('records.studentId', 'name');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyDataMap = {};
    
    // Initialize array of last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        weeklyDataMap[d.toDateString()] = { day: days[d.getDay()], present: 0, total: 0 };
    }

    if (req.user.role === 'teacher') {
      const studentMap = {}; // Tracks attendance for at-risk

      records.forEach(r => {
         const dateStr = new Date(r.date).toDateString();
         if (!weeklyDataMap[dateStr]) weeklyDataMap[dateStr] = { day: days[new Date(r.date).getDay()], present: 0, total: 0 };
         
         const classDoc = classes.find(c => c._id.toString() === r.classId.toString());
         const classTotal = classDoc ? classDoc.studentIds.length : 0;
         
         const presentCount = r.records.filter(rec => rec.status === 'present').length;
         
         weeklyDataMap[dateStr].present += presentCount;
         weeklyDataMap[dateStr].total += classTotal;

         // For at-risk calculation
         if (classDoc) {
             classDoc.studentIds.forEach(sid => {
                 const sstr = sid.toString();
                 if (!studentMap[sstr]) studentMap[sstr] = { name: 'Unknown', sessionsExpected: 0, presentCount: 0 };
                 studentMap[sstr].sessionsExpected++;
             });
         }
         r.records.forEach(rec => {
            const sstr = rec.studentId._id ? rec.studentId._id.toString() : rec.studentId.toString();
            if (studentMap[sstr] && rec.status === 'present') {
                studentMap[sstr].presentCount++;
                studentMap[sstr].name = rec.studentId.name || 'Unknown';
            }
         });
      });

      const weeklyData = Object.values(weeklyDataMap).map(d => ({
         day: d.day,
         attendance: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      })).slice(-5);

      const todayStr = new Date().toDateString();
      const todayData = weeklyDataMap[todayStr];
      const todayAttendance = (todayData && todayData.total > 0) ? Math.round((todayData.present / todayData.total) * 100) : 0;

      const atRisk = Object.values(studentMap)
        .filter(s => s.sessionsExpected > 0 && (s.presentCount / s.sessionsExpected) * 100 < 80)
        .map(s => ({
            name: s.name,
            attendance: Math.round((s.presentCount / s.sessionsExpected) * 100),
            trend: 'down'
        })).slice(0, 5);

      res.json({
        totalStudents,
        todayAttendance,
        weeklyData,
        atRisk
      });
    } else {
      // Student logic
      let myTotalSessions = 0;
      let myPresentCount = 0;

      records.forEach(r => {
         const dateStr = new Date(r.date).toDateString();
         if (!weeklyDataMap[dateStr]) weeklyDataMap[dateStr] = { day: days[new Date(r.date).getDay()], present: 0, total: 0 };
         
         myTotalSessions++;
         const myRecord = r.records.find(rec => rec.studentId._id.toString() === req.user._id.toString());
         if (myRecord && myRecord.status === 'present') {
             myPresentCount++;
             weeklyDataMap[dateStr].present += 1;
         }
         weeklyDataMap[dateStr].total += 1;
      });

      const weeklyData = Object.values(weeklyDataMap).map(d => ({
         name: d.day,
         score: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      })).slice(-5);

      const attendancePercentage = myTotalSessions > 0 ? Math.round((myPresentCount / myTotalSessions) * 100) : 0;

      res.json({
        attendancePercentage,
        weeklyScores: weeklyData,
        attendanceData: [
           { name: 'Present', value: attendancePercentage },
           { name: 'Absent', value: 100 - attendancePercentage }
        ]
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
