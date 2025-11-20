import { body } from "express-validator";


export const sendOtpValidator = () => {
    return [
        body("email").isEmail().withMessage("Invalid email"),
    ];
};

export const verifyOtpValidator = () => {
    return [
        body("email").isEmail().withMessage("Invalid email"),
        body("otp").isString().withMessage("Invalid otp"),
    ];
};

