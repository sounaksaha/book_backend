import express from "express";
import { getPublicBooks } from "../controllers/publicBookController.js";

const router = express.Router();

// ✅ GET public books
router.get("/", getPublicBooks);

export default router;
