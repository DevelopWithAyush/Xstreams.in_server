import { TryCatch } from "../../utility/utility.js";
import Admin from "../../model/admin.js";
import { cookieOption } from "../../utility/features.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { validationResult } from "express-validator";

export const sendOtp = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res.status(400).json({ message: "Admin not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    await Admin.updateOne({ email }, { otp, otpExpiry });
    //setup nodemailer to send otp to admin email 
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for login",
        text: `Your OTP for login is ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
});


export const verifyOtp = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email }).select("+otp +otpExpiry");
    if (!admin) {
        return res.status(400).json({ message: "Admin not found" });
    }
    if (admin.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }
    if (admin.otpExpiry < Date.now()) {
        return res.status(400).json({ message: "OTP expired" });
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    res.cookie("token", token, cookieOption);
    res.status(200).json({ success: true, message: "Admin logged in successfully" });
});

export const logoutAdmin = TryCatch(async (req, res, next) => { 
    res.cookie("token", null, { ...cookieOption, maxAge: 0 });
    res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

export const meAdmin = TryCatch(async (req, res, next) => {
    const admin = await Admin.findById(req.admin._id);
    res.status(200).json({ success: true, admin });
});



export const createAdmin = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (admin) {
        return res.status(400).json({ message: "Admin already exists" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const newAdmin = await Admin.create({ email, otp, otpExpiry: Date.now() + 10 * 60 * 1000 });
    //setup nodemailer to send otp to admin email 
    
    res.status(200).json({ success: true, admin: newAdmin });
});