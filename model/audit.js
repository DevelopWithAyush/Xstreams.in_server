import mongoose, { Types } from "mongoose";

const auditSchema = new mongoose.Schema({
    user: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    websiteUrl: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Audit = mongoose.model("Audit", auditSchema);

export default Audit;