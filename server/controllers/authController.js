const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Class = require('../models/Class');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, joinCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, role });

    // If student provides a join code, add them to the class
    if (role === 'student' && joinCode) {
      const classDoc = await Class.findOne({ joinCode: joinCode.toUpperCase() });
      if (classDoc) {
        classDoc.studentIds.push(user._id);
        await classDoc.save();
        user.classIds.push(classDoc._id);
        await user.save();
      }
    }

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('classIds');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
