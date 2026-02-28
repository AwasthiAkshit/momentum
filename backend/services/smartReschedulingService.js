const Task = require('../models/taskModel');
const { generateAIResponse } = require('./geminiService');

/**
 * Smart Rescheduling Service
 * Automatically prioritizes and reschedules tasks based on Gemini AI analysis.
 */
const smartReschedule = async (userId) => {
    try {
        // Fetch all pending tasks for the user
        const tasks = await Task.find({ user: userId, status: { $ne: 'completed' } });

        if (!tasks.length) return { message: 'No pending tasks to reschedule.' };

        try {
            const prompt = `
                Analyze these pending tasks and suggest an optimal daily study order.
                Tasks: ${JSON.stringify(tasks.map(t => ({ id: t._id, title: t.title, priority: t.priority, dueDate: t.dueDate })))}
                
                Return a JSON object with:
                {
                    "optimizedOrder": [
                        { "id": "task_id", "title": "...", "reason": "Why this priority?" }
                    ]
                }
            `;
            const aiSuggestions = await generateAIResponse(prompt);
            return {
                originalCount: tasks.length,
                ...aiSuggestions
            };
        } catch (aiError) {
            console.warn('AI Reschedule failed, falling back to priority sort:', aiError);

            // Fallback: Priority weights: High = 3, Medium = 2, Low = 1
            const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const sortedTasks = tasks.sort((a, b) => {
                const priorityDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });

            return {
                originalCount: tasks.length,
                optimizedOrder: sortedTasks.map(t => ({
                    id: t._id,
                    title: t.title,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    reason: 'Prioritized by deadline and importance'
                }))
            };
        }
    } catch (error) {
        console.error('Smart Reschedule Error:', error);
        throw new Error('Failed to reschedule tasks');
    }
};

module.exports = {
    smartReschedule
};
