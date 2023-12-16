import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tasks: [
        {
            title: String,
            description: String,
            completed: Boolean,
            createdAt: Date
        }
    ],
    verified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number,
    },
    otp_expiry: {
        type: Date,
    },
    resetPasswordOtp: {
        type: Number,
    },
    resetPasswordOtpExpiry: {
        type: Date,
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    }
});

userSchema.methods.getJWTToken = function () {
    const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    });
    return token;
};

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", userSchema);