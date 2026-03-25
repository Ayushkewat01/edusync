const Class = require('../models/Class');
const User = require('../models/User');

// POST /api/classes - Create a class
exports.createClass = async (req, res) => {
  try {
    const { name, subject } = req.body;
    const classDoc = await Class.create({
      name,
      subject,
      teacherId: req.user._id
    });

    // Add class to teacher's classIds
    await User.findByIdAndUpdate(req.user._id, {
      $push: { classIds: classDoc._id }
    });

    res.status(201).json(classDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/classes/join - Student joins a class
exports.joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const classDoc = await Class.findOne({ joinCode: joinCode.toUpperCase() });

    if (!classDoc) {
      return res.status(404).json({ message: 'Invalid join code' });
    }

    if (classDoc.studentIds.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already in this class' });
    }

    classDoc.studentIds.push(req.user._id);
    await classDoc.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { classIds: classDoc._id }
    });

    res.json({ message: 'Joined class successfully', class: classDoc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classes - Get user's classes
exports.getClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacherId: req.user._id })
        .populate('studentIds', 'name email');
    } else {
      classes = await Class.find({ studentIds: req.user._id })
        .populate('teacherId', 'name email');
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classes/:id
exports.getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name email');
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    res.json(classDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
