import { body } from "express-validator";


export const handleCallToActionValidator = () => {
    return [
        body("email").isEmail().withMessage("Invalid email address"),
        body("number").notEmpty().withMessage("Number is required"),   
    ]
}