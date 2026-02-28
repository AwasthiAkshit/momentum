import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Smile, Frown, Meh, Sun, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const moods = [
    { id: 'low', label: 'Low', icon: Frown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
    { id: 'good', label: 'Good', icon: Smile, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'great', label: 'Great', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
];

const JournalCard = ({ onEntrySaved }) => {
    const [mood, setMood] = useState('neutral');
    const [reflection, setReflection] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTodayEntry();
    }, []);

    const fetchTodayEntry = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/journal/today');
            if (data) {
                setMood(data.mood);
                setReflection(data.reflectionText);
            }
        } catch (error) {
            console.error('Error fetching today journal:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!reflection.trim()) return;
        setIsSaving(true);
        setMessage('');
        try {
            await api.post('/journal', { mood, reflectionText: reflection });
            setMessage('Journal saved successfully!');
            if (onEntrySaved) onEntrySaved();
        } catch (error) {
            setMessage('Failed to save journal.');
            console.error('Error saving journal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Daily Journal</h3>
                <p className="text-sm text-gray-500 mb-6">How was your day? Reflect on your progress and mood.</p>

                {/* Mood Selector */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {moods.map((m) => {
                        const Icon = m.icon;
                        const isSelected = mood === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMood(m.id)}
                                className={clsx(
                                    'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                                    isSelected
                                        ? clsx(m.border, m.bg)
                                        : 'border-transparent hover:bg-gray-50'
                                )}
                            >
                                <Icon className={clsx('h-6 w-6 mb-1', isSelected ? m.color : 'text-gray-400')} />
                                <span className={clsx('text-xs font-medium', isSelected ? 'text-gray-900' : 'text-gray-500')}>
                                    {m.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Reflection Text */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reflections</label>
                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="What did you learn today? What challenges did you face?"
                        className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className={clsx('text-sm', message.includes('success') ? 'text-green-600' : 'text-red-600')}>
                        {message}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !reflection.trim()}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JournalCard;
