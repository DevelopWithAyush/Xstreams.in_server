import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { ErrorHandler } from "../utility/utility.js";

export const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 401))
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const existingUser = await User.findById(decoded._id);
    if (!existingUser) {
        return next(new ErrorHandler("User not found", 404))
    }
    req.user = existingUser;
    next();
};