import jwt from "jsonwebtoken";
import { User } from "../models/users.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ success: false, message: "Register/Login to continue" });
        } else {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            req.user = currentUser;
            next();
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}