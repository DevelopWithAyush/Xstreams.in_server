import { body } from "express-validator";

export const widgetValidator = () => {
    return [
        body("url").isURL().withMessage("Invalid URL"),
    ];
}