import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Brain, Battery, Calendar, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import { getAIInsights } from '../services/plannerService';

const InsightsPage = () => {
    const [summary, setSummary] = useState(null);
    const [habitInsights, setHabitInsights] = useState(null);
    const [burnoutRisk, setBurnoutRisk] = useState(null);
    const [projectSuggestions, setProjectSuggestions] = useState(null);
    const [adaptivePlan, setAdaptivePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDetailedReport, setShowDetailedReport] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAIInsights();
                const data = response.data;

                setSummary(data.weeklySummary);
                setHabitInsights(data.habitInsights);
                setBurnoutRisk(data.burnoutRisk);
                setProjectSuggestions(data.goalStrategy);
                setAdaptivePlan(data.adaptivePlan);
            } catch (error) {
                console.error('Error fetching insights:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Default fallbacks if AI hasn't generated data yet
    const burnout = burnoutRisk || { riskLevel: "low", message: "No burnout risk detected. Keep maintaining your healthy balance!", recommendations: ["View Schedule"] };
    const projects = projectSuggestions || { priorities: [], timelineAdvice: "You're doing great! No specific subjects need urgent attention.", executionTips: ["Continue current plan"] };
    const habits = habitInsights || { consistencyMessage: "Consistent performance", suggestions: ["Keep up your current study routine for maximum retention."], insights: [] };
    const plan = adaptivePlan || { workloadAssessment: "Workload looks good.", scheduleAdjustments: [], focusRecommendation: "" };

    const isBurnoutDetected = burnout.riskLevel === 'high' || burnout.riskLevel === 'medium';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
                    <p className="mt-1 text-sm text-gray-500">Personalized recommendations to optimize your study routine.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Burnout Warning - High Priority */}
                <div className={`border rounded-lg p-6 md:col-span-2 shadow-sm ${isBurnoutDetected ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {isBurnoutDetected ? (
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            ) : (
                                <Battery className="h-6 w-6 text-blue-600" />
                            )}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-lg font-medium ${isBurnoutDetected ? 'text-red-800' : 'text-blue-800'}`}>
                                {isBurnoutDetected ? `Burnout Risk: ${burnout.riskLevel.toUpperCase()}` : 'Wellness Status Good'}
                            </h3>
                            <div className={`mt-2 text-sm ${isBurnoutDetected ? 'text-red-700' : 'text-blue-700'}`}>
                                <p>{burnout.message}</p>
                            </div>
                            <div className="mt-4">
                                <ul className="list-disc pl-4 mt-2">
                                    {burnout.recommendations?.map((rec, idx) => (
                                        <li key={idx} className={`text-sm ${isBurnoutDetected ? 'text-red-800' : 'text-blue-800'}`}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Goal Strategy */}
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-400">
                    <div className="flex items-center mb-4">
                        <Brain className="h-6 w-6 text-yellow-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Goal Strategy</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        {projects.timelineAdvice}
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">Priority Recommendations:</h4>
                        <ul className="list-disc list-inside text-sm text-yellow-700">
                            {projects.priorities && projects.priorities.length > 0 ? (
                                projects.priorities.map((action, idx) => (
                                    <li key={idx}>{action}</li>
                                ))
                            ) : (
                                <li>No actions suggested yet.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Habit Improvements */}
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-400">
                    <div className="flex items-center mb-4">
                        <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Habit Insights</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        {habits.consistencyMessage}
                    </p>
                    <div className="bg-green-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Suggestions:</h4>
                        <ul className="list-disc list-inside text-sm text-green-700">
                            {habits.suggestions && habits.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                        Weekly Summary
                    </h3>
                    <div className="mb-4">
                        <p className="text-gray-700">{summary?.summary || "Analyzing your study habits..."}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-gray-900">{summary?.score || 0}%</span>
                            <span className="text-sm text-gray-500">Productivity Score</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center flex flex-col justify-center items-center">
                            <TrendingUp className={`h-6 w-6 mb-1 ${summary?.trend === 'up' ? 'text-green-500' : summary?.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} />
                            <span className="text-sm font-medium uppercase text-gray-500">{summary?.trend || 'Stable'} Trend</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-gray-900">{summary?.streak || 0}</span>
                            <span className="text-sm text-gray-500">Day Streak</span>
                        </div>
                    </div>

                    {showDetailedReport && summary && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-md font-bold text-gray-800 mb-3">Detailed Performance Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="text-sm font-semibold text-green-700 mb-2">What Went Well:</h5>
                                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                        {summary.strengths?.map((strength, index) => (
                                            <li key={index}>{strength}</li>
                                        )) || <li>No specific strengths recorded yet.</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-sm font-semibold text-orange-700 mb-2">Areas for Improvement:</h5>
                                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                        {summary.weaknesses?.map((weakness, index) => (
                                            <li key={index}>{weakness}</li>
                                        )) || <li>No specific weaknesses recorded yet.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Button onClick={() => setShowDetailedReport(!showDetailedReport)}>
                            {showDetailedReport ? "Hide Detailed Report" : "Generate Detailed Report"}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InsightsPage;
