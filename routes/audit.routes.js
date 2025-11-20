import express from "express";
import { getAuditReport, getMultiPageAuditReport, multiPageAudit, singlePageAudit } from "../controller/auditController/audit.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { createAuditValidator } from "../validator/audit-validator.js";

const router = express.Router();

router.use(isAuthenticated)

router.post("/", createAuditValidator(), singlePageAudit);
router.get("/:id", getAuditReport);
router.post("/multi", createAuditValidator(), multiPageAudit);
router.get("/multi/:id", getMultiPageAuditReport);

export default router;