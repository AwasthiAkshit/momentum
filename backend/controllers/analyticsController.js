const Analytics = require('../models/analyticsModel');
const ProjectGoal = require('../models/projectGoalModel');
const QuickTask = require('../models/quickTaskModel');
const Goal = require('../models/goalModel');
const Task = require('../models/taskModel');
const JournalEntry = require('../models/journalModel');
const ProjectTask = require('../models/projectTaskModel');
const HabitGoal = require('../models/habitGoalModel');
const HabitLog = require('../models/habitLogModel');
const DailyLog = require('../models/dailyLogModel');

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        // 1. Fetch ALL data sources (including archived for retention)
        const [
            projectTasks,
            quickTasks,
            goalTasks,
            habitGoals,
            projectGoals,
            goals
        ] = await Promise.all([
            ProjectTask.find({ user: userId }),
            QuickTask.find({ user: userId }),
            Task.find({ user: userId }),
            HabitGoal.find({ user: userId }),
            ProjectGoal.find({ user: userId }),
            Goal.find({ user: userId })
        ]);

        const filterForRetention = (item) => {
            if (!item.isArchived) return true;
            const isRecentlyArchived = item.updatedAt && new Date(item.updatedAt) >= monthAgo;
            const isFullyComplete = (item.consistency || item.progress || item.progressPercentage || 0) >= 100;
            return isRecentlyArchived && isFullyComplete;
        };

        // Grace periods & cutoff dates
        const now = new Date();
        const grace24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const grace48h = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        const grace72h = new Date(now.getTime() - (72 * 60 * 60 * 1000));
        const cutoff7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        // 2. Aggregate Habits (Max 40 points base)
        const allHabitItems = [
            ...habitGoals.filter(filterForRetention),
            ...goals.filter(g => g.type === 'habit' && filterForRetention(g))
        ];
        const effectiveHabits = allHabitItems.filter(h =>
            (h.consistency || h.progressPercentage || 0) > 0 ||
            (h.createdAt && new Date(h.createdAt) < grace48h)
        );
        const activeHabitsCount = effectiveHabits.length;
        const avgHabitConsistency = activeHabitsCount === 0 ?
            (allHabitItems.length > 0 ? 100 : 0) :
            effectiveHabits.reduce((acc, h) => acc + (h.consistency || h.progressPercentage || 0), 0) / activeHabitsCount;

        const maxStreak = allHabitItems.reduce((max, h) => Math.max(max, h.streak || 0), 0);
        const streakScore = Math.min(maxStreak * 2, 10); // 10 pts max, 2 pts per day

        // 3. Aggregate Projects/Goals
        const allProjectItems = [
            ...projectGoals.filter(filterForRetention),
            ...goals.filter(g => g.type !== 'habit' && filterForRetention(g))
        ];
        const effectiveProjects = allProjectItems.filter(p =>
            (p.progress || p.progressPercentage || 0) > 0 ||
            (p.createdAt && new Date(p.createdAt) < grace72h)
        );
        const activeProjectsCount = effectiveProjects.length;
        const avgProjectProgress = activeProjectsCount === 0 ?
            (allProjectItems.length > 0 ? 100 : 0) :
            effectiveProjects.reduce((acc, p) => acc + (p.progress || p.progressPercentage || 0), 0) / activeProjectsCount;

        // 4. Tasks and Additive Task Score
        const quickTaskCompleted = quickTasks.filter(t => t.isCompleted && !t.isArchived).length;
        const quickTaskTotal = quickTasks.filter(t => !t.isArchived).length;
        const quickTaskPending = quickTasks.filter(t => !t.isCompleted && !t.isArchived).length;

        const recentQuickTasksCompleted = quickTasks.filter(t =>
            t.isCompleted && !t.isArchived && t.updatedAt && new Date(t.updatedAt) >= cutoff7Days
        ).length;

        const recentAllTasksCompleted = [...projectTasks, ...goalTasks].filter(t =>
            t.status === 'completed' && !t.isArchived && t.updatedAt && new Date(t.updatedAt) >= cutoff7Days
        ).length;

        const totalRecentTasksCompleted = recentQuickTasksCompleted + recentAllTasksCompleted;

        const quickTaskCompletionRate = quickTaskTotal === 0 ? 0 : Math.round((quickTaskCompleted / quickTaskTotal) * 100);

        // Base task score calculation
        // 10 pts per completed task (all types), plus 50% of the average project progress
        // Uncapped internally so users can "grind" quick tasks to make up for bad habits
        let combinedTaskScore = (totalRecentTasksCompleted * 10) + (avgProjectProgress * 0.5);

        console.log(`[DASHBOARD DEBUG] User: ${req.user.id}`);
        console.log(`[DASHBOARD DEBUG] quickTaskTotal: ${quickTaskTotal}, quickTaskCompleted: ${quickTaskCompleted}, recentQuickTasksCompleted: ${recentQuickTasksCompleted}`);
        console.log(`[DASHBOARD DEBUG] avgProjectProgress: ${avgProjectProgress}, combinedTaskScore: ${combinedTaskScore}`);


        // 5. Early Bonuses and Overdue Penalties
        let earlyBonuses = 0;
        let overduePenalties = 0;

        const checkDeadlineBonusPenalty = (items, isCompletedProp) => {
            items.forEach(item => {
                const isItemCompleted = item.status === 'completed' || item[isCompletedProp];
                if (item.deadline && !item.isArchived) {
                    const deadline = new Date(item.deadline);
                    if (isItemCompleted) {
                        const completedAt = item.updatedAt ? new Date(item.updatedAt) : now;
                        // Give +10 bonus if finished >24h early
                        const isEarly = (deadline.getTime() - completedAt.getTime()) > (24 * 60 * 60 * 1000);
                        if (isEarly && completedAt >= cutoff7Days) {
                            earlyBonuses += 10;
                        }
                    } else {
                        // Penalty if overdue
                        if (now > deadline) {
                            overduePenalties += 5;
                        }
                    }
                }
            });
        };

        checkDeadlineBonusPenalty(allProjectItems, 'isCompleted');
        checkDeadlineBonusPenalty(projectTasks, 'isCompleted');
        checkDeadlineBonusPenalty(quickTasks, 'isCompleted');
        checkDeadlineBonusPenalty(goalTasks, 'isCompleted');

        // Overall Productivity Score
        const baseHabitScore = (avgHabitConsistency * 0.40); // Max 40

        let newProductivityScore = baseHabitScore + combinedTaskScore + streakScore;
        newProductivityScore += earlyBonuses;
        newProductivityScore -= overduePenalties;

        let productivityScore = Math.round(Math.min(Math.max(newProductivityScore, 0), 100));

        // 6. Practical Completion Rate (Rolling-window style)
        const allTasks = [...projectTasks, ...quickTasks, ...goalTasks];
        const activePending = allTasks.filter(t =>
            !t.isArchived && t.status !== 'completed' && !t.isCompleted
        ).length;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 14);
        const rollingWins = allTasks.filter(t =>
            (t.status === 'completed' || t.isCompleted) &&
            new Date(t.updatedAt || t.createdAt) >= cutoffDate
        ).length;

        const practicalDenominator = rollingWins + activePending;
        const completionRate = practicalDenominator === 0 ? 0 : (rollingWins / practicalDenominator) * 100;

        // 7. Upcoming Deadlines
        const pendingTasks = projectTasks.filter(t => !t.isArchived && t.status !== 'completed' && t.deadline);
        const pendingProjects = allProjectItems.filter(p =>
            (p.progress || p.progressPercentage || 0) < 100 && p.deadline
        );

        const upcomingDeadlines = [...pendingTasks, ...pendingProjects]
            .filter(item => new Date(item.deadline) > new Date())
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3);

        // Save to Analytics model
        let analytics = await Analytics.findOne({ user: userId });
        if (!analytics) analytics = new Analytics({ user: userId });
        analytics.productivityScore = productivityScore;
        analytics.completionRate = Math.round(completionRate);
        analytics.streakCount = maxStreak;
        await analytics.save();

        res.status(200).json({
            summary: {
                productivityScore,
                completionRate: Math.round(completionRate),
                totalStudyHours: 0,
                streakCount: maxStreak,
                activeHabits: activeHabitsCount,
                pendingTasks: activePending,
                quickTaskPending,
                quickTaskCompletionRate,
                avgConsistency: Math.round(avgHabitConsistency),
                avgProjectProgress: Math.round(avgProjectProgress)
            },
            upcomingDeadlines
        });
    } catch (error) {
        console.error("DASHBOARD ERROR:", error.stack);
        const fs = require('fs');
        try { fs.appendFileSync('debug-error.log', "DASHBOARD ERROR:\n" + error.stack + "\n\n"); } catch (e) { }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get chart data (mood distribution, productivity by week, habit consistency)
// @route   GET /api/analytics/charts
// @access  Private
const getCharts = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // --- 1. Mood Trends (Chronological Line Chart) ---
        const journals = await JournalEntry.find({ user: userId }).sort({ date: -1 });

        const moodValues = {
            great: 4,
            good: 3,
            neutral: 2,
            low: 1
        };

        const moodDistribution = [];

        // Generate current week labels (Mon-Sun)
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const mondayDate = new Date(now);
        mondayDate.setDate(now.getDate() - distanceToMonday);

        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate);
            d.setDate(mondayDate.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });

            // Find journal for this exact day
            const journalForDay = journals.find(j => {
                const jDate = new Date(j.date);
                return jDate.getDate() === d.getDate() && jDate.getMonth() === d.getMonth() && jDate.getFullYear() === d.getFullYear();
            });

            moodDistribution.push({
                name: dateStr,
                value: journalForDay ? moodValues[journalForDay.mood] : null,
                moodLabel: journalForDay ? journalForDay.mood.charAt(0).toUpperCase() + journalForDay.mood.slice(1) : 'No Entry'
            });
        }

        const [
            projectTasks,
            quickTasks,
            goalTasks,
            habitGoals,
            projectGoals,
            goals
        ] = await Promise.all([
            ProjectTask.find({ user: userId }),
            QuickTask.find({ user: userId }),
            Task.find({ user: userId }),
            HabitGoal.find({ user: userId }),
            ProjectGoal.find({ user: userId }),
            Goal.find({ user: userId })
        ]);

        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const filterForRetention = (item) => {
            if (!item.isArchived) return true;
            const isRecentlyArchived = item.updatedAt && new Date(item.updatedAt) >= monthAgo;
            const isFullyComplete = (item.consistency || item.progress || item.progressPercentage || 0) >= 100;
            return isRecentlyArchived && isFullyComplete;
        };

        const allHabitItems = [
            ...habitGoals.filter(filterForRetention),
            ...goals.filter(g => g.type === 'habit' && filterForRetention(g))
        ];
        const allProjectItems = [
            ...projectGoals.filter(filterForRetention),
            ...goals.filter(g => g.type !== 'habit' && filterForRetention(g))
        ];

        // Fetch all relevant logs for historical trend
        // monthAgo is already defined and accurate

        const [habitLogs, goalLogs] = await Promise.all([
            HabitLog.find({ user: userId, date: { $gte: monthAgo }, status: 'completed' }),
            DailyLog.find({ user: userId, date: { $gte: monthAgo } })
        ]);

        const weekLabels = ['3w Ago', '2w Ago', 'Last Week', 'This Week'];
        const productivityByWeek = [];
        for (let w = 3; w >= 0; w--) {
            const wEnd = new Date(now);
            wEnd.setDate(wEnd.getDate() - w * 7);
            const wStart = new Date(wEnd);
            wStart.setDate(wStart.getDate() - 6);
            wStart.setHours(0, 0, 0, 0);

            let weekScore = 0;

            if (w === 0) {
                // SYNC WITH DASHBOARD: Use the exact current components
                // Grace periods
                const now = new Date();
                const grace24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                const grace48h = new Date(now.getTime() - (48 * 60 * 60 * 1000));
                const grace72h = new Date(now.getTime() - (72 * 60 * 60 * 1000));

                const effectiveHabits = allHabitItems.filter(h =>
                    (h.consistency || h.progressPercentage || 0) > 0 ||
                    (h.createdAt && new Date(h.createdAt) < grace48h)
                );
                const activeHabitsCount = effectiveHabits.length;
                const avgHabitConsistency = activeHabitsCount === 0 ?
                    (allHabitItems.length > 0 ? 100 : 0) :
                    effectiveHabits.reduce((acc, h) => acc + (h.consistency || h.progressPercentage || 0), 0) / activeHabitsCount;

                const maxStreak = allHabitItems.reduce((max, h) => Math.max(max, h.streak || 0), 0);
                const streakScore = Math.min(maxStreak * 2, 10);

                const effectiveProjects = allProjectItems.filter(p =>
                    (p.progress || p.progressPercentage || 0) > 0 ||
                    (p.createdAt && new Date(p.createdAt) < grace72h)
                );
                const activeProjectsCount = effectiveProjects.length;
                const avgProjectProgress = activeProjectsCount === 0 ?
                    (allProjectItems.length > 0 ? 100 : 0) :
                    effectiveProjects.reduce((acc, p) => acc + (p.progress || p.progressPercentage || 0), 0) / activeProjectsCount;

                const cutoff7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

                const currentQuickTasksCompletedRecent = (quickTasks || []).filter(t =>
                    t.isCompleted && !t.isArchived && t.updatedAt && new Date(t.updatedAt) >= cutoff7Days
                ).length;

                const currentAllTasksCompletedRecent = [...(projectTasks || []), ...(goalTasks || [])].filter(t =>
                    t.status === 'completed' && !t.isArchived && t.updatedAt && new Date(t.updatedAt) >= cutoff7Days
                ).length;

                const totalRecentCompleted = currentQuickTasksCompletedRecent + currentAllTasksCompletedRecent;

                let combinedTaskScore = (totalRecentCompleted * 10) + (avgProjectProgress * 0.5);

                let earlyBonuses = 0;
                let overduePenalties = 0;

                const checkDeadlineBonusPenalty = (items, isCompletedProp) => {
                    items.forEach(item => {
                        const isItemCompleted = item.status === 'completed' || item[isCompletedProp];
                        if (item.deadline && !item.isArchived) {
                            const deadline = new Date(item.deadline);
                            if (isItemCompleted) {
                                const completedAt = item.updatedAt ? new Date(item.updatedAt) : now;
                                const isEarly = (deadline.getTime() - completedAt.getTime()) > (24 * 60 * 60 * 1000);
                                if (isEarly && completedAt >= cutoff7Days) {
                                    earlyBonuses += 10;
                                }
                            } else {
                                if (now > deadline) {
                                    overduePenalties += 5;
                                }
                            }
                        }
                    });
                };

                checkDeadlineBonusPenalty(allProjectItems, 'isCompleted');
                checkDeadlineBonusPenalty(projectTasks, 'isCompleted');
                checkDeadlineBonusPenalty(quickTasks, 'isCompleted');
                checkDeadlineBonusPenalty(goalTasks, 'isCompleted');

                const baseHabitScore = (avgHabitConsistency * 0.40);

                let wScore = baseHabitScore + combinedTaskScore + streakScore;
                wScore += earlyBonuses;
                wScore -= overduePenalties;

                weekScore = Math.round(Math.min(Math.max(wScore, 0), 100));
            } else {
                // HISTORICAL: Use logs
                const wTasks = [...(projectTasks || []), ...(quickTasks || [])].filter((t) => {
                    const d = new Date(t.updatedAt || t.createdAt || now);
                    return d >= wStart && d <= wEnd;
                });
                const wCompleted = wTasks.filter((t) => t.status === 'completed' || t.isCompleted).length;
                const taskScore = wTasks.length === 0 ? 0 : (wCompleted / wTasks.length) * 100;

                const wHabitLogs = (habitLogs || []).filter(l => l.date >= wStart && l.date <= wEnd).length;
                const wGoalLogs = (goalLogs || []).filter(l => l.date >= wStart && l.date <= wEnd);
                const wGoalCompleted = wGoalLogs.reduce((acc, l) => acc + (l.completedTasks || 0), 0);

                const totalExpectedHabits = Math.max(1, (allHabitItems || []).length * 7);
                const habitScore = Math.min(100, ((wHabitLogs + wGoalCompleted) / totalExpectedHabits) * 100);

                weekScore = Math.round((habitScore * 0.4) + (taskScore * 0.5) + (habitScore * 0.1));
            }

            productivityByWeek.push({ name: weekLabels[3 - w], score: weekScore });
        }

        // --- 4. Habit consistency ---
        const habitConsistency = allHabitItems.map((h) => ({
            name: (h.title || h.name || '').length > 20 ? (h.title || h.name || '').slice(0, 18) + '…' : (h.title || h.name || ''),
            consistency: Math.round(h.consistency || h.progressPercentage || 0),
            streak: h.streak || 0,
        }));

        res.status(200).json({
            moodDistribution: moodDistribution || [],
            productivityByWeek: productivityByWeek || [],
            habitConsistency: habitConsistency || [],
            recentReflections: (journals || []).slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardData, getCharts };
