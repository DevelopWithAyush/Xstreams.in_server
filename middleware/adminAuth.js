import jwt from "jsonwebtoken";
import Admin from "../model/admin.js";

export const isAdmin = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    req.admin = admin;
    next();
};