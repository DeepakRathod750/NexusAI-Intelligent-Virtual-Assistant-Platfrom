const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://vedant1:NexusAI2026@cluster0.8qvy9.mongodb.net/?appName=Cluster0');
        console.log('Connected to DB');

        const email = 'test-' + Date.now() + '@example.com';
        console.log('Attempting to create user with email:', email);

        const user = await User.create({ email });
        console.log('SUCCESS: User Created:', user);

        process.exit(0);
    } catch (err) {
        console.error('FAILED TO CREATE USER!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`- Field [${key}]: ${err.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

test();
