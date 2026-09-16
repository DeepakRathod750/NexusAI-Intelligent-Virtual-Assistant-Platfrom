const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (already synced via middleware)
 */
const me = async (req, res) => {
    try {
        if (!req.user?.id) {
            return errorResponse(res, 401, 'Not authenticated');
        }

        successResponse(res, 'Authenticated user', {
            user: {
                id: req.user.id,
                firebaseUid: req.user.firebaseUid,
                email: req.user.email,
                full_name: req.user.full_name,
                role: req.user.role
            }
        });
    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch user', err.message);
    }
};

/**
 * PUT /api/auth/profile
 * Updates user profile details in MongoDB
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, avatar } = req.body;

        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (avatar !== undefined) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) return errorResponse(res, 404, 'User not found');

        successResponse(res, 'Profile updated successfully', {
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        errorResponse(res, 500, 'Failed to update profile', err.message);
    }
};

/**
 * DELETE /api/auth/profile
 * Deletes user profile and settings
 */
const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Delete user settings
        const Setting = require('../models/Setting');
        await Setting.deleteOne({ user_id: userId });
        
        // 2. Delete the user profile from MongoDB
        const user = await User.findByIdAndDelete(userId);
        if (!user) return errorResponse(res, 404, 'User not found');

        // Note: Firebase user is NOT deleted here. 
        // Admin intervention or a separate Firebase Admin call would be needed.
        
        successResponse(res, 'Account deleted successfully');
    } catch (err) {
        errorResponse(res, 500, 'Failed to delete account', err.message);
    }
};

module.exports = {
    me,
    updateProfile,
    deleteProfile
};
