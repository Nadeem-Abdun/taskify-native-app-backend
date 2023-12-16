import mongoose from 'mongoose';

export const connectToMongoDB = async (source) => {
    try {
        await mongoose.connect(process.env.MongoURI);
        await console.log(`Connected to MongoDB sucessfully from ${source}`);
        await mongoose.connection.on('disconnected', () => {
            console.warn('Disconnected from MongoDB');
        });
        await mongoose.connection.on('error', () => {
            console.error(`MongoDB Connection Error: ${error.message}`);
        });
    } catch (error) {
        console.error(`Error connecting to the MongoDB: ${error.message}`);
        process.exit(1);
    }
}