const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

/**
 * Robust AI utility with multi-model fallback and heuristic safety
 */
const generateAIResponse = async (prompt, heuristicFallback = null) => {
    if (!apiKey) {
        console.error('Gemini API Error: GEMINI_API_KEY is missing');
        if (heuristicFallback) return heuristicFallback();
        throw new Error('API Key missing');
    }

    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await axios.post(url, {
                contents: [{ parts: [{ text: prompt + '\n\nIMPORTANT: Return ONLY valid raw JSON.' }] }]
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            const text = response.data.candidates[0].content.parts[0].text;
            let cleanJson = text.trim();
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/^```(?:json)?|```$/g, '').trim();
            }

            return JSON.parse(cleanJson);
        } catch (error) {
            console.warn(`Gemini Model ${model} failed:`, error.response?.data?.error?.message || error.message);
            // Continue to next model
        }
    }

    // If all models fail, use heuristic fallback if provided
    if (heuristicFallback) {
        console.log('Using Intelligent Heuristic Fallback...');
        return heuristicFallback();
    }

    throw new Error('All AI models failed');
};

/**
 * Generate a study roadmap
 */
const generateStudyTasks = async (topic) => {
    const prompt = `Generate 5 study tasks for: "${topic}". JSON: { "tasks": ["..."] }`;
    const fallback = () => ({
        tasks: [
            `Research foundations of ${topic}`,
            `Study core principles of ${topic}`,
            `Practice active recall for ${topic}`,
            `Complete a mock test on ${topic}`,
            `Review and summarize ${topic} concepts`
        ]
    });
    return await generateAIResponse(prompt, fallback);
};

/**
 * Generate personalized insights
 */
const generateUserInsights = async (userData) => {
    const prompt = `Analyze this study data and provide insights: ${JSON.stringify(userData)}. 
    JSON: { 
        "burnout": { "detected": false, "message": "...", "action": "..." },
        "attention": { "subject": "...", "message": "...", "actions": ["..."] },
        "boost": { "reason": "...", "recommendation": "..." }
    }`;

    const fallback = () => ({
        burnout: { detected: false, message: "Your study-life balance looks stable. Keep taking regular breaks!", action: "View Calendar" },
        attention: { subject: "General", message: "Focus on your upcoming deadlines to maintain momentum.", actions: ["Review task list", "Set daily goals"] },
        boost: { reason: "Peak Hours", recommendation: "You're most productive in the morning. Schedule your toughest subjects then." }
    });

    return await generateAIResponse(prompt, fallback);
};

/**
 * Generate a weekly summary
 */
const generateWeeklySummary = async (stats) => {
    const prompt = `Summarize these weekly study stats: ${JSON.stringify(stats)}. JSON: { "summary": "...", "trend": "up/down/stable" }`;

    const fallback = () => ({
        summary: `You've maintained a consistency score of ${stats.completionRate || 0}%. Great job staying on track!`,
        trend: 'stable'
    });

    return await generateAIResponse(prompt, fallback);
};

module.exports = {
    generateStudyTasks,
    generateUserInsights,
    generateWeeklySummary,
    generateAIResponse
};
