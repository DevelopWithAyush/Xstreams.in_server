import express from "express";
import { handleGetAllBlogs, handleGetBlogDetails } from "../controller/adminController/blog.controller.js";

const router = express.Router();

router.get("/", handleGetAllBlogs);
router.get("/:slug", handleGetBlogDetails);

export default router;