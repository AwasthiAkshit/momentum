import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import { Play, Pause, RotateCcw, Coffee, Zap, Settings, X, Check } from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';

const DEFAULT_DURATIONS = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
};

const TimerComponent = ({ onSessionComplete }) => {
    const [mode, setMode] = useState('focus');
    const [durations, setDurations] = useState(DEFAULT_DURATIONS);
    const [tempDurations, setTempDurations] = useState(DEFAULT_DURATIONS);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60);
    const [isActive, setIsActive] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [progress, setProgress] = useState(100);
    const [showSettings, setShowSettings] = useState(false);

    const modes = {
        focus: { label: 'Focus', color: 'blue', icon: Zap },
        shortBreak: { label: 'Short Break', color: 'green', icon: Coffee },
        longBreak: { label: 'Long Break', color: 'purple', icon: Coffee },
    };

    // Tick
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((t) => {
                    const next = t - 1;
                    setProgress((next / (durations[mode] * 60)) * 100);
                    return next;
                });
            }, 1000);
        } else if (timeLeft === 0 && hasStarted) {
            setIsActive(false);
            setHasStarted(false);
            // Auto-log only focus sessions (not breaks)
            if (mode === 'focus') {
                api.post('/focus', { durationMinutes: durations.focus })
                    .then(() => { if (onSessionComplete) onSessionComplete(); })
                    .catch((err) => console.error('Failed to log focus session:', err));
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, durations, hasStarted, onSessionComplete]);

    const switchMode = (newMode) => {
        setMode(newMode);
        setTimeLeft(durations[newMode] * 60);
        setIsActive(false);
        setHasStarted(false);
        setProgress(100);
    };

    const toggleTimer = () => {
        if (!isActive) setHasStarted(true);
        setIsActive((a) => !a);
    };

    const resetTimer = () => {
        setIsActive(false);
        setHasStarted(false);
        setTimeLeft(durations[mode] * 60);
        setProgress(100);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusLabel = () => {
        if (!hasStarted) return 'READY';
        if (isActive) return mode === 'focus' ? 'FOCUSING' : 'ON BREAK';
        return 'PAUSED';
    };

    const getStatusColor = () => {
        if (!hasStarted) return 'text-gray-400';
        if (isActive) return `text-${modes[mode].color}-500`;
        return 'text-yellow-500';
    };

    const applySettings = () => {
        // Validate: min 1, max 120
        const validated = {
            focus: Math.min(120, Math.max(1, Number(tempDurations.focus) || DEFAULT_DURATIONS.focus)),
            shortBreak: Math.min(60, Math.max(1, Number(tempDurations.shortBreak) || DEFAULT_DURATIONS.shortBreak)),
            longBreak: Math.min(60, Math.max(1, Number(tempDurations.longBreak) || DEFAULT_DURATIONS.longBreak)),
        };
        setDurations(validated);
        setTempDurations(validated);
        // Restart the current mode with the new duration
        setTimeLeft(validated[mode] * 60);
        setIsActive(false);
        setHasStarted(false);
        setProgress(100);
        setShowSettings(false);
    };

    const cancelSettings = () => {
        setTempDurations(durations); // reset temp values
        setShowSettings(false);
    };

    const CurrentIcon = modes[mode].icon;
    const ringColor = mode === 'focus' ? 'text-blue-500' : mode === 'shortBreak' ? 'text-green-500' : 'text-purple-500';

    return (
        <div className="bg-white shadow rounded-lg p-8 flex flex-col items-center relative">
            {/* Settings button */}
            <button
                onClick={() => { setTempDurations(durations); setShowSettings(true); }}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Timer Settings"
            >
                <Settings className="h-5 w-5" />
            </button>

            {/* Mode tabs */}
            <div className="flex space-x-2 mb-8 bg-gray-100 p-1 rounded-lg">
                {Object.keys(modes).map((m) => (
                    <button
                        key={m}
                        onClick={() => switchMode(m)}
                        className={clsx(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                            mode === m
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {modes[m].label}
                    </button>
                ))}
            </div>

            {/* Timer ring */}
            <div className="relative mb-8">
                <div className="h-64 w-64 rounded-full border-8 border-gray-100 flex items-center justify-center relative">
                    <svg className="absolute top-0 left-0 h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50" cy="50" r="46"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className={clsx('transition-all duration-1000', ringColor)}
                            strokeDasharray={`${(progress / 100) * 289} 289`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="flex flex-col items-center z-10">
                        <CurrentIcon className={clsx('h-8 w-8 mb-2', `text-${modes[mode].color}-500`)} />
                        <span className="text-6xl font-bold text-gray-900 tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                        <span className={clsx('mt-1 uppercase tracking-widest text-xs font-semibold', getStatusColor())}>
                            {getStatusLabel()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex space-x-4">
                <Button onClick={toggleTimer} size="lg" className="w-32" variant={isActive ? 'secondary' : 'primary'}>
                    {isActive ? <><Pause className="mr-2 h-5 w-5" /> Pause</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg" className="w-32">
                    <RotateCcw className="mr-2 h-5 w-5" /> Reset
                </Button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 bg-white rounded-lg p-8 flex flex-col z-20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Timer Settings</h3>
                        <button onClick={cancelSettings} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-5 flex-1">
                        {[
                            { key: 'focus', label: 'Focus Duration', max: 120, unit: 'min' },
                            { key: 'shortBreak', label: 'Short Break Duration', max: 60, unit: 'min' },
                            { key: 'longBreak', label: 'Long Break Duration', max: 60, unit: 'min' },
                        ].map(({ key, label, max, unit }) => (
                            <div key={key}>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-medium text-gray-700">{label}</label>
                                    <span className="text-xs text-gray-400">1–{max} {unit}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max={max}
                                        value={tempDurations[key]}
                                        onChange={(e) => setTempDurations({ ...tempDurations, [key]: Number(e.target.value) })}
                                        className="flex-1 accent-blue-500"
                                    />
                                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                                        <input
                                            type="number"
                                            min="1"
                                            max={max}
                                            value={tempDurations[key]}
                                            onChange={(e) => setTempDurations({ ...tempDurations, [key]: e.target.value })}
                                            className="w-14 text-center py-1 text-sm font-medium focus:outline-none"
                                        />
                                        <span className="pr-2 text-xs text-gray-500">min</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button onClick={cancelSettings} variant="outline" className="flex-1">Cancel</Button>
                        <Button onClick={applySettings} className="flex-1">
                            <Check className="mr-2 h-4 w-4" /> Apply
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimerComponent;
