const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Firebase Authentication Middleware
 * Verifies the ID Token sent in the Authorization header.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, 'No authentication token provided');
        }

        const idToken = authHeader.split('Bearer ')[1];
        
        // Verify the Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;
        
        console.log(`[AUTH] Token successfully verified for: ${email}`);

        // Find or create the user in our MongoDB based on firebase UID
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // If user doesn't exist by UID, try by email (migration safety)
            user = await User.findOne({ email: email?.toLowerCase() });
            
            if (user) {
                // Link existing account
                user.firebaseUid = uid;
                if (!user.full_name && name) user.full_name = name;
                if (!user.avatar && picture) user.avatar = picture;
                await user.save();
            } else {
                // Create a new user profile
                user = await User.create({
                    firebaseUid: uid,
                    email: email?.toLowerCase(),
                    full_name: name || '',
                    avatar: picture || '',
                    role: 'user'
                });
            }
        }

        // Attach user information to the request
        req.user = {
            id: user._id.toString(),
            firebaseUid: uid,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error.message);
        return errorResponse(res, 401, 'Unauthorized: Invalid or expired token');
    }
};

module.exports = authenticate;

