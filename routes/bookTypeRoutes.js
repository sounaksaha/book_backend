import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addBookType, deleteBookType, getAllBookTypes, getBookTypeById, updateBookType } from "../controllers/bookTypeController.js";

const router = express.Router();

// Protected: Only logged-in users can add/delete types

router.get("/", getAllBookTypes);
router.get("/:id", getBookTypeById);
router.post("/add", protect, addBookType);
router.delete("/:id", protect, deleteBookType);
router.put("/:id", protect, updateBookType);


export default router;
