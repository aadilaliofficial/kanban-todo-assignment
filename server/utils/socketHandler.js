const Task = require('../models/Task');
const ActionLog = require('../models/ActionLog');
const User = require('../models/User');

const connectedUsers = new Map();

exports.socketHandler = (socket, io) => {
  console.log('User connected:', socket.id);

  // Optional: handle user login tracking
  socket.on('user-connected', (userId) => {
    connectedUsers.set(socket.id, userId);
  });

  // Broadcast task creation
  socket.on('create-task', async (taskData) => {
    const task = await Task.create(taskData);
    const userId = connectedUsers.get(socket.id);
    await ActionLog.create({ action: 'Created Task (Live)', taskId: task._id, performedBy: userId });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');
    io.emit('task-created', populatedTask); // broadcast to all
  });

  // Broadcast task update
  socket.on('update-task', async ({ taskId, updatedFields }) => {
    const task = await Task.findById(taskId);
    const now = new Date();

    // Optional: conflict handling
    const diff = now - task.lastEditedAt;
    if (diff < 5000) {
      socket.emit('conflict', { existing: task });
      return;
    }

    task.set({ ...updatedFields, lastEditedAt: now });
    await task.save();

    const userId = connectedUsers.get(socket.id);
    await ActionLog.create({ action: 'Updated Task (Live)', taskId, performedBy: userId });

    const updatedTask = await Task.findById(taskId).populate('assignedTo', 'name');
    io.emit('task-updated', updatedTask);
  });

  // Broadcast task delete
  socket.on('delete-task', async (taskId) => {
    await Task.findByIdAndDelete(taskId);

    const userId = connectedUsers.get(socket.id);
    await ActionLog.create({ action: 'Deleted Task (Live)', taskId, performedBy: userId });

    io.emit('task-deleted', taskId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
};
