import express from "express";
import multer from "multer";
import { createBook, deleteBookById, getAllBooks, getBookById, updateBookById,  } from "../controllers/bookController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/add", upload.single("image"), protect, createBook);

router.get("/", getAllBooks);
router.get("/:id", getBookById );
router.put("/update/:id", upload.single("image"), updateBookById);
router.delete("/delete/:id", deleteBookById);


export default router;
