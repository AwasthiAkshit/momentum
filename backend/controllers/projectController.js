const asyncHandler = require('express-async-handler');
const ProjectGoal = require('../models/projectGoalModel');
const ProjectTask = require('../models/projectTaskModel');

// @desc    Get projects
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
    const isArchived = req.query.archived === 'true';
    const projects = await ProjectGoal.find({
        user: req.user.id,
        isArchived: isArchived
    });
    res.status(200).json(projects);
});

// @desc    Archive project
// @route   PUT /api/projects/:id/archive
// @access  Private
const archiveProject = asyncHandler(async (req, res) => {
    const project = await ProjectGoal.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (project.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    project.isArchived = true;
    await project.save();

    res.status(200).json(project);
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
    const { title, description, deadline } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Please add a title');
    }

    const project = await ProjectGoal.create({
        user: req.user.id,
        title,
        description,
        deadline
    });

    res.status(201).json(project);
});

// @desc    Get project tasks
// @route   GET /api/projects/:id/tasks
// @access  Private
const getProjectTasks = asyncHandler(async (req, res) => {
    const tasks = await ProjectTask.find({
        projectId: req.params.id,
        isArchived: { $ne: true }
    }).sort({ order: 1 });
    res.status(200).json(tasks);
});

// @desc    Add task to project
// @route   POST /api/projects/:id/tasks
// @access  Private
const addProjectTask = asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const { title, deadline } = req.body;

    const project = await ProjectGoal.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (project.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const task = await ProjectTask.create({
        projectId,
        user: req.user.id,
        title,
        deadline
    });

    await updateProjectProgress(projectId);

    res.status(201).json(task);
});

// @desc    Update task status
// @route   PUT /api/projects/tasks/:taskId
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const { status } = req.body;

    const task = await ProjectTask.findById(taskId);
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    task.status = status;
    await task.save();

    await updateProjectProgress(task.projectId);

    res.status(200).json(task);
});

// Helper to update progress
const updateProjectProgress = async (projectId) => {
    const tasks = await ProjectTask.find({ projectId });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const updateData = { progress };
    if (progress === 100) {
        updateData.status = 'completed';
    } else if (progress > 0) {
        // If it was already completed but now a task is unchecked, move back to in_progress
        const project = await ProjectGoal.findById(projectId);
        if (project && project.status === 'completed') {
            updateData.status = 'in_progress';
        }
    }

    await ProjectGoal.findByIdAndUpdate(projectId, updateData);
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
    const project = await ProjectGoal.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the project user
    if (project.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Soft delete vs Hard delete
    if (project.isArchived) {
        // If already archived, hard delete
        await ProjectTask.deleteMany({ projectId: req.params.id });
        await ProjectGoal.findByIdAndDelete(req.params.id);
    } else {
        // Soft delete: Archive all tasks associated with this project
        await ProjectTask.updateMany(
            { projectId: req.params.id },
            { isArchived: true }
        );

        // Soft delete the project
        project.isArchived = true;
        await project.save();
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getProjects,
    archiveProject,
    createProject,
    getProjectTasks,
    addProjectTask,
    updateTaskStatus,
    deleteProject
};
