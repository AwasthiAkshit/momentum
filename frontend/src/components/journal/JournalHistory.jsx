import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Smile, Frown, Meh, Sun, Calendar, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const moodIcons = {
    low: { icon: Frown, color: 'text-red-500', bg: 'bg-red-50' },
    neutral: { icon: Meh, color: 'text-gray-500', bg: 'bg-gray-50' },
    good: { icon: Smile, color: 'text-blue-500', bg: 'bg-blue-50' },
    great: { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50' },
};

const JournalHistory = ({ refreshTrigger }) => {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/journal/history');
            setEntries(data);
        } catch (error) {
            console.error('Error fetching journal history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No entries yet</h3>
                <p className="text-gray-500">Your daily reflections will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry) => {
                const moodData = moodIcons[entry.mood] || moodIcons.neutral;
                const Icon = moodData.icon;
                const entryDate = new Date(entry.date);

                return (
                    <div key={entry._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-hover hover:shadow-md">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <div className={clsx('p-2 rounded-lg mr-3', moodData.bg)}>
                                    <Icon className={clsx('h-5 w-5', moodData.color)} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {entryDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </h4>
                                    <span className="text-xs text-gray-400">
                                        Mood: {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {entry.reflectionText}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default JournalHistory;
