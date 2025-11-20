import mongoose from "mongoose";

import { v4 as uuid } from "uuid";
import { getBase64 } from "../lib/helper.js";
import jwt from "jsonwebtoken";

export const connectDB = (url) => {
    mongoose
        .connect(url, {
            dbName: process.env.NODE_ENV === "development" ? "AXTO_TEXTNET" : "AXTO_MAINNET",
        })
        .then((data) => {
            console.log(`connect to DB : ${data.connection.host}`);
        })

    .catch((err) => {
        console.log(err);
    });
};

export const sendToken = (res, user, code, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    return res.status(code).cookie("authToken", token, cookieOption).json({
        success: true,
        message,
    });
};

export const cookieOption = {
    domain:".axto.ai",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};


