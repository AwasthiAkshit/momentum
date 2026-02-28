import React from 'react';
import clsx from 'clsx';

const ProgressBar = ({ progress, className, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-500',
        red: 'bg-red-600',
        purple: 'bg-purple-600',
    };

    return (
        <div className={clsx("w-full bg-gray-200 rounded-full h-2.5", className)}>
            <div
                className={clsx("h-2.5 rounded-full transition-all duration-500 ease-out", colorClasses[color] || colorClasses.blue)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
