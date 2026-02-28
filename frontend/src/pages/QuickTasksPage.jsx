import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { getQuickTasks, createQuickTask, updateQuickTask, deleteQuickTask } from '../services/plannerService';

const PRIORITY_CONFIG = {
    high: { label: 'High', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    low: { label: 'Low', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
};

const PriorityBadge = ({ priority }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const QuickTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await getQuickTasks();
            // Sort: incomplete first, then by priority weight
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const sorted = res.data.sort((a, b) => {
                if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
                return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
            });
            setTasks(sorted);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();

        const title = newTaskTitle.trim();
        if (!title || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await createQuickTask({
                title,
                priority: newTaskPriority
            });

            if (response.data) {
                setNewTaskTitle('');
                setNewTaskPriority('medium');
                await fetchTasks();
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to add task. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTask = async (task) => {
        try {
            await updateQuickTask(task._id, { isCompleted: !task.isCompleted });
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    const changePriority = async (task, priority) => {
        try {
            await updateQuickTask(task._id, { priority });
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteQuickTask(id);
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    const pending = tasks.filter(t => !t.isCompleted);
    const done = tasks.filter(t => t.isCompleted);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Quick Tasks</h1>
                <span className="text-sm text-gray-500">{pending.length} remaining</span>
            </div>

            {/* Add Task Form */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full sm:flex-1 min-w-0 text-base border-none focus:outline-none focus:ring-0 placeholder-gray-400 p-0 sm:py-0"
                    />
                    <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {/* Priority selector */}
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
                            {['high', 'medium', 'low'].map(p => {
                                const cfg = PRIORITY_CONFIG[p];
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewTaskPriority(p)}
                                        className={`px-3 py-2 transition-colors ${newTaskPriority === p
                                            ? `${cfg.bg} ${cfg.text}`
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="submit"
                            disabled={!newTaskTitle.trim() || isSubmitting}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center min-w-[40px]"
                        >
                            {isSubmitting ? (
                                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Task List */}
            <div className="space-y-2">
                {tasks.map(task => (
                    <div
                        key={task._id}
                        className={`group cursor-pointer flex items-center p-4 bg-white rounded-xl border transition-all ${task.isCompleted ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200 hover:border-blue-200'
                            }`}
                        onClick={() => toggleTask(task)}
                    >
                        {/* Completion toggle */}
                        <button
                            type="button"
                            className={`p-1 rounded-full mr-3 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'
                                }`}
                        >
                            {task.isCompleted ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>

                        {/* Title */}
                        <span className={`flex-1 text-base ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {task.title}
                        </span>

                        {/* Priority badge — click to cycle */}
                        {!task.isCompleted && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const order = ['high', 'medium', 'low'];
                                    const next = order[(order.indexOf(task.priority || 'medium') + 1) % 3];
                                    changePriority(task, next);
                                }}
                                className="mr-3 opacity-80 hover:opacity-100 transition-opacity"
                                title="Click to change priority"
                            >
                                <PriorityBadge priority={task.priority || 'medium'} />
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(task._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No tasks yet. Add one above!
                    </div>
                )}

                {/* Completed section separator */}
                {done.length > 0 && pending.length > 0 && (
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider pt-2 px-1">
                        Completed ({done.length})
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuickTasksPage;
