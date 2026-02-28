import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/LandingPage';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';

import DashboardPage from '../pages/DashboardPage';
import HabitsPage from '../pages/HabitsPage';
import ProjectsPage from '../pages/ProjectsPage';
import QuickTasksPage from '../pages/QuickTasksPage';
import JournalPage from '../pages/JournalPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import InsightsPage from '../pages/InsightsPage';

import FeaturesPage from '../pages/FeaturesPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/quick-tasks" element={<QuickTasksPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AppRoutes;
