const Task = require('../models/Task');
const ActionLog = require('../models/ActionLog');

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
    const now = new Date();

    // Check for conflict
    const diff = now - task.lastEditedAt;
    if (diff < 5000) return res.status(409).json({ conflict: true, existing: task });

    task.set({ ...req.body, lastEditedAt: now });
    await task.save();

    await ActionLog.create({
      action: 'Updated Task',
      taskId: task._id,
      performedBy: req.userId,
    });

    res.json(task);
  } catch {
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

const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

exports.smartAssign = async (req, res) => {
  try {
    // Count active tasks per user
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
    const assignedUserIds = counts.map((c) => c._id.toString());

    // Find user with 0 tasks
    const unassignedUser = users.find((u) => !assignedUserIds.includes(u._id.toString()));
    let chosenUser;

    if (unassignedUser) {
      chosenUser = unassignedUser;
    } else {
      // Choose user with lowest count
      const userId = counts[0]._id;
      chosenUser = await User.findById(userId);
    }

    // Assign task
    const task = await Task.findById(req.params.id);
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
    res.status(500).json({ error: 'Smart assign failed' });
  }
};
