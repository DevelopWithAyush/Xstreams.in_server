import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { widgetValidator } from "../validator/widget-validator.js";
import { registerSite } from "../controller/widgetController/widgetController.js";

const router = express.Router();

router.use(isAuthenticated)

router.post("/register",widgetValidator(),registerSite)

export default router;