import express from "express";
import { registerUser, loginUser, verifyUser, logoutUser, addTask, updateTask, deleteTask, getProfile, updateProfile, updatePassword, forgotPassword, resetPassword } from "../controllers/User.js";
import { isAuthenticated } from "../middleware/authentication.js";

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/verify").post(isAuthenticated, verifyUser);

router.route("/login").post(loginUser);

router.route("/logout").get(logoutUser);

router.route("/addTask").post(isAuthenticated, addTask);

router.route("/task/:taskId").put(isAuthenticated, updateTask).delete(isAuthenticated, deleteTask);

router.route("/getprofile").get(isAuthenticated, getProfile);

router.route("/updateprofile").put(isAuthenticated, updateProfile);

router.route("/updatepassword").put(isAuthenticated, updatePassword);

router.route("/forgotpassword").post(forgotPassword);

router.route("/resetpassword").put(resetPassword);

export default router;