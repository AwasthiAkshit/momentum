/**
 * Weekly Summary Prompt
 * Analyzes overall productivity, habits, and daily journaling reflections.
 */
const getWeeklySummaryPrompt = (analyticsData) => `
Analyze the following user productivity data and generate a highly personalized, concise weekly performance summary.
You MUST specifically mention their actual data (e.g., their exact completion rate, streak, or mood trends) in your summary and feedback.
Do NOT give generic advice. Focus on what went well and what needs improvement based ONLY on this data.

User Data:
${JSON.stringify(analyticsData, null, 2)}

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "summary": "✨ AI Summary: ...",
  "trend": "up" | "down" | "stable"
}
`;

/**
 * Habit Insight Prompt
 * Analyzes habit consistency patterns and provides suggestions.
 */
const getHabitInsightPrompt = (habitData) => `
Analyze the following habit consistency patterns. 
You MUST explicitly name the user's actual habits (e.g., "Reading", "Exercise") in your insights and suggestions.
Do NOT give generic advice. Base your suggestions entirely on which specific habits have high or low consistency.

Data Definitions:
- consistency: A percentage (0-100%). It represents [completed days / goal duration]. 
  - 0-30%: Very Low (Needs urgent attention)
  - 31-60%: Moderate (Needs more regularity)
  - 61-90%: High (Good progress)
  - 91-100%: Exceptional (Maintain this!)
- streak: Number of consecutive days WITHOUT MISSING. If streak is 0, it means the user missed today and/or yesterday, breaking the continuous chain.

Habit Data:
${JSON.stringify(habitData, null, 2)}

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "insights": ["...", "..."],
  "suggestions": ["...", "..."],
  "consistencyMessage": "✨ AI Analysis: ..."
}
`;

/**
 * Burnout Risk Prompt
 * Analyzes activity drops, mood changes, and reflection text to detect burnout risk.
 */
const getBurnoutRiskPrompt = (activityData) => `
Analyze the following activity data to detect potential burnout risk. 
You MUST reference specific mood patterns or reflection themes (if provided) in your message.
Do NOT give generic wellness advice unless it directly correlates to their recent mood dips or data drop-offs.

Activity Data:
${JSON.stringify(activityData, null, 2)}

Risk Levels:
- "low": Healthy activity, consistent or balanced.
- "medium": Noticeable drop in activity or moderate missed tasks.
- "high": Severe drop in activity, many missed tasks, or extremely low focus indicating likely burnout.

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "riskLevel": "low" | "medium" | "high",
  "message": "✨ AI Alert: ...",
  "recommendations": ["...", "..."]
}
`;

/**
 * Goal Strategy Prompt
 * Analyzes pending tasks, deadlines, and goal progress.
 */
const getProjectSuggestionsPrompt = (projectData) => `
Analyze the following goal data.
You MUST explicitly name the user's actual goals and reference their specific progress or deadlines.
Suggest task prioritization based ONLY on the active goals provided. Do NOT give generic goal management advice.

Goal Data:
${JSON.stringify(projectData, null, 2)}

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "priorities": ["...", "..."],
  "timelineAdvice": "✨ AI Strategy: ...",
  "executionTips": ["...", "..."]
}
`;

/**
 * Adaptive Plan Prompt
 * Analyzes available time, workload, and performance trends to suggest schedule adjustments.
 */
const getAdaptivePlanPrompt = (workloadData) => `
Analyze the following workload and performance data.
You MUST reference the user's specific number of pending tasks and average study hours.
Suggest highly practical schedule adjustments based directly on whether their pending tasks outnumber their available hours.
Do NOT give generic time management advice.

Workload Data:
${JSON.stringify(workloadData, null, 2)}

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "scheduleAdjustments": ["...", "..."],
  "workloadAssessment": "✨ AI Schedule Assessment: ...",
  "recommendation": "..."
}
`;

/**
 * Task Generation Prompt
 * Generates practical, actionable tasks for a given topic or goal.
 */
const getTaskGenerationPrompt = (topic) => `
Generate exactly 5 highly practical, actionable, and physical tasks for the following goal: "${topic}".
The tasks should be specific, sequence-oriented, and focus on real-world execution, not just academic study or theory.
Avoid vague words like "research," "learn," or "study" unless followed by a concrete output (e.g., "Draft a list of 5 key materials").
Instead, use action verbs like "Buy," "Install," "Write," "Prepare," "Clean," "Measure," etc.

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "tasks": ["...", "...", "...", "...", "..."]
}
`;

/**
 * Master Insight Prompt
 * Consolidates all AI categories into a single high-efficiency request.
 */
const getMasterInsightPrompt = (userData) => `
Analyze the following comprehensive user study data and generate 5 distinct insight categories.
You MUST reference specific data points (task titles, mood trends, habit names, scores) in each section.

User Data:
${JSON.stringify(userData, null, 2)}

Return strictly in the following JSON format without markdown wrapping or extra text:
{
  "weeklySummary": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "summary": "✨ AI Summary: ...",
    "trend": "up" | "down" | "stable"
  },
  "habitInsights": {
    "insights": ["...", "..."],
    "suggestions": ["...", "..."],
    "consistencyMessage": "✨ AI Analysis: ..."
  },
  "burnoutRisk": {
    "riskLevel": "low" | "medium" | "high",
    "message": "✨ AI Alert: ...",
    "recommendations": ["...", "..."]
  },
  "goalStrategy": {
    "priorities": ["...", "..."],
    "timelineAdvice": "✨ AI Strategy: ...",
    "executionTips": ["...", "..."]
  },
  "adaptivePlan": {
    "scheduleAdjustments": ["...", "..."],
    "workloadAssessment": "✨ AI Schedule Assessment: ...",
    "recommendation": "..."
  }
}
`;

module.exports = {
  getWeeklySummaryPrompt,
  getHabitInsightPrompt,
  getBurnoutRiskPrompt,
  getProjectSuggestionsPrompt,
  getAdaptivePlanPrompt,
  getTaskGenerationPrompt,
  getMasterInsightPrompt
};
