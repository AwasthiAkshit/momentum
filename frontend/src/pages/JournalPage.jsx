import React, { useState } from 'react';
import JournalCard from '../components/journal/JournalCard';
import JournalHistory from '../components/journal/JournalHistory';
import { PenTool, History } from 'lucide-react';

const JournalPage = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleEntrySaved = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Daily Journal</h1>
                <p className="text-gray-500 mt-2">Capture your thoughts, track your mood, and reflect on your growth.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Today's Entry */}
                <div className="lg:col-span-12">
                    <div className="flex items-center mb-4">
                        <PenTool className="h-5 w-5 text-blue-600 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900">Today's Reflection</h2>
                    </div>
                    <JournalCard onEntrySaved={handleEntrySaved} />
                </div>

                {/* Bottom Section: History */}
                <div className="lg:col-span-12">
                    <div className="flex items-center mb-4 pt-4 border-t border-gray-100">
                        <History className="h-5 w-5 text-gray-600 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900">Past Reflections</h2>
                    </div>
                    <JournalHistory refreshTrigger={refreshTrigger} />
                </div>
            </div>
        </div>
    );
};

export default JournalPage;
