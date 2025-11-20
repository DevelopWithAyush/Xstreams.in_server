import express from "express";
import { createAdmin, logoutAdmin, meAdmin, sendOtp, verifyOtp } from "../controller/adminController/admin.controller.js";
import {
    handleBlogCreate,
    handleGetAllBlogs,
    handleGetBlogDetails,
    handleUpdateBlog,
    handleDeleteBlog,
    handleBlogSearch,
    handleGetCategories,
    handleGetTags
} from "../controller/adminController/blog.controller.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { sendOtpValidator, verifyOtpValidator } from "../validator/admin-validator.js";
import {
    validateBlogCreate,
    validateBlogUpdate,
    validateBlogDelete,
    validateGetBlog,
    validateGetAllBlogs,
    validateBlogSearch
} from "../validator/blog-validator.js";
import { upload } from "../middleware/upload.js";
import { handleGetUserAuditDetails, handleGetUsers } from "../controller/adminController/user.controller.js";



const router = express.Router();

// Admin Authentication Routes
router.post("/send-otp", sendOtpValidator(), sendOtp);
router.post("/verify-otp", verifyOtpValidator(), verifyOtp);

router.post("/create-admin", sendOtpValidator(), createAdmin);

// Protected Routes (require admin authentication)
router.use(isAdmin);
router.post("/logout", logoutAdmin);
router.post("/me", meAdmin);

// Blog Management Routes
router.post("/blog-create",
    upload.fields([
        { name: "featuredImage", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    validateBlogCreate(),
    handleBlogCreate
);

router.get("/blogs", validateGetAllBlogs(), handleGetAllBlogs);
router.get("/blog/:slug", validateGetBlog(), handleGetBlogDetails);

router.put("/blog/:slug",
    upload.fields([
        { name: "featuredImage", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    validateBlogUpdate(),
    handleUpdateBlog
);

router.delete("/blog/:slug", validateBlogDelete(), handleDeleteBlog);

// Blog Utility Routes
router.get("/blog-search", validateBlogSearch(), handleBlogSearch);
router.get("/blog-categories", handleGetCategories);
router.get("/blog-tags", handleGetTags);
 



// User management routes
router.get("/users", handleGetUsers);
router.get("/user/:id", handleGetUserAuditDetails);


export default router;
