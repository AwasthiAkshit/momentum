/**
 * Calculates the current streak for a habit based on its logs.
 * A streak is alive if the habit was completed today or yesterday.
 * @param {Array} logs - Array of HabitLog objects
 * @returns {number} The current streak
 */
const calculateCurrentStreak = (logs) => {
    if (!logs || logs.length === 0) return 0;

    // Filter only completed logs and sort by date descending
    const completedDates = logs
        .filter(log => log.status === 'completed')
        .map(log => {
            const d = new Date(log.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        })
        .sort((a, b) => b - a);

    if (completedDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTime = yesterday.getTime();

    const lastCompletionTime = completedDates[0];

    // If last completion was not today or yesterday, streak is broken
    if (lastCompletionTime < yesterdayTime) {
        return 0;
    }

    let streak = 0;
    let expectedTime = lastCompletionTime;

    for (const logTime of completedDates) {
        if (logTime === expectedTime) {
            streak++;
            // Move expected time to the previous day
            const prevDay = new Date(expectedTime);
            prevDay.setDate(prevDay.getDate() - 1);
            expectedTime = prevDay.getTime();
        } else if (logTime < expectedTime) {
            // Gap found
            break;
        }
        // If logTime > expectedTime, it means multiple logs for the same day or out of order (shouldn't happen with sorted set)
    }

    return streak;
};

/**
 * Calculates consistency as a percentage of successful days over duration or elapsed days.
 * @param {number} successfulDays 
 * @param {number} durationDays 
 * @param {Date|string} startDate 
 * @returns {number} Percentage
 */
const calculateConsistency = (successfulDays, durationDays, startDate) => {
    if (!startDate || !durationDays || durationDays <= 0) return 0;

    // Calculate how many days have elapsed since the habit started
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const elapsedMs = today.getTime() - start.getTime();
    let elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day itself

    // Cap elapsedDays to the total duration of the habit
    if (elapsedDays > durationDays) {
        elapsedDays = durationDays;
    }

    // If somehow elapsedDays is 0 or negative (future start date), avoid division by zero
    if (elapsedDays <= 0) return 0;

    // Cap successful days to elapsed days to prevent > 100% bugs
    const safeSuccessfulDays = Math.min(successfulDays, elapsedDays);

    return Math.round((safeSuccessfulDays / elapsedDays) * 100);
};

module.exports = {
    calculateCurrentStreak,
    calculateConsistency
};
