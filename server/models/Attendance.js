const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  markedAt: { type: Date, default: Date.now },
  deviceFingerprint: { type: String, default: '' },
  ipAddress: { type: String, default: '' }
});

const attendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, default: Date.now },
  sessionToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  records: [attendanceRecordSchema],
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ classId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
