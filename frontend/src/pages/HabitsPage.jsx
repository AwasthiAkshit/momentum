import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Flame, Target, TrendingUp, Award, Trash2 } from 'lucide-react';
import { getHabits, createHabit, logHabit, deleteHabit } from '../services/plannerService';
import Modal from '../components/common/Modal';

// Last 7 days labels
// Format a Date as YYYY-MM-DD in LOCAL timezone (not UTC)
const toLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getLast7Days = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push({ label: days[d.getDay()], dateStr: toLocalDateStr(d) });
    }
    return result;
};

const HabitsPage = () => {
    const [habits, setHabits] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ title: '', description: '', frequency: 'daily', durationDays: 21 });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            setError(null);
            const res = await getHabits();
            setHabits(res.data);
        } catch (error) {
            console.error(error);
            setError('Failed to load habits. Please try again later.');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createHabit(newHabit);
            setIsModalOpen(false);
            fetchHabits();
            setNewHabit({ title: '', description: '', frequency: 'daily', durationDays: 21 });
        } catch (error) {
            console.error(error);
            alert('Failed to create habit');
        }
    };

    const handleLog = async (id, status) => {
        try {
            await logHabit(id, { date: new Date().toISOString(), status });
            fetchHabits();
        } catch (error) {
            console.error(error);
            alert('Failed to update habit status. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this habit?')) return;
        try {
            await deleteHabit(id);
            fetchHabits();
        } catch (error) {
            console.error(error);
            alert('Failed to delete habit. Please try again.');
        }
    };

    // Derived stats
    const completedHabits = habits.filter(h => {
        if (!h.startDate || !h.durationDays) return false;
        const end = new Date(h.startDate);
        end.setDate(end.getDate() + Number(h.durationDays));
        return end <= new Date();
    });
    const activeHabits = habits.filter(h => !completedHabits.includes(h));
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    const avgConsistency = habits.length === 0 ? 0 : Math.round(habits.reduce((acc, h) => acc + (h.consistency || 0), 0) / habits.length);
    const last7Days = getLast7Days();

    const getStreakBadge = (streak) => {
        if (streak >= 30) return { emoji: '💎', label: 'Legendary', cls: 'bg-purple-100 text-purple-700 border border-purple-200' };
        if (streak >= 21) return { emoji: '🏆', label: 'Champion', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
        if (streak >= 15) return { emoji: '⭐', label: 'Dedicated', cls: 'bg-blue-100 text-blue-700 border border-blue-200' };
        if (streak >= 7) return { emoji: '🔥', label: 'On Fire', cls: 'bg-orange-100 text-orange-700 border border-orange-200' };
        return { emoji: '🌱', label: 'Seedling', cls: 'bg-green-100 text-green-700 border border-green-200' };
    };

    const isCompleted = (habit) => {
        if (!habit.startDate || !habit.durationDays) return false;
        const end = new Date(habit.startDate);
        end.setDate(end.getDate() + Number(habit.durationDays));
        return end <= new Date();
    };

    const tips = [
        '🔑 Start small — even 5 minutes a day builds a lasting habit.',
        '📅 Habit stacking: attach a new habit right after an existing one.',
        '🏆 Track your progress visually to stay motivated.',
        "💡 Missing once is an accident, missing twice is the start of a new habit — don't break the chain!",
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Habit Goals</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" /> New Habit
                </button>
            </div>

            {/* Stats Summary Bar */}
            {habits.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-lg"><Target className="h-5 w-5 text-blue-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeHabits.length}</p>
                            <p className="text-xs text-gray-500">Active Habits</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 rounded-lg"><Flame className="h-5 w-5 text-orange-500" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{bestStreak}</p>
                            <p className="text-xs text-gray-500">Best Streak</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-green-50 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{avgConsistency}%</p>
                            <p className="text-xs text-gray-500">Avg. Consistency</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="ml-3 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Habit Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {habits.map(habit => {
                    const done = isCompleted(habit);
                    const badge = getStreakBadge(habit.streak || 0);
                    return (
                        <div
                            key={habit._id}
                            className={`bg-white p-6 rounded-xl shadow-sm border transition-shadow ${done
                                ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white'
                                : 'border-gray-100 hover:shadow-md'
                                }`}
                        >
                            {/* Completion banner */}
                            {done && (
                                <div className="flex items-center justify-between mb-3 px-3 py-2 bg-yellow-100 rounded-lg border border-yellow-200">
                                    <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">✅ Duration Complete</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                                        {badge.emoji} {badge.label}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 pr-8">{habit.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => handleDelete(habit._id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors bg-white/50 backdrop-blur-sm rounded-full p-1"
                                        title="Delete habit"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    {/* Streak flame (active) or achievement badge (completed) */}
                                    {done ? (
                                        <span className={`text-lg px-2 py-1 rounded-full ${badge.cls}`} title={`${badge.label} — ${habit.streak} day streak`}>
                                            {badge.emoji}
                                        </span>
                                    ) : (
                                        <div className="flex items-center text-orange-500 bg-orange-50 px-2 py-1 rounded-full border border-orange-100/50">
                                            <Flame className="h-4 w-4 mr-1" />
                                            <span className="font-bold text-sm">{habit.streak || 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Last 7 Days Tracker */}
                            <div className="mt-4">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Last 7 Days</p>
                                <div className="flex justify-between">
                                    {last7Days.map((day, i) => {
                                        const logged = habit.logs && habit.logs.some(log => {
                                            try { return toLocalDateStr(new Date(log.date)) === day.dateStr && log.status === 'completed'; }
                                            catch { return false; }
                                        });
                                        return (
                                            <div key={i} className="flex flex-col items-center space-y-1">
                                                <span className="text-xs text-gray-400">{day.label}</span>
                                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${logged ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
                                                    }`}>
                                                    {logged ? '✓' : '·'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Consistency bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Consistency</span>
                                    <span>{habit.consistency || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${done ? 'bg-yellow-400' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${habit.consistency || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{habit.frequency}</span>
                                {(() => {
                                    if (done) {
                                        return (
                                            <span className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium border border-yellow-200 cursor-default">
                                                <span>🎉</span><span>Completed</span>
                                            </span>
                                        );
                                    }
                                    const todayStr = toLocalDateStr(new Date());
                                    const doneToday = habit.logs && habit.logs.some(log => {
                                        try { return toLocalDateStr(new Date(log.date)) === todayStr && log.status === 'completed'; }
                                        catch { return false; }
                                    });
                                    return doneToday ? (
                                        <div className="relative group">
                                            <span className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200 cursor-default select-none">
                                                <Check className="h-4 w-4" />
                                                <span>Done today</span>
                                            </span>
                                            {/* Hover tooltip */}
                                            <div className="absolute bottom-full right-0 mb-2 w-48 hidden group-hover:block z-10">
                                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 text-center shadow-lg">
                                                    Come back tomorrow!<br />
                                                    <span className="text-orange-300 font-semibold">🔥 Keep the streak alive</span>
                                                    {/* Arrow */}
                                                    <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            <button
                                                onClick={() => handleLog(habit._id, 'completed')}
                                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                            >
                                                <Check className="h-4 w-4" />
                                                <span>Done</span>
                                            </button>
                                            {/* Hover tooltip */}
                                            <div className="absolute bottom-full right-0 mb-2 w-44 hidden group-hover:block z-10">
                                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 text-center shadow-lg">
                                                    Mark today as done<br />
                                                    <span className="text-green-300 font-semibold">to keep your streak! ✅</span>
                                                    <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!error && habits.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No habits yet. Start building one today!
                </div>
            )}

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center mb-4">
                    <Award className="h-5 w-5 text-indigo-600 mr-2" />
                    <h3 className="font-bold text-gray-900">Habit Building Tips</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tips.map((tip, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 text-sm text-gray-700 shadow-sm border border-indigo-50">
                            {tip}
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Habit">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={newHabit.title}
                            onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="e.g. Morning 5km Run"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={newHabit.description}
                            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="Motivation or details..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                        <input
                            type="number"
                            value={newHabit.durationDays}
                            onChange={(e) => setNewHabit({ ...newHabit, durationDays: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            min="1"
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Create Habit</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HabitsPage;
