import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing MongoDB connection...');
console.log('📍 Connecting to:', process.env.MONGO_URI?.substring(0, 30) + '...');

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then((conn) => {
    console.log('✅ MongoDB CONNECTED:', conn.connection.host);
    process.exit(0);
})
.catch((error) => {
    console.log('❌ MongoDB connection FAILED:');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Full error:', error);
    process.exit(1);
});

// Timeout de seguridad
setTimeout(() => {
    console.log('⏱️ Connection timeout after 10 seconds');
    process.exit(1);
}, 10000);
