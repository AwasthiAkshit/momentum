const express = require('express');
const router = express.Router();
const { getProjects, archiveProject, createProject, getProjectTasks, addProjectTask, updateTaskStatus, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProjects).post(protect, createProject);
router.route('/:id').delete(protect, deleteProject);
router.route('/:id/archive').put(protect, archiveProject);
router.route('/:id/tasks').get(protect, getProjectTasks).post(protect, addProjectTask);
router.route('/tasks/:taskId').put(protect, updateTaskStatus);

module.exports = router;
