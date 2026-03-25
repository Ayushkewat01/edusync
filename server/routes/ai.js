const router = require('express').Router();
const { generateQuiz, summarize } = require('../controllers/aiController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/generate-quiz', protect, requireRole('teacher'), generateQuiz);
router.post('/summarize', protect, summarize);

module.exports = router;
