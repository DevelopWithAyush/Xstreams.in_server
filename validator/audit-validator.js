import { body } from "express-validator";

export const createAuditValidator = () => {
    return [
        body("websiteUrl").isURL().withMessage("Invalid website URL"),
        body("auditType")
            .optional()
            .isIn(['single', 'whole-site'])
            .withMessage("Audit type must be either 'single' or 'whole-site'"),
        body("maxPages")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Max pages must be a number between 1 and 100"),
    ]
}