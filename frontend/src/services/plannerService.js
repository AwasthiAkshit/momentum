import api from './api';

// Auth
export const getMe = () => api.get('/auth/me');

// Habits
export const getHabits = () => api.get('/habits');
export const createHabit = (data) => api.post('/habits', data);
export const logHabit = (id, data) => api.post(`/habits/${id}/log`, data);
export const getHabitLogs = (id) => api.get(`/habits/${id}/logs`);
export const deleteHabit = (id) => api.delete(`/habits/${id}`);

// Projects
export const getProjects = (archived = false) => api.get(`/projects?archived=${archived}`);
export const archiveProject = (id) => api.put(`/projects/${id}/archive`);
export const createProject = (data) => api.post('/projects', data);
export const getProjectTasks = (id) => api.get(`/projects/${id}/tasks`);
export const addProjectTask = (id, data) => api.post(`/projects/${id}/tasks`, data);
export const updateTaskStatus = (taskId, data) => api.put(`/projects/tasks/${taskId}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Quick Tasks
export const getQuickTasks = () => api.get('/quick-tasks');
export const createQuickTask = (data) => api.post('/quick-tasks', data);
export const updateQuickTask = (id, data) => api.put(`/quick-tasks/${id}`, data);
export const deleteQuickTask = (id) => api.delete(`/quick-tasks/${id}`);

// Analytics & AI
export const getDashboardData = () => api.get('/analytics/dashboard');
export const generateProjectTasks = (topic) => api.post('/ai/generate-tasks', { topic });
export const getWeeklySummary = () => api.get('/ai/weekly-summary');
export const getHabitInsights = () => api.get('/ai/habit-insights');
export const getProjectSuggestions = () => api.get('/ai/project-suggestions');
export const getBurnoutRisk = () => api.get('/ai/burnout-risk');
export const getAdaptivePlan = () => api.get('/ai/adaptive-plan');
export const getAIInsights = () => api.get('/ai/all-insights');
