import express from "express";
import { handleGoogleAuth, handleGoogleAuthCallback, handleLogout, handleGetUserDetails } from "../controller/authController/auth.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.get('/google', handleGoogleAuth)

router.get('/callback', handleGoogleAuthCallback) 


router.use(isAuthenticated)

router.get('/logout', handleLogout)
router.get('/me', handleGetUserDetails)



export default router;