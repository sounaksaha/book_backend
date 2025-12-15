import express from "express";
import multer from "multer";
import { createBook, deleteBookById, getAllBooks, getBookById, updateBookById,  } from "../controllers/bookController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage(); // ✅ buffer in memory for FTP upload
const upload = multer({ storage });

// Routes
router.post("/add", protect, upload.single("image"), createBook);
router.get("/", getAllBooks);
router.get("/:id", getBookById );
router.put("/update/:id", upload.single("image"), updateBookById);
router.delete("/delete/:id", deleteBookById);


export default router;
