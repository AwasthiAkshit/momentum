import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Calendar = ({ history = [] }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isCompleted = (day) => {
        if (!day) return false;
        const checkDate = new Date(currentYear, currentMonth, day);
        return history.some(h => {
            const hDate = new Date(h.date);
            return hDate.getDate() === day &&
                hDate.getMonth() === currentMonth &&
                hDate.getFullYear() === currentYear;
        });
    };

    const isToday = (day) => {
        if (!day) return false;
        return day === today.getDate();
    };


    return (
        <div className="w-64 bg-white border border-gray-100 rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">
                    {today.toLocaleString('default', { month: 'long' })} {currentYear}
                </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-gray-400 font-medium">{d}</div>
                ))}
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "h-7 w-7 flex items-center justify-center rounded-full",
                            !day && "invisible",
                            day && isCompleted(day) && "bg-green-500 text-white font-bold",
                            day && !isCompleted(day) && isToday(day) && "border border-blue-500 text-blue-600 font-bold",
                            day && !isCompleted(day) && !isToday(day) && "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
