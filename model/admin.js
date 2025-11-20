import mongoose from "mongoose";


const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
        select: false,
    },
    otpExpiry: {
        type: Date,
        required: true,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;