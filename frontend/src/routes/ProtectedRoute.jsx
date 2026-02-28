import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAllowed, redirectPath = '/login', children }) => {
    // TODO: Replace with actual auth check logic (e.g., from context or prop)
    // For now, we'll assume isAllowed is passed or default to true for dev if not provided
    // In a real app, you might check a token in localStorage or a user object in Context

    const isAuthenticated = isAllowed !== undefined ? isAllowed : !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
