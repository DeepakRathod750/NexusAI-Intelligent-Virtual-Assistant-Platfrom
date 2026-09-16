const dbService = require('../services/db.service');
const Goal = require('../models/Goal');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await dbService.getGoals(userId);
        successResponse(res, 'Goals retrieved', goals);
    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch goals', err.message);
    }
};

const createGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, category, description, deadline } = req.body;

        if (!title) {
            return errorResponse(res, 400, 'Goal title is required');
        }

        const goal = await dbService.createGoal(userId, {
            title,
            category,
            description,
            deadline
        });

        successResponse(res, 'Goal created successfully', goal);
    } catch (err) {
        errorResponse(res, 500, 'Failed to create goal', err.message);
    }
};

const updateGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;

        // Fetch current goal to check progress
        const currentGoal = await Goal.findOne({ _id: id, user_id: userId });
        if (!currentGoal) {
            return errorResponse(res, 404, 'Goal not found or unauthorized');
        }

        // If progress changed, check for milestones (Now at EVERY percentage point)
        if (updateData.progress !== undefined && updateData.progress !== currentGoal.progress) {
            const newProgress = Math.round(updateData.progress);
            
            // Trigger if it's a new percentage point and tip doesn't exist yet
            const milestoneKey = newProgress.toString();
            if (newProgress > 0 && (!currentGoal.neural_milestones || !currentGoal.neural_milestones.has(milestoneKey))) {
                console.log(`🎯 Milestone reached: ${newProgress}% for goal "${currentGoal.title}"`);
                
                // We don't await this so the response is fast (Optimistic/Background generation)
                (async () => {
                    try {
                        const ollamaService = require('../services/ollama.service');
                        const aiTip = await ollamaService.generateGoalMilestoneTip(
                            currentGoal.title, 
                            currentGoal.category, 
                            newProgress
                        );
                        
                        // Refetch to ensure we don't overwrite other updates
                        const refreshedGoal = await Goal.findById(id);
                        if (!refreshedGoal.neural_milestones) refreshedGoal.neural_milestones = new Map();
                        
                        refreshedGoal.neural_milestones.set(milestoneKey, {
                            tip: aiTip.tip,
                            motivation: aiTip.motivation,
                            generatedAt: new Date()
                        });
                        
                        refreshedGoal.markModified('neural_milestones');
                        await refreshedGoal.save();
                        console.log(`✨ AI Milestone saved for ${newProgress}%`);
                    } catch (aiError) {
                        console.error('Failed to generate AI milestone tip:', aiError);
                    }
                })();
            }
        }

        // Update other fields
        Object.assign(currentGoal, updateData);
        const updated = await currentGoal.save();

        successResponse(res, 'Goal updated successfully', updated);
    } catch (err) {
        console.error('Update Goal Error:', err);
        errorResponse(res, 500, 'Failed to update goal', err.message);
    }
};

const deleteGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleted = await dbService.deleteGoal(id, userId);
        if (!deleted) {
            return errorResponse(res, 404, 'Goal not found or unauthorized');
        }

        successResponse(res, 'Goal deleted successfully');
    } catch (err) {
        errorResponse(res, 500, 'Failed to delete goal', err.message);
    }
};

module.exports = {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal
};
