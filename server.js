import { app } from "./app.js";
import { config } from "dotenv";
import { connectToMongoDB } from "./database/connectToMongoDB.js";
import { v2 as cloudinary } from 'cloudinary';

// Configuring the dotenv setup providing the path to the config.env file
config({
    path: './config/config.env',
})

// Configuring the cloudinary setup
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectToMongoDB('Server_Home');

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});