import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import Modal from '../components/common/Modal';
import Calendar from '../components/common/Calendar'; // Task History
import GoalCalendar from '../components/common/GoalCalendar'; // NEW: Goal Daily Logs
import { Plus, Flag, ChevronDown, ChevronUp, Trash2, Edit2, CheckCircle, Circle, Repeat, Calendar as CalendarIcon, Clock, Target, Activity } from 'lucide-react';
import clsx from 'clsx';

const GoalsPage = () => {
    const [goals, setGoals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(null);
    const [expandedTaskIds, setExpandedTaskIds] = useState([]);

    // Store logs for goals: { [goalId]: [logs] }
    const [goalLogs, setGoalLogs] = useState({});

    const [goalFormData, setGoalFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 30, // Default 30 days
        priority: 'medium',
        type: 'project',
    });

    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        goalId: '',
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: 30,
        dueDate: '',
        frequency: 'once',
    });

    const [hasDueDate, setHasDueDate] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsRes, tasksRes] = await Promise.all([
                api.get('/goals'),
                api.get('/tasks')
            ]);
            setGoals(goalsRes.data.map(g => ({ ...g, expanded: false })));
            setTasks(tasksRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGoalLogs = async (goalId) => {
        try {
            const { data } = await api.get(`/goals/${goalId}/calendar`);
            setGoalLogs(prev => ({ ...prev, [goalId]: data }));
        } catch (err) {
            console.error("Failed to fetch logs", err);
        }
    };

    const handleOpenGoalModal = (goal = null) => {
        if (goal) {
            setCurrentGoal(goal);
            setGoalFormData({
                title: goal.title,
                description: goal.description || '',
                deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
                startDate: goal.startDate ? goal.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                durationDays: goal.durationDays || 30,
                priority: goal.priority,
                type: goal.type || 'project',
            });
        } else {
            setCurrentGoal(null);
            setGoalFormData({
                title: '',
                description: '',
                deadline: '',
                startDate: new Date().toISOString().split('T')[0],
                durationDays: 30,
                priority: 'medium',
                type: 'project',
            });
        }
        setIsGoalModalOpen(true);
    };

    const handleCloseGoalModal = () => {
        setIsGoalModalOpen(false);
        setCurrentGoal(null);
    };

    const handleGoalChange = (e) => {
        setGoalFormData({ ...goalFormData, [e.target.name]: e.target.value });
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentGoal) {
                const { data } = await api.put(`/goals/${currentGoal._id}`, goalFormData);
                setGoals(goals.map(g => (g._id === currentGoal._id ? { ...data, expanded: g.expanded } : g)));
            } else {
                const { data } = await api.post('/goals', goalFormData);
                setGoals([...goals, { ...data, expanded: false }]);
            }
            handleCloseGoalModal();
        } catch (err) {
            console.error(err);
            alert('Failed to save goal');
        }
    };

    const handleDeleteGoal = async (id) => {
        if (window.confirm('Delete this goal and all its tasks?')) {
            try {
                await api.delete(`/goals/${id}`);
                setGoals(goals.filter(g => g._id !== id));
            } catch (err) {
                alert('Failed to delete goal');
            }
        }
    };

    const toggleExpand = (id) => {
        const goal = goals.find(g => g._id === id);
        if (!goal.expanded && goal.type === 'habit') {
            fetchGoalLogs(id);
        }

        setGoals(goals.map(g =>
            g._id === id ? { ...g, expanded: !g.expanded } : g
        ));
    };

    // --- Task Handlers --- (Same as before)
    const handleOpenTaskModal = (goalId) => {
        setTaskFormData({
            title: '',
            description: '',
            goalId: goalId,
            priority: 'medium',
            difficulty: 'medium',
            estimatedTime: 30,
            dueDate: '',
            frequency: 'once',
        });
        setHasDueDate(false);
        setIsTaskModalOpen(true);
    };

    const handleTaskChange = (e) => {
        setTaskFormData({ ...taskFormData, [e.target.name]: e.target.value });
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...taskFormData };
            if (!hasDueDate) payload.dueDate = null;

            const { data } = await api.post('/tasks', payload);
            setTasks([...tasks, data]);
            fetchData(); // Sync everything
            setIsTaskModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save task');
        }
    };

    const handleToggleTaskStatus = async (task, e) => {
        e.stopPropagation();
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const { data } = await api.put(`/tasks/${task._id}`, { status: newStatus });

            setTasks(tasks.map(t => t._id === task._id ? data : t));

            // Re-fetch goals to update progress & logs
            const goalsRes = await api.get('/goals');
            const expandedIds = goals.filter(g => g.expanded).map(g => g._id);
            setGoals(goalsRes.data.map(g => ({ ...g, expanded: expandedIds.includes(g._id) })));

            if (task.goalId) fetchGoalLogs(task.goalId);

        } catch (err) {
            console.error(err);
            alert('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId, goalId) => {
        if (window.confirm('Delete this task?')) {
            try {
                await api.delete(`/tasks/${taskId}`);
                setTasks(tasks.filter(t => t._id !== taskId));
                // Sync
                fetchData();
            } catch (err) {
                alert('Failed to delete task');
            }
        }
    };

    const toggleTaskExpand = (taskId) => {
        setExpandedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    };

    // --- Helpers ---
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getGoalBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return { emoji: '💎', label: 'Legendary', cls: 'bg-purple-100 text-purple-700 border border-purple-200' };
            case 'medium': return { emoji: '🏆', label: 'Champion', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
            default: return { emoji: '⭐', label: 'Achiever', cls: 'bg-blue-100 text-blue-700 border border-blue-200' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No Date';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
                    <p className="mt-1 text-sm text-gray-500">Track and manage your long-term study objectives.</p>
                </div>
                <Button className="flex items-center whitespace-nowrap flex-shrink-0" onClick={() => handleOpenGoalModal()}>
                    <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    New Goal
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? <div>Loading goals...</div> : goals.map((goal) => {
                    const goalTasks = tasks.filter(t => t.goalId === goal._id);

                    // Determine completion
                    let isCompleted = false;
                    // Check strict 100% progress OR habit duration expiry
                    if (goal.progressPercentage === 100) {
                        isCompleted = true;
                    } else if (goal.type === 'habit' && goal.startDate && goal.durationDays) {
                        const end = new Date(goal.startDate);
                        end.setDate(end.getDate() + Number(goal.durationDays));
                        if (end <= new Date()) isCompleted = true;
                    }

                    const badge = getGoalBadge(goal.priority);

                    return (
                        <div key={goal._id} className={`shadow rounded-lg overflow-hidden border transition-shadow ${isCompleted
                            ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-300'
                            : 'bg-white border-gray-100 hover:shadow-md'
                            }`}>
                            {/* Completion Banner */}
                            {isCompleted && (
                                <div className="bg-yellow-100 px-6 py-2 border-b border-yellow-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Goal Completed
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                                        {badge.emoji} {badge.label}
                                    </span>
                                </div>
                            )}

                            <div className="p-6 cursor-pointer" onClick={() => toggleExpand(goal._id)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                {goal.type === 'habit' ? (
                                                    <Activity className={`h-5 w-5 mr-2 ${isCompleted ? 'text-yellow-600' : 'text-indigo-500'}`} />
                                                ) : (
                                                    <Target className={`h-5 w-5 mr-2 ${isCompleted ? 'text-yellow-600' : 'text-blue-500'}`} />
                                                )}
                                                {goal.title}
                                                <span className={clsx('ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getPriorityColor(goal.priority))}>
                                                    {goal.priority}
                                                </span>
                                                {goal.type && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                                        {goal.type}
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        {goal.description && (
                                            <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                                        )}

                                        <div className="flex items-center text-sm text-gray-500 mb-4 space-x-6">
                                            <div className="flex items-center">
                                                <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {goal.type === 'habit' ? (
                                                    <span>{formatDate(goal.startDate)} • {goal.durationDays || '?'} Days</span>
                                                ) : (
                                                    <span>Due {formatDate(goal.deadline)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <Flag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {goal.progressPercentage || 0}% {goal.type === 'habit' ? 'Success Rate' : 'Complete'}
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="flex-1 mr-4">
                                                <ProgressBar
                                                    progress={goal.progressPercentage || 0}
                                                    color={isCompleted ? 'yellow' : (goal.type === 'habit' ? 'indigo' : 'blue')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex h-full flex-col justify-between">
                                        <button
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50"
                                        >
                                            {goal.expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {goal.expanded && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    {/* Habit Calendar Section */}
                                    {goal.type === 'habit' && (
                                        <div className="mb-6">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Daily Consistency</h4>
                                            <GoalCalendar logs={goalLogs[goal._id] || []} startDate={goal.startDate} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-gray-900">Tasks ({goalTasks.length})</h4>
                                        <div className="space-x-2">
                                            <Button
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => handleOpenTaskModal(goal._id)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Recurring Task
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                                                onClick={() => handleOpenGoalModal(goal)}
                                            >
                                                <Edit2 className="h-3 w-3 mr-1" />
                                                Edit Goal
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Task List within Goal */}
                                    <div className="space-y-3">
                                        {goalTasks.map(task => (
                                            <div key={task._id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                <div
                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => toggleTaskExpand(task._id)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={(e) => handleToggleTaskStatus(task, e)} className="text-gray-400 hover:text-green-600 focus:outline-none z-10">
                                                            {task.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Circle className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                        <div>
                                                            <p className={clsx("text-sm font-medium text-gray-900", task.status === 'completed' && "line-through text-gray-500")}>
                                                                {task.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-xs text-gray-400 flex items-center">
                                                            <Repeat className="h-3 w-3 mr-1" />
                                                            {task.frequency}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Task Details */}
                                                {expandedTaskIds.includes(task._id) && (
                                                    <div className="px-3 pb-3 pt-0 border-t border-gray-200 bg-white">
                                                        <div className="mt-2 text-xs flex justify-between items-center">
                                                            <span className="text-gray-500">History: {task.completionHistory?.length || 0} completions</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-400 hover:text-red-600 text-xs px-0"
                                                                onClick={() => handleDeleteTask(task._id, goal._id)}
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                            onClick={() => handleDeleteGoal(goal._id)}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete Goal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Create Goal Modal */}
            <Modal
                isOpen={isGoalModalOpen}
                onClose={handleCloseGoalModal}
                title={currentGoal ? 'Edit Goal' : 'Create New Goal'}
            >
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={goalFormData.title}
                            onChange={handleGoalChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    {/* ... Description ... */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                name="type"
                                value={goalFormData.type}
                                onChange={handleGoalChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="project">Project (Tasks)</option>
                                <option value="habit">Habit (Consistency)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <select
                                name="priority"
                                value={goalFormData.priority}
                                onChange={handleGoalChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={goalFormData.startDate}
                                onChange={handleGoalChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            {goalFormData.type === 'habit' ? (
                                <>
                                    <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                                    <input
                                        type="number"
                                        name="durationDays"
                                        value={goalFormData.durationDays}
                                        onChange={handleGoalChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={goalFormData.deadline}
                                        onChange={handleGoalChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center sm:justify-end pt-4 space-x-2">
                        <Button type="button" variant="ghost" onClick={handleCloseGoalModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {currentGoal ? 'Update Goal' : 'Create Goal'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Create Task Modal */}
            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                title="Add Recurring Task"
            >
                {/* ... Task Form ... */}
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={taskFormData.title}
                            onChange={handleTaskChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Frequency</label>
                            <select
                                name="frequency"
                                value={taskFormData.frequency}
                                onChange={handleTaskChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="once">Once</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Est. Time (mins)</label>
                            <input
                                type="number"
                                name="estimatedTime"
                                value={taskFormData.estimatedTime}
                                onChange={handleTaskChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center sm:justify-end pt-4 space-x-2">
                        <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Task
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GoalsPage;
