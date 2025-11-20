import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { handleSubscriptionSuccess } from "../controller/paymentController/payment.controller.js";


const router = express.Router();

router.use(isAuthenticated)

router.post("/subscription-sucess", handleSubscriptionSuccess)
// router.get("/status", getSubscriptionStatus)
// router.post("/cancel", cancelSubscription)

export default router;