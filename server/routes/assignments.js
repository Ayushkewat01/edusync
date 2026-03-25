const router = require('express').Router();
const { createAssignment, getAssignments, submitAssignment, getSubmissions, gradeSubmission, getMyAssignments } = require('../controllers/assignmentController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/', protect, requireRole('teacher'), createAssignment);
router.get('/', protect, getMyAssignments);
router.get('/:classId', protect, getAssignments);
router.post('/:id/submit', protect, requireRole('student'), submitAssignment);
router.get('/:id/submissions', protect, requireRole('teacher'), getSubmissions);
router.patch('/:id/grade', protect, requireRole('teacher'), gradeSubmission);

module.exports = router;
