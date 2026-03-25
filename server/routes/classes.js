const router = require('express').Router();
const { createClass, joinClass, getClasses, getClassById } = require('../controllers/classController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/', protect, requireRole('teacher'), createClass);
router.post('/join', protect, requireRole('student'), joinClass);
router.get('/', protect, getClasses);
router.get('/:id', protect, getClassById);

module.exports = router;
