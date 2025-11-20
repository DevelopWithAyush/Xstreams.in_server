import { TryCatch } from "../../utility/utility.js";
import User from "../../model/user.js";
import Audit from "../../model/audit.js";

export const handleGetUsers = TryCatch(async (req, res) => {
    const users = await User.find();
    res.status(200).json({ users });
});

export const handleGetUserAuditDetails = TryCatch(async (req, res) => {
    const { id } = req.params;
    const user = await Audit.find({ user: id }).populate("user");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const transformedUser = user.map((item) => {
        return {
            _id: item.user._id,
            name: item.user.name,
            email: item.user.email,
            profilePicture: item.user.profilePicture,
            websiteUrl: item.websiteUrl,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }
    })
    res.status(200).json({ user: transformedUser });
});


