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
