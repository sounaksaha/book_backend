import express from "express";
import multer from "multer";

import { createBlog, deleteBlog, getAllBlogs, getBlogById, updateBlog } from "../controllers/blogController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create", upload.single("image"), createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/update/:id", upload.single("image"), updateBlog);
router.delete("/delete/:id", deleteBlog);




export default router;
