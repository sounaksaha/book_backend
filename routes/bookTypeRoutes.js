import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addBookType, deleteBookType, getAllBookTypes } from "../controllers/bookTypeController.js";

const router = express.Router();

// Protected: Only logged-in users can add/delete types
router.post("/add", protect, addBookType);
router.get("/", getAllBookTypes);
router.delete("/:id", protect, deleteBookType);

export default router;
