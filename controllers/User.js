import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const avatar = req.files.avatar.tempFilePath;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const otp = await Math.floor(Math.random() * 1000000);
        const otp_expiry = await new Date(Date.now() + process.env.OTP_Expiry * 60 * 1000);
        const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "taskify_native_app",
        })
        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
            otp,
            otp_expiry
        });
        fs.rmSync("./tmp", { recursive: true });
        await sendMail(email, "Verify your account", `Your OTP is ${otp}`);
        await sendToken(res, user, 201, "Otp sent to your email, please verify your account");
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please enter all fields" });
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }
        await sendToken(res, user, 200, "Login successfully");
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const verifyUser = async (req, res) => {
    try {
        const otp = await Number(req.body.otp);
        const user = await User.findById(req.user._id);
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        else if (user.otp_expiry < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }
        else {
            user.verified = true;
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
            await sendToken(res, user, 200, "Account verified successfully");
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const logoutUser = async (req, res) => {
    try {
        res.status(200).cookie("token", null, { expires: new Date(Date.now()) }).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const user = await User.findById(req.user._id);
        user.tasks.push({ title, description, completed: false, createdAt: new Date(Date.now()) });
        await user.save();
        res.status(200).json({ success: true, message: "Task added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);
        user.tasks = user.tasks.map((task) => {
            if (task._id.toString() === taskId) {
                task.completed = !task.completed;
            }
            return task;
        });
        await user.save();
        res.status(200).json({ success: true, message: "Task updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);
        user.tasks = user.tasks.filter((task) => task._id.toString() !== taskId);
        await user.save();
        res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        await sendToken(res, user, 200, `Welcome ${user.name}`);
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const avatar = req.files.avatar.tempFilePath;
        const { name } = req.body;
        if (name) {
            user.name = name;
        }
        if (avatar) {
            if (user.avatar.public_id) {
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }
            const mycloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "taskify_native_app",
            })
            fs.rmSync("./tmp", { recursive: true });
            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            }
        }
        await user.save();
        await sendToken(res, user, 200, "Profile updated successfully");
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Please enter all fields" });
        }
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid old password" });
        }
        user.password = newPassword;
        await user.save();
        await sendToken(res, user, 200, "Password updated successfully");
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        else {
            const otp = Math.floor(Math.random() * 1000000);
            const otp_expiry = new Date(Date.now() + process.env.Reset_Password_OTP_Expiry * 60 * 1000);
            user.resetPasswordOtp = otp;
            user.resetPasswordOtpExpiry = otp_expiry;
            await user.save();
            await sendMail(email, "Reset your password", `Your OTP for resetting the password is ${otp}, If not requested by you please ignore this email.`);
            await sendToken(res, user, 200, `Otp sent to your email: ${email}, please verify your account`);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        if (!otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Please enter all fields" });
        }
        const user = await User.findOne({ resetPasswordOtp: otp, resetPasswordOtpExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, message: "OTP invalid or expired" });
        }
        user.password = newPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpiry = null;
        await user.save();
        await sendToken(res, user, 200, "Password reset successfully");
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
}