const User = require('../models/User');
const ActionLog = require('../models/ActionLog');
const Task = require('../models/Task');

// Aapko apna socket server instance import karna hoga yahan
// Agar aap socket ko Express app ke sath globally setup karte ho to uska reference yahan le sakte ho
// For example:
// const io = require('../socket');  // apni socket instance ka path yahan adjust karo

exports.getTasks = async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'name');
  res.json(tasks);
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    await ActionLog.create({
      action: 'Created Task',
      taskId: task._id,
      performedBy: req.userId,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Task title must be unique' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const now = new Date();

    // Check for conflict - prevent updates if edited in last 5 seconds
    const diff = now - task.lastEditedAt;
    if (diff < 5000)
      return res.status(409).json({ conflict: true, existing: task });

    task.set({ ...req.body, lastEditedAt: now });
    await task.save();

    await ActionLog.create({
      action: 'Updated Task',
      taskId: task._id,
      performedBy: req.userId,
    });

    // Example: emit socket event here (adjust according to your socket setup)
    // if (io) {
    //   io.emit('task-updated', task);
    // }

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(400).json({ error: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  await ActionLog.create({
    action: 'Deleted Task',
    taskId: req.params.id,
    performedBy: req.userId,
  });
  res.json({ message: 'Task deleted' });
};

exports.smartAssign = async (req, res) => {
  try {
    const counts = await Task.aggregate([
      {
        $match: { status: { $in: ['Todo', 'In Progress'] }, assignedTo: { $ne: null } },
      },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: 1 } },
    ]);

    const users = await User.find();
    if (!users.length)
      return res.status(400).json({ error: 'No users found for assignment' });

    const assignedUserIds = counts.map((c) => c._id.toString());

    const unassignedUser = users.find(
      (u) => !assignedUserIds.includes(u._id.toString())
    );

    let chosenUser;

    if (unassignedUser) {
      chosenUser = unassignedUser;
    } else if (counts.length > 0) {
      const userId = counts[0]._id;
      chosenUser = await User.findById(userId);
    } else {
      chosenUser = users[0]; // fallback to first user
    }

    if (!chosenUser)
      return res.status(400).json({ error: 'No user available to assign task' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.assignedTo = chosenUser._id;
    await task.save();

    await ActionLog.create({
      action: 'Smart Assigned Task',
      taskId: task._id,
      performedBy: req.userId,
    });

    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    res.json(updatedTask);
  } catch (err) {
    console.error('Smart assign error:', err);
    res.status(500).json({ error: 'Smart assign failed' });
  }
};
