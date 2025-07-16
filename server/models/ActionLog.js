const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  action: String,
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActionLog', actionLogSchema);
