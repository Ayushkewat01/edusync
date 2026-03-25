const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// POST /api/assignments - Create assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, classId, deadline, maxScore } = req.body;
    const assignment = await Assignment.create({
      title,
      description,
      classId,
      teacherId: req.user._id,
      deadline: new Date(deadline),
      maxScore: maxScore || 100
    });

    // Notify via socket
    if (req.app.get('io')) {
      req.app.get('io').to(classId).emit('new-assignment', {
        assignment,
        teacherName: req.user.name
      });
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/assignments/:classId - Get assignments for a class
exports.getAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ classId })
      .populate('teacherId', 'name')
      .sort({ deadline: 1 });

    // Enhance with submission counts if teacher
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({ assignmentId: a._id });
        const obj = a.toObject();
        obj.submissionCount = submissionCount;
        obj.isOverdue = new Date() > a.deadline;
        
        // Include user's own submission if requested
        if (req.user.role === 'student') {
          const mySubmission = await Submission.findOne({ assignmentId: a._id, studentId: req.user._id });
          obj.submissions = mySubmission ? [mySubmission] : [];
        }
        return obj;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/assignments - Get ALL assignments for the user's classes
exports.getMyAssignments = async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'teacher') {
      assignments = await Assignment.find({ teacherId: req.user._id })
        .populate('classId', 'name subject')
        .sort({ deadline: 1 });
    } else {
      // Get all classes for student
      const user = await require('../models/User').findById(req.user._id);
      assignments = await Assignment.find({ classId: { $in: user.classIds } })
        .populate('classId', 'name subject')
        .populate('teacherId', 'name')
        .sort({ deadline: 1 });
    }

    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const obj = a.toObject();
        obj.isOverdue = new Date() > a.deadline;
        // Make sure to attach the deadline property as dueDate for frontend compatibility if needed, though frontend currently uses dueDate and deadline interchangeably. Wait, frontend uses item.dueDate but model has deadline. Let's send dueDate alias.
        obj.dueDate = a.deadline;
        
        if (req.user.role === 'student') {
          const mySubmission = await Submission.findOne({ assignmentId: a._id, studentId: req.user._id });
          obj.submissions = mySubmission ? [mySubmission] : [];
        } else {
          obj.submissionCount = await Submission.countDocuments({ assignmentId: a._id });
        }
        return obj;
      })
    );
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/assignments/:id/submit - Submit assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { textContent } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const existing = await Submission.findOne({
      assignmentId: id,
      studentId: req.user._id
    });
    if (existing) return res.status(400).json({ message: 'Already submitted' });

    const isLate = new Date() > assignment.deadline;
    const submission = await Submission.create({
      assignmentId: id,
      studentId: req.user._id,
      textContent: textContent || '',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : '',
      status: isLate ? 'late' : 'submitted'
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/assignments/:id/submissions - Get submissions for an assignment
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate('studentId', 'name email');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/assignments/:id/grade - Grade a submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId, score, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { score, feedback, status: 'graded' },
      { new: true }
    );
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
