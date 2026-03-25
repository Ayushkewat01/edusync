const router = require('express').Router();
const { generateQR, markAttendance, getAttendance, getStats } = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/generate-qr', protect, requireRole('teacher'), generateQR);
router.post('/mark', protect, requireRole('student'), markAttendance);
router.get('/stats/:classId', protect, getStats);
router.get('/:classId', protect, getAttendance);

module.exports = router;
