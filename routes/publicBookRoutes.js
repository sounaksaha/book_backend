import express from "express";
import { getBookById, getPublicBooks } from "../controllers/publicBookController.js";

const router = express.Router();

// ✅ GET public books
router.get("/", getPublicBooks);
router.get("/:id",getBookById)
export default router;
