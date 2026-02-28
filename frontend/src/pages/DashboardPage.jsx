import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { getDashboardData, getMe, getWeeklySummary } from '../services/plannerService';
import {
    PenTool,
    TrendingUp,
    Flame,
    Target,
    ListTodo,
    ArrowRight,
    Brain,
    Smile,
    Meh,
    Frown,
    Sun
} from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';
import clsx from 'clsx';

const DashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [user, setUser] = useState({ name: 'Student' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [journalToday, setJournalToday] = useState(null);
    const [journalLoading, setJournalLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User & Analytics in parallel
                const [userData, analyticsRes] = await Promise.all([
                    getMe().catch(err => ({ data: { name: 'Student' } })), // Fallback if auth check fails weirdly
                    getDashboardData()
                ]);

                setUser(userData.data);
                setDashboardData(analyticsRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                const backendMsg = err.response?.data?.message;
                setError(`Failed to load dashboard data: ${backendMsg || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        const fetchAi = async () => {
            try {
                const res = await getWeeklySummary();
                setAiSummary(res.data);
            } catch (err) {
                console.error('Error fetching AI summary:', err);
            } finally {
                setAiLoading(false);
            }
        };

        const fetchJournalStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const entryRes = await api.get('/journal/today');
                setJournalToday(entryRes.data);
            } catch (err) {
                console.error('Error fetching journal status:', err);
            } finally {
                setJournalLoading(false);
            }
        };

        fetchData();
        fetchAi();
        fetchJournalStatus();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const { summary, upcomingDeadlines } = dashboardData || {};

    // Data for charts
    const productivityScore = summary?.productivityScore || 0;
    const productivityData = [
        { name: 'Score', value: productivityScore },
        { name: 'Remaining', value: 100 - productivityScore }
    ];
    const COLORS = ['#8b5cf6', '#ede9fe']; // Purple & Light Purple

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
                    <p className="mt-1 text-gray-500">Here is your productivity overview.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link to="/journal">
                        <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
                            <PenTool className="h-4 w-4 mr-2" />
                            Daily Journal
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Productivity & Journaling Quick Look */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center mb-2">
                            <TrendingUp className="h-6 w-6 mr-2 text-indigo-100" />
                            <h2 className="text-lg font-semibold text-indigo-50">Productivity Score</h2>
                        </div>
                        <div className="text-5xl font-bold mb-1">{productivityScore}</div>
                        <div className="text-indigo-100 text-sm">out of 100</div>
                    </div>

                    <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm font-medium opacity-90 mb-2">Metrics Breakdown:</p>
                        <ul className="text-xs space-y-1 opacity-80">
                            <li className="flex justify-between"><span>Completion:</span> <span>{summary?.completionRate || 0}%</span></li>
                            <li className="flex justify-between"><span>Habits:</span> <span>{summary?.activeHabits || 0}</span></li>
                            <li className="flex justify-between"><span>Streak:</span> <span>{summary?.streakCount || 0}d</span></li>
                        </ul>
                    </div>
                </div>

                {/* Daily Journal Reminder Widget */}
                <div className={clsx(
                    "rounded-2xl p-6 shadow-sm border lg:col-span-1 border-gray-100 flex flex-col justify-between transition-all shadow-indigo-100/50",
                    journalToday ? "bg-white" : "bg-blue-50 border-blue-100 ring-2 ring-blue-200"
                )}>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                            <PenTool className={clsx("h-5 w-5 mr-2", journalToday ? "text-blue-500" : "text-blue-600")} />
                            Daily Reflection
                        </h2>
                        {journalLoading ? (
                            <div className="animate-pulse bg-gray-200 h-10 w-full rounded-lg mb-2"></div>
                        ) : journalToday ? (
                            <div>
                                <div className="flex items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 mr-2">Mood:</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {journalToday.mood}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-3 italic leading-relaxed">
                                    "{journalToday.reflectionText}"
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-blue-800 font-medium">
                                    Capture your thoughts for today.
                                </p>
                                <Link to="/journal">
                                    <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                        Write Now <ArrowRight className="h-3 w-3 inline ml-1" />
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Section: AI Insights */}
            <div className="grid grid-cols-1 gap-6">
                {/* AI Weekly Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Brain className="h-48 w-48" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                            <Brain className="h-6 w-6 mr-2 text-purple-600" /> AI Weekly Insights
                        </h2>
                        {aiLoading ? (
                            <div className="space-y-3">
                                <div className="animate-pulse bg-gray-100 h-4 w-full rounded"></div>
                                <div className="animate-pulse bg-gray-100 h-4 w-5/6 rounded"></div>
                            </div>
                        ) : aiSummary ? (
                            <div className="prose text-base text-gray-600 w-full max-w-none">
                                <p className="mb-4 leading-relaxed"><strong>Weekly Overview:</strong> {aiSummary.summary}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50">
                                        <div className="flex items-center text-green-700 font-bold text-sm mb-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                            Key Strengths Observed
                                        </div>
                                        <ul className="list-disc pl-5 space-y-1.5 text-green-900/80 text-sm">
                                            {aiSummary.strengths?.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                                        <div className="flex items-center text-orange-700 font-bold text-sm mb-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                            Recommended Improvements
                                        </div>
                                        <ul className="list-disc pl-5 space-y-1.5 text-orange-900/80 text-sm">
                                            {aiSummary.weaknesses?.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">Your AI productivity insights will appear here once you've logged enough activity.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid: 3 Segments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Habits Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <Flame className="h-5 w-5 mr-2 text-orange-500" /> Habits
                        </h3>
                        <Link to="/habits" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="p-6 flex-1">
                        <div className="text-center py-4">
                            <div className="text-4xl font-bold text-gray-900 mb-1">{summary?.streakCount || 0}</div>
                            <div className="text-sm text-gray-500">Day Swipe Breakdown Streak</div>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Active Habits</span>
                                <span className="font-medium bg-gray-100 px-2 py-1 rounded">{summary?.activeHabits || 0}</span>
                            </div>
                            {/* Assuming we might want to list top habits here later */}
                        </div>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-b-2xl border-t border-orange-100">
                        <p className="text-xs text-orange-700 text-center">Consistency is key!</p>
                    </div>
                </div>

                {/* 2. Projects Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-blue-500" /> Goals
                        </h3>
                        <Link to="/projects" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="p-6 flex-1">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Deadlines</h4>
                        {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingDeadlines.map(task => (
                                    <li key={task._id} className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{task.title}</p>
                                            <p className="text-xs text-red-500">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No upcoming deadlines.</p>
                        )}
                    </div>
                </div>

                {/* 3. Quick Tasks Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <ListTodo className="h-5 w-5 mr-2 text-green-500" /> Quick Tasks
                        </h3>
                        <Link to="/quick-tasks" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="p-6 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-gray-900">{summary?.quickTaskPending || 0}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                            </div>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-gray-900">{summary?.quickTaskCompletionRate || 0}%</div>
                                <div className="text-xs text-gray-500">Done</div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-gray-600 border-dashed">
                            <Link to="/quick-tasks" className="flex justify-center items-center w-full">
                                + Add Quick Task
                            </Link>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
