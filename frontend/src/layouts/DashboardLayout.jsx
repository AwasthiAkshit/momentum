import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Target,
    CheckSquare,
    BarChart2,
    Lightbulb,
    PenTool,
    Menu,
    X,
    LogOut
} from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ icon: Icon, label, subtitle, to, active, onClick }) => {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group',
                active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
        >
            <Icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500')} />
            <div className="flex flex-col">
                <span>{label}</span>
                {subtitle && (
                    <span className={clsx('text-xs font-normal', active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500')}>
                        {subtitle}
                    </span>
                )}
            </div>
        </Link>
    );
};

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [systemStatus, setSystemStatus] = useState('idle');
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleStatusUpdate = (e) => setSystemStatus(e.detail);
        window.addEventListener('system-status-update', handleStatusUpdate);
        return () => window.removeEventListener('system-status-update', handleStatusUpdate);
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', subtitle: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Habits', subtitle: 'Daily Routines', href: '/habits', icon: CheckSquare },
        { name: 'Goals', subtitle: 'Milestone Goals', href: '/projects', icon: Target },
        { name: 'Quick Tasks', subtitle: 'One-off Items', href: '/quick-tasks', icon: CheckSquare },
        { name: 'Journal', subtitle: 'Daily Reflection', href: '/journal', icon: PenTool },
        { name: 'Analytics', subtitle: 'Performance Metrics', href: '/analytics', icon: BarChart2 },
        { name: 'AI Insights', subtitle: 'Smart Suggestions', href: '/insights', icon: Lightbulb },
    ];

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-600 bg-opacity-50 transition-opacity lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - sticky, never scrolls */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
                    <span className="text-xl font-bold text-blue-600">Momentum</span>
                    <button
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.name}
                            icon={item.icon}
                            label={item.name}
                            subtitle={item.subtitle}
                            to={item.href}
                            active={location.pathname === item.href}
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 flex flex-col flex-shrink-0 relative">
                    <button onClick={handleSignOut} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                    {/* Hidden Diagnostic Indicator - Only visible to developer */}
                    <div
                        className={clsx(
                            "absolute bottom-2 right-2 w-1 h-1 rounded-full transition-opacity duration-500",
                            systemStatus === 'busy' ? "bg-blue-600 opacity-80" : "bg-gray-400 opacity-10"
                        )}
                        title={systemStatus === 'busy' ? "AI Service Busy" : "AI Service Idle"}
                    />
                </div>
            </aside>

            {/* Main Content - scrolls independently */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 lg:hidden flex-shrink-0">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="text-lg font-bold text-gray-900">Momentum</span>
                        <div className="w-6" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
