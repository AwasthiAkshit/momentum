const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const AIInsight = require('../models/aiInsightModel');
const {
    getWeeklySummaryPrompt,
    getHabitInsightPrompt,
    getBurnoutRiskPrompt,
    getProjectSuggestionsPrompt,
    getAdaptivePlanPrompt,
    getTaskGenerationPrompt,
    getMasterInsightPrompt
} = require('../utils/promptTemplates');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });



let requestQueue = Promise.resolve();
let activeRequests = 0;

const getAIStatus = () => activeRequests > 0 ? 'busy' : 'idle';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Core AI Request Handler with Caching
 * @param {string} userId - ID of the user
 * @param {string} type - Insight type (e.g. 'weekly_summary')
 * @param {string} prompt - Formatted prompt string
 * @param {function} heuristicFallback - Fallback function if AI fails
 * @param {boolean} forceRefresh - If true, bypass cache
 */
const generateAIResponse = async (userId, type, prompt, heuristicFallback = null, forceRefresh = false) => {
    const dataHash = crypto.createHash('md5').update(prompt).digest('hex');

    // 1. Check if we have a valid cache
    if (!forceRefresh) {
        const cachedInsight = await AIInsight.findOne({ user: userId, type, dataHash }).sort({ createdAt: -1 });
        if (cachedInsight) {
            console.log(`[AI TRACE] Returning DB cached insight for: ${type}`);
            return cachedInsight.content;
        }
    }
    console.log(`[AI TRACE] Cache MISS or forceRefresh for: ${type}`);

    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    if (!apiKey) {
        console.error('Gemini API Error: GEMINI_API_KEY is missing');
        if (heuristicFallback) return heuristicFallback();
        throw new Error('API Key missing');
    }

    // Use standard high-capacity aliases to avoid 2 RPM limits of experimental 2.5 models
    const models = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];

    return new Promise((resolve, reject) => {
        requestQueue = requestQueue.then(async () => {
            activeRequests++;
            console.log(`[AI DEBUG] activeRequests incremented: ${activeRequests} (Type: ${type})`);
            try {
                // Secondary cache check to prevent race conditions from concurrent duplicate requests (e.g., React StrictMode)
                if (!forceRefresh) {
                    const latestCache = await AIInsight.findOne({ user: userId, type, dataHash }).sort({ createdAt: -1 });
                    if (latestCache) {
                        console.log(`[AI TRACE] Race condition prevented! Returning cached insight for: ${type}`);
                        return resolve(latestCache.content);
                    }
                }

                for (const model of models) {
                    try {
                        // Crucial delay to prevent hitting free tier burst rate limits
                        await delay(2000);

                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                        const response = await axios.post(url, {
                            contents: [{ parts: [{ text: prompt + '\n\nIMPORTANT: Return ONLY valid raw JSON.' }] }]
                        }, {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 30000 // Give the AI enough time to generate the response safely
                        });

                        console.log(`[AI TRACE] Gemini response received for ${type} using ${model}`);
                        let cleanJson = response.data.candidates[0].content.parts[0].text.trim();
                        if (cleanJson.startsWith('```')) {
                            cleanJson = cleanJson.replace(/^```(?:json)?|```$/g, '').trim();
                        }

                        const parsedResponse = JSON.parse(cleanJson);

                        // Save to cache
                        if (userId && type) {
                            await AIInsight.create({
                                user: userId,
                                type,
                                dataHash,
                                content: parsedResponse
                            }).catch(e => console.error("Cache save error ignored:", e.message));
                        }

                        return resolve(parsedResponse);
                    } catch (error) {
                        console.warn(`[AI TRACE] Gemini Model ${model} failed for type [${type}]:`, error.response?.data?.error?.message || error.message);
                    }
                }

                // If all models fail, use heuristic fallback if provided
                if (heuristicFallback) {
                    console.log(`[AI TRACE] TRIGGERING Heuristic Fallback for [${type}] due to failures.`);
                    return resolve(heuristicFallback());
                }

                reject(new Error('All AI models failed'));
            } finally {
                activeRequests--;
                console.log(`[AI DEBUG] activeRequests decremented: ${activeRequests} (Type: ${type})`);
            }
        }).catch(err => {
            console.error('[AI TRACE] Queue execution error:', err);
            if (heuristicFallback) resolve(heuristicFallback());
            else reject(err);
        });
    });
};

/**
 * Generate a weekly summary
 */
