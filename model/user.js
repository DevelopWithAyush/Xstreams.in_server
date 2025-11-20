import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    auditCredit: {
        type: String,
        default: "5",
        required: true,
        enum:["5","UNLIMITED"],
    },
    subscription: {
        type: String,
        default: "FREE",
        required: true,
        enum: ["FREE","LITE","SMART","PRO"],
    },
    subscriptionStartDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    subscriptionEndDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    usedAuditCredit: {
        type: Number,
        default: 0,
        required: true,
    }
}, {
    timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;