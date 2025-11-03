import Book from "../models/Book.js";

// 📘 Public API — Get All Books (no pagination, with search)
export const getPublicBooks = async (req, res) => {
  try {
    const { search = "", type = "" } = req.query;

    // 🔍 Build search filter
    const filter = {};

    if (search) {
      filter.bookName = { $regex: search, $options: "i" }; // case-insensitive
    }

    if (type) {
      filter.type = { $regex: type, $options: "i" };
    }

    // 🧩 Fetch books without pagination
    const books = await Book.find(filter)
      .select("-__v -createdAt -updatedAt") // optional: remove unnecessary fields
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
