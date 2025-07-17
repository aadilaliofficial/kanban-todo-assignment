const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  smartAssign,
} = require('../controllers/taskController');

const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, getTasks);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.post('/:id/smart-assign', authMiddleware, smartAssign);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const {
//   getTasks,
//   createTask,
//   updateTask,
//   deleteTask,
// } = require('../controllers/taskController');

// const { authMiddleware } = require('../middlewares/authMiddleware');

// router.get('/', authMiddleware, getTasks);
// router.post('/', authMiddleware, createTask);
// router.put('/:id', authMiddleware, updateTask);
// router.delete('/:id', authMiddleware, deleteTask);

// module.exports = router;

// const { smartAssign } = require('../controllers/taskController');

// router.post('/:id/smart-assign', authMiddleware, smartAssign);
