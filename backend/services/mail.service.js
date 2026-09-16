const { Resend } = require('resend');

// Initialize Resend lazily or with a check to prevent crash on Render if env var is missing during build
const resendApiKey = process.env.RESEND_API_KEY;
let resend;

if (resendApiKey) {
    try {
        resend = new Resend(resendApiKey);
        console.log('✅ Resend mail service initialized');
    } catch (err) {
        console.error('❌ Failed to initialize Resend:', err.message);
    }
} else {
    console.warn('⚠️ RESEND_API_KEY is missing. Magic links will not be sent via email.');
}

/**
 * Send Magic Login Link
 * @param {string} email - Recipient email
 * @param {string} token - Unique magic token
 */
const sendMagicLink = async (email, token) => {
    const loginUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;

    if (!resend) {
        console.error('❌ Cannot send magic link: Resend not initialized (missing API key)');
        return { success: false, error: 'Mail service unavailable' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'NexusAI <onboarding@resend.dev>',
            to: email,
            subject: 'Your Magic Login Link - NexusAI',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333 text-align: center;">Welcome to NexusAI</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.5;">Click the button below to log into your account. This link will expire in 15 minutes.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Log In to NexusAI</a>
                    </div>
                    <p style="color: #888; font-size: 14px; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #aaa; font-size: 12px; text-align: center;">Or copy and paste this link into your browser:</p>
                    <p style="color: #007bff; font-size: 12px; word-break: break-all; text-align: center;">${loginUrl}</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Magic link sent to ${email} (ID: ${data.id})`);
        return { success: true };
    } catch (error) {
        console.error('Unexpected error sending magic link:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send 6-Digit OTP Code
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit code
 */
const sendOtp = async (email, otp) => {
    if (!resend) {
        console.error('❌ Cannot send OTP: Resend not initialized');
        return { success: false, error: 'Mail service unavailable' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'NexusAI <onboarding@resend.dev>',
            to: email,
            subject: `${otp} is your NexusAI login code`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px; text-align: center; background-color: #0a0a0b; color: white;">
                    <h2 style="color: #5046e5; margin-bottom: 30px;">NexusAI Login Code</h2>
                    <p style="color: #aaa; font-size: 16px; margin-bottom: 30px;">Enter the following code to access your workspace:</p>
                    <div style="background-color: #141417; padding: 20px; border-radius: 12px; border: 1px solid #ffffff10; display: inline-block;">
                        <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: white; font-family: monospace;">${otp}</span>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 40px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ OTP sent to ${email} (ID: ${data.id})`);
        return { success: true };
    } catch (error) {
        console.error('Unexpected error sending OTP:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendMagicLink,
    sendOtp
};
