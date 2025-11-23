import mongoose from 'mongoose';

export const connectDB = async () =>{
    try {
     const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
     });
    console.log (`MongoDB CONNECTED: ${conn.connection.host}`);
    } catch (error) {
        console.log("❌ MongoDB connection error:");
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        process.exit(1); //1 FAILURE (PELIGROOOO!!)
    }
}