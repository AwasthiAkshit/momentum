import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';
import { Calendar, CheckSquare, Clock, TrendingUp, Flame, PenTool, Smile, Meh, Frown, Sun, Target, History } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <div className="bg-white shadow rounded-lg p-5 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${colorMap[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const AnalyticsPage = () => {
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [dashResult, chartResult] = await Promise.allSettled([
                    api.get('/analytics/dashboard'),
                    api.get('/analytics/charts'),
                ]);

                if (dashResult.status === 'fulfilled') {
                    setSummary(dashResult.value.data.summary);
                } else {
                    console.error('Dashboard fetch failed:', dashResult.reason);
                }

                if (chartResult.status === 'fulfilled') {
                    setCharts(chartResult.value.data);
                } else {
                    console.error('Charts fetch failed:', chartResult.reason);
                }
            } catch (err) {
                setError('Unexpected error loading analytics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Compute the 4 sub-scores that make up productivity score
    const scoreComponents = summary ? [
        {
            label: 'Habits',
            score: Math.round(summary.avgConsistency || 0),
            weight: '40%',
            color: '#10B981',
            bg: '#F0FDF4',
            description: `${summary.activeHabits || 0} active habits`,
        },
        {
            label: 'Goals',
            score: Math.round(summary.avgProjectProgress || 0),
            weight: '30%',
            color: '#3B82F6',
            bg: '#EFF6FF',
            description: `${Math.round(summary.avgProjectProgress || 0)}% progress`,
        },
        {
            label: 'Quick Tasks',
            score: Math.round(summary.quickTaskCompletionRate || 0),
            weight: '20%',
            color: '#8B5CF6',
            bg: '#F5F3FF',
            description: `${Math.round(summary.quickTaskCompletionRate || 0)}% completed`,
        },
        {
            label: 'Streak',
            score: Math.min(100, (summary.streakCount || 0) * 10),
            weight: '10%',
            color: '#F59E0B',
            bg: '#FFFBEB',
            description: `${summary.streakCount || 0} day streak`,
        },
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Your productivity — habits, tasks, goals and daily reflections.</p>
                </div>
                <div className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Last 30 Days</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                ) : (
                    <>
                        <StatCard
                            icon={TrendingUp}
                            label="Productivity Score"
                            value={`${summary?.productivityScore ?? 0}/100`}
                            color="blue"
                        />
                        <StatCard
                            icon={CheckSquare}
                            label="Tasks Completed"
                            value={`${summary?.completionRate ?? 0}%`}
                            sub={`${summary?.pendingTasks ?? 0} still pending`}
                            color="green"
                        />
                        <StatCard
                            icon={PenTool}
                            label="Reflections Logged"
                            value={`${charts?.recentReflections?.length ?? 0}`}
                            sub="Recent entries"
                            color="purple"
                        />
                        <StatCard
                            icon={Flame}
                            label="Best Habit Streak"
                            value={`${summary?.streakCount ?? 0} days`}
                            sub={`${summary?.activeHabits ?? 0} active habits`}
                            color="orange"
                        />
                    </>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Mood Distribution */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Mood Trends</h3>
                    <p className="text-xs text-gray-400 mb-4">Mood trends for this week (Mon-Sun)</p>
                    <div className="h-64 w-full">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={charts?.moodDistribution ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={8} />
                                    <YAxis
                                        domain={[1, 4]}
                                        ticks={[1, 2, 3, 4]}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => {
                                            if (val === 4) return 'Great';
                                            if (val === 3) return 'Good';
                                            if (val === 2) return 'Neutral';
                                            if (val === 1) return 'Low';
                                            return '';
                                        }}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        width={60}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => label}
                                        formatter={(_, __, props) => {
                                            return [props.payload.moodLabel, 'Mood'];
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6 }}
                                        connectNulls={true}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Weekly Productivity Trend */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Weekly Productivity Trend</h3>
                    <p className="text-xs text-gray-400 mb-4">Score based on habits, projects, tasks &amp; streak</p>
                    <div className="h-64 w-full">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={charts?.productivityByWeek ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={8} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        formatter={(v) => [`${v}`, 'Score']}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Productivity Score Breakdown */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Score Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-5">What's driving (or dragging) your productivity score</p>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <div className="grid grid-cols-2 gap-4 h-64">
                            {scoreComponents.map(({ label, score, weight, color, bg, description }) => {
                                const r = 32;
                                const circ = 2 * Math.PI * r;
                                const dash = (score / 100) * circ;
                                return (
                                    <div key={label} className="flex items-center space-x-3 p-3 rounded-xl" style={{ backgroundColor: bg }}>
                                        {/* SVG ring */}
                                        <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
                                            <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
                                            <circle
                                                cx="36" cy="36" r={r}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="7"
                                                strokeLinecap="round"
                                                strokeDasharray={`${dash} ${circ}`}
                                                strokeDashoffset={circ / 4}
                                                style={{ transition: 'stroke-dasharray 0.7s ease' }}
                                            />
                                            <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{score}</text>
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                                            <p className="text-xs text-gray-500">{description}</p>
                                            <p className="text-xs mt-1 font-medium" style={{ color }}>{weight} of score</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Habit Consistency */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Habit Consistency</h3>
                    <p className="text-xs text-gray-400 mb-4">Consistency % and current streak per habit</p>
                    <div className="h-64 w-full overflow-y-auto space-y-4 pr-1">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            (charts?.habitConsistency ?? []).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Target className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="text-sm text-center">No habits yet.<br />Add habits to track consistency.</p>
                                </div>
                            ) : (
                                (charts?.habitConsistency ?? []).map((h, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">{h.name}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-orange-500 font-semibold flex items-center">
                                                    <Flame className="h-3 w-3 mr-0.5" />{h.streak}d
                                                </span>
                                                <span className="text-xs font-semibold text-gray-600">{h.consistency}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${h.consistency}%`,
                                                    backgroundColor: COLORS[i % COLORS.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

            </div>

            {/* Recent Reflections */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2 text-blue-600" /> Recent Daily Reflections
                </h3>
                {loading ? <Skeleton className="h-32 w-full" /> : (
                    charts?.recentReflections?.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic text-sm">
                            No reflections recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {charts?.recentReflections?.map((j, i) => {
                                const moodMap = {
                                    great: { icon: Sun, color: 'text-yellow-500', label: 'Great' },
                                    good: { icon: Smile, color: 'text-blue-500', label: 'Good' },
                                    neutral: { icon: Meh, color: 'text-gray-500', label: 'Neutral' },
                                    low: { icon: Frown, color: 'text-red-500', label: 'Low' },
                                };
                                const mood = moodMap[j.mood] || moodMap.neutral;
                                const Icon = mood.icon;
                                return (
                                    <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-all">
                                        <div className="flex-shrink-0 mt-1">
                                            <Icon className={`h-5 w-5 ${mood.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                                                    {new Date(j.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mood.color} bg-opacity-10 border border-current`}>
                                                    {mood.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                                "{j.reflectionText}"
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
