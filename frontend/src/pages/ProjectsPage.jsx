import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, CheckCircle, Circle, Clock } from 'lucide-react';
import { getProjects, archiveProject, createProject, getProjectTasks, addProjectTask, updateTaskStatus, generateProjectTasks, deleteProject } from '../services/plannerService';
import { Sparkles, Trash2, Archive, Inbox } from 'lucide-react';
import Modal from '../components/common/Modal';

const ProjectCard = ({ project, onTaskUpdate, isArchivedView }) => {
    const [expanded, setExpanded] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (expanded) {
            fetchTasks();
        }
    }, [expanded]);

    const fetchTasks = async () => {
        try {
            const res = await getProjectTasks(project._id);
            setTasks(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await addProjectTask(project._id, { title: newTaskTitle });
            setNewTaskTitle('');
            fetchTasks();
            onTaskUpdate(); // Refresh parent to update progress
        } catch (error) {
            console.error(error);
        }
    };

    const toggleTask = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await updateTaskStatus(task._id, { status: newStatus });
            fetchTasks();
            onTaskUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerateTasks = async () => {
        setIsGenerating(true);
        try {
            const res = await generateProjectTasks(project.title);
            const generatedTasks = res.data.tasks;

            // Add each task sequentially
            for (const taskTitle of generatedTasks) {
                await addProjectTask(project._id, { title: taskTitle });
            }

            fetchTasks();
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to generate tasks", error);
            alert("Could not generate tasks. Try a topic like 'Graph', 'Tree', or 'React'.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent toggling expansion
        if (window.confirm('Are you sure you want to delete this goal? This will remove all associated tasks.')) {
            try {
                await deleteProject(project._id);
                onTaskUpdate(); // Refresh parent list
            } catch (error) {
                console.error("Failed to delete project", error);
            }
        }
    };

    const handleArchive = async (e) => {
        e.stopPropagation();
        try {
            await archiveProject(project._id);
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to archive project", error);
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${project.isArchived ? 'opacity-75' : ''}`}>
            <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-blue-600">{project.progress}%</span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                                <div
                                    className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>

                        {!project.isArchived && project.progress === 100 && (
                            <button
                                onClick={handleArchive}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Archive Goal"
                            >
                                <Archive className="h-5 w-5" />
                            </button>
                        )}

                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Goal"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                        {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                    {!project.isArchived && (
                        <div className="mt-4 mb-4 flex justify-end">
                            <button
                                onClick={handleGenerateTasks}
                                disabled={isGenerating}
                                className={`flex items-center text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${isGenerating
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-purple-600 hover:text-purple-700 bg-purple-50 border-purple-100 hover:border-purple-200'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3 w-3 mr-1.5" />
                                        Auto-Generate Tasks (AI)
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    <div className="space-y-3 mt-4">
                        {tasks.map(task => (
                            <div
                                key={task._id}
                                className={`flex items-center p-3 bg-white rounded-lg border border-gray-200 transition-colors ${!project.isArchived ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                onClick={() => {
                                    if (!project.isArchived) toggleTask(task);
                                }}
                            >
                                <button
                                    type="button"
                                    className={`p-1 rounded-full mr-3 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'} ${project.isArchived ? 'cursor-default' : ''}`}
                                    disabled={project.isArchived}
                                >
                                    {task.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <span className={`${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {task.title}
                                </span>
                            </div>
                        ))}

                        {!project.isArchived && (
                            <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Add a task..."
                                    className="flex-1 rounded-lg border-gray-300 border p-2 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                                >
                                    Add
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', deadline: '' });

    useEffect(() => {
        fetchProjects();
    }, [showArchived]);

    const fetchProjects = async () => {
        try {
            const res = await getProjects(showArchived);
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createProject(newProject);
            setIsModalOpen(false);
            fetchProjects();
            setNewProject({ title: '', description: '', deadline: '' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setShowArchived(false)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Archived
                        </button>
                    </div>
                </div>
                {!showArchived && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
                    >
                        <Plus className="h-5 w-5 mr-1 sm:mr-2 flex-shrink-0" /> New Goal
                    </button>
                )}
            </div>

            <div className="grid gap-6">
                {projects.map(project => (
                    <ProjectCard
                        key={project._id}
                        project={project}
                        onTaskUpdate={fetchProjects}
                        isArchivedView={showArchived}
                    />
                ))}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        {showArchived ? <Archive className="h-6 w-6 text-gray-400" /> : <Inbox className="h-6 w-6 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {showArchived ? 'No archived goals' : 'No active goals'}
                    </h3>
                    <p className="text-gray-500 mt-1">
                        {showArchived
                            ? 'Goals you finish and archive will appear here.'
                            : 'Create a new goal to start tracking milestones!'}
                    </p>
                    {!showArchived && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" /> New Goal
                        </button>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Goal">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Deadline</label>
                        <input
                            type="date"
                            value={newProject.deadline}
                            onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div className="flex justify-center sm:justify-end pt-4">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Create Goal</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProjectsPage;
