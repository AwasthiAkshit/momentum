import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import {
    Plus,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    Trash2,
    Edit2
} from 'lucide-react';
import clsx from 'clsx';

const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goalId: '',
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: 30,
        dueDate: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, goalsRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/goals')
            ]);
            setTasks(tasksRes.data);
            setGoals(goalsRes.data);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (task = null) => {
        if (task) {
            setCurrentTask(task);
            setFormData({
                title: task.title,
                description: task.description || '',
                goalId: task.goalId || '',
                priority: task.priority,
                difficulty: task.difficulty,
                estimatedTime: task.estimatedTime || 30,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            });
        } else {
            setCurrentTask(null);
            setFormData({
                title: '',
                description: '',
                goalId: '',
                priority: 'medium',
                difficulty: 'medium',
                estimatedTime: 30,
                dueDate: new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTask(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentTask) {
                const { data } = await api.put(`/tasks/${currentTask._id}`, formData);
                setTasks(tasks.map(t => (t._id === currentTask._id ? data : t)));
            } else {
                const { data } = await api.post('/tasks', formData);
                setTasks([...tasks, data]);
            }
            handleCloseModal();
        } catch (err) {
            console.error(err);
            alert('Failed to save task');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/tasks/${id}`);
                setTasks(tasks.filter(t => t._id !== id));
            } catch (err) {
                alert('Failed to delete task');
            }
        }
    };

    const handleMarkDone = async (id) => {
        try {
            const taskToUpdate = tasks.find(t => t._id === id);
            const newStatus = taskToUpdate.status === 'completed' ? 'pending' : 'completed';

            const { data } = await api.put(`/tasks/${id}`, {
                status: newStatus
            });

            setTasks(tasks.map(t => t._id === id ? data : t));
        } catch (err) {
            alert('Failed to update task status');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-700 bg-red-50 border-red-100';
            case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
            case 'low': return 'text-green-700 bg-green-50 border-green-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredTasks = filter === 'All' ? tasks : tasks.filter(t =>
        filter === 'Done' ? t.status === 'completed' : t.status === 'pending'
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Planner</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your daily tasks and assignments.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <Button variant="outline" onClick={() => setFilter('All')}>All</Button>
                    <Button variant="outline" onClick={() => setFilter('Todo')}>Pending</Button>
                    <Button variant="outline" onClick={() => setFilter('Done')}>Completed</Button>
                    <Button className="flex items-center" onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                </div>
            </div>

            {loading ? <div className="text-center">Loading tasks...</div> : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks.map((task) => (
                        <div key={task._id} className="bg-white shadow rounded-lg p-5 border border-gray-100 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-3">
                                <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', getPriorityColor(task.priority))}>
                                    {task.priority}
                                </span>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 text-gray-400 hover:text-blue-500" onClick={() => handleOpenModal(task)}>
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button className="p-1 text-gray-400 hover:text-red-500" onClick={() => handleDelete(task._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>

                            {task.goalId && (
                                <div className="mb-3">
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                                        Goal: {goals.find(g => g._id === task.goalId)?.title || 'Linked Goal'}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    Est. Time: {task.estimatedTime || 0}m
                                </div>
                                <div className="flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                                    Difficulty: {task.difficulty}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusColor(task.status))}>
                                    {task.status}
                                </span>

                                <button
                                    onClick={() => handleMarkDone(task._id)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    {task.status === 'completed' ? 'Mark Pending' : 'Mark Done'}
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentTask ? 'Edit Task' : 'Add New Task'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Link to Goal (Optional)</label>
                        <select
                            name="goalId"
                            value={formData.goalId}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        >
                            <option value="">-- None --</option>
                            {goals.map(goal => (
                                <option key={goal._id} value={goal._id}>{goal.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Est. Time (mins)</label>
                            <input
                                type="number"
                                name="estimatedTime"
                                value={formData.estimatedTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={handleCloseModal} className="mr-2">
                            Cancel
                        </Button>
                        <Button type="submit">
                            {currentTask ? 'Update Task' : 'Add Task'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TasksPage;