const getWeeklySummary = async (userId, stats, forceRefresh = false) => {
    const prompt = getWeeklySummaryPrompt(stats);
    const fallback = () => ({
        strengths: ["Consistent study pattern observed"],
        weaknesses: ["No significant weaknesses detected"],
        summary: `You've maintained a consistency score of ${stats.completionRate || 0}%. Great job staying on track!`,
        trend: 'stable'
    });
    return await generateAIResponse(userId, 'weekly_summary', prompt, fallback, forceRefresh);
};

/**
 * Generate habit insights
 */
const getHabitInsights = async (userId, habitData, forceRefresh = false) => {
    const prompt = getHabitInsightPrompt(habitData);
    const fallback = () => ({
        insights: ["Maintain your consistency to see long-term results.", "Identify your high-energy hours for tough subjects."],
        suggestions: ["Set daily reminders", "Review habits weekly"],
        consistencyMessage: "You are doing reasonably well, keep it up!"
    });
    return await generateAIResponse(userId, 'habit_insights', prompt, fallback, forceRefresh);
};

/**
 * Detect burnout risk
 */
const getBurnoutRisk = async (userId, activityData, forceRefresh = false) => {
    const prompt = getBurnoutRiskPrompt(activityData);
    const fallback = () => ({
        riskLevel: "low",
        message: "Your study-life balance looks stable. Keep taking regular breaks!",
        recommendations: ["Ensure 7-8 hours of sleep", "Take brief walks between sessions"]
    });
    return await generateAIResponse(userId, 'burnout_risk', prompt, fallback, forceRefresh);
};

/**
 * Suggest project execution strategy
 */
const getProjectSuggestions = async (userId, projectData, forceRefresh = false) => {
    const prompt = getProjectSuggestionsPrompt(projectData);
    const fallback = () => ({
        priorities: ["Focus on nearest deadlines first", "Break down complex tasks"],
        timelineAdvice: "Pace yourself to avoid last-minute rushing.",
        executionTips: ["Batch similar tasks together", "Review progress at the end of the day"]
    });
    return await generateAIResponse(userId, 'project_suggestions', prompt, fallback, forceRefresh);
};

/**
 * Generate an adaptive plan
 */
const getAdaptivePlan = async (userId, workloadData, forceRefresh = false) => {
    const prompt = getAdaptivePlanPrompt(workloadData);
    const fallback = () => ({
        scheduleAdjustments: ["Shift difficult tasks to your peak energy hours", "Block out deep work time on weekends"],
        workloadAssessment: "Your current workload appears manageable.",
        recommendation: "Try to balance high-intensity tasks with lighter reflections."
    });
    return await generateAIResponse(userId, 'adaptive_plan', prompt, fallback, forceRefresh);
};

// Also keep existing utility for generic task generation (used by other endpoints potentially)
const generateStudyTasks = async (topic) => {
    const prompt = getTaskGenerationPrompt(topic);
    const fallback = () => ({
        tasks: [
            `Determine layout and prep surface for ${topic}`,
            `Gather necessary tools and supplies for ${topic}`,
            `Execute the first phase of ${topic}`,
            `Check quality and refine ${topic}`,
            `Finalize and clean up ${topic}`
        ]
    });
    // No caching needed for generic topical tasks right now as it doesn't involve user context structurally in the same way
    return await generateAIResponse(null, 'study_tasks', prompt, fallback, true);
};


/**
 * Get all insights in one single call (High performance)
 */
const getMasterInsight = async (userId, userData, forceRefresh = false) => {
    const prompt = getMasterInsightPrompt(userData);
    const fallback = () => ({
        weeklySummary: { strengths: [], weaknesses: [], summary: "Summary temporarily unavailable", trend: 'stable' },
        habitInsights: { insights: [], suggestions: [], consistencyMessage: "Consistency analysis unavailable" },
        burnoutRisk: { riskLevel: "low", message: "Wellness status check skipped", recommendations: [] },
        goalStrategy: { priorities: [], timelineAdvice: "Strategy check skipped", executionTips: [] },
        adaptivePlan: { scheduleAdjustments: [], workloadAssessment: "Plan check skipped", recommendation: "" }
    });
    return await generateAIResponse(userId, 'master_insight', prompt, fallback, forceRefresh);
};

module.exports = {
    generateAIResponse,
    getWeeklySummary,
    getHabitInsights,
    getBurnoutRisk,
    getProjectSuggestions,
    getAdaptivePlan,
    getMasterInsight,
    generateStudyTasks,
    getAIStatus
};
