const router = require('express').Router();
const { createAnnouncement, getAnnouncements } = require('../controllers/announcementController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/', protect, requireRole('teacher'), createAnnouncement);
router.get('/:classId', protect, getAnnouncements);

module.exports = router;
