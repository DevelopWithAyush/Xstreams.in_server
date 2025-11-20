import mongoose,{Types} from "mongoose";

const widgetSchema = new mongoose.Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    siteId: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,  
    },
    credit: {
        type: Number,
        default: 0,
    },
    creditLeft: {
        type: Number,
        default: 0,
    },
    creditUsed: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
}, {
    timestamps: true,
});


export const Widget = mongoose.model("Widget", widgetSchema);   