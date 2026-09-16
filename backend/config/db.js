const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ CRITICAL: MONGO_URI is not defined in environment variables.');
        // Log keys of all defined variables (not values) to help debug Render config
        console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));
        return; // Prevent crash, but app will be broken
    }

    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // No exit(1) to let the server stay up for debugging
    }
};

module.exports = connectDB;
