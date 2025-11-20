import express from "express";
import { createCTA } from "../controller/CTAController/Cta.Controller.js";
import { handleCallToActionValidator } from "../validator/Cta-validator.js";

const router = express.Router();

router.post("/create", handleCallToActionValidator(), createCTA);

export default router;