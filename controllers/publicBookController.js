import mongoose from "mongoose";
import Book from "../models/Book.js";

// 📘 Public API — Get All Books (no pagination, with search)
export const getPublicBooks = async (req, res) => {
  try {
    const { search = "", bookTypeId = "" } = req.query;

    const filter = {};

    // 🔍 Search by book name
    if (search) {
      filter.bookName = { $regex: search, $options: "i" };
    }

    // 🔍 Filter by Book Type ID
    if (bookTypeId) {
      filter.bookTypeId = bookTypeId;
    }

    const books = await Book.find(filter)
      .populate("bookTypeId", "name") // ✅ include category name
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: books,
      message: books.length
        ? "Books fetched successfully"
        : "No books found for given filters",
    });
  } catch (error) {
    console.error("Error fetching public books:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching books",
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔒 Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id)
      .populate("bookTypeId", "name description");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Fetch book by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching book",
    });
  }
};
