import React from 'react';
import { clsx } from 'clsx';

const GoalCalendar = ({ logs = [], startDate }) => {
    // Basic implementation: Show last 30 days or the duration grid
    // Let's show a horizontal scrollable strip of days starting from startDate

    // Generate dates
    const start = new Date(startDate);
    const today = new Date();
    const days = [];

    // Show e.g., the last 14 days and next 7? 
    // Or just show the logs we have?
    // Let's generate a list of days from Start Date until Today + some buffer

    // Simple View: Last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    const getStatusColor = (date) => {
        const dateStr = date.toDateString();
        const log = logs.find(l => new Date(l.date).toDateString() === dateStr);

        if (!log) return 'bg-gray-100 text-gray-400';
        if (log.status === 'completed') return 'bg-green-500 text-white';
        if (log.status === 'partial') return 'bg-yellow-400 text-white';
        return 'bg-red-400 text-white';
    };

    return (
        <div className="flex space-x-1 overflow-x-auto pb-2 p-1">
            {days.map((date, idx) => (
                <div key={idx} className="flex flex-col items-center">
                    <div
                        className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                            getStatusColor(date)
                        )}
                        title={date.toDateString()}
                    >
                        {date.getDate()}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GoalCalendar;
