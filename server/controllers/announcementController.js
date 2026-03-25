const Announcement = require('../models/Announcement');

// POST /api/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { classId, title, message, priority } = req.body;
    const announcement = await Announcement.create({
      classId,
      teacherId: req.user._id,
      title,
      message,
      priority: priority || 'normal'
    });

    await announcement.populate('teacherId', 'name');

    // Emit real-time notification
    if (req.app.get('io')) {
      req.app.get('io').to(classId).emit('new-announcement', {
        announcement,
        teacherName: req.user.name
      });
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/announcements/:classId
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ classId: req.params.classId })
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
