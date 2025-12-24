import mongoose from "mongoose";

import Book from "../models/Book.js";
import ftp from "basic-ftp";
import dotenv from "dotenv";
import { Readable } from "stream";
import BookType from "../models/BookType.js";
dotenv.config();

/**
 * Upload file to Hostinger FTP and return its public URL
 */
// import ftp from "basic-ftp";
// import { Readable } from "stream";
// import Book from "../models/Book.js";

/* ------------------------------------------------
   FTP Upload Helper (Hostinger)
------------------------------------------------ */
const uploadToHostinger = async (file) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: process.env.FTP_PORT || 21,
      secure: false,
    });

    const fileName = `book_${Date.now()}_${file.originalname}`;
    const remoteDir = process.env.FTP_UPLOAD_DIR || "assets";

    await client.ensureDir(remoteDir);

    const stream = Readable.from(file.buffer);
    await client.uploadFrom(stream, fileName);

    client.close();

    const imageUrl = `${process.env.FTP_PUBLIC_URL}/${fileName}`;
    console.log("✅ IMAGE UPLOADED:", imageUrl);

    return imageUrl;
  } catch (err) {
    client.close();
    console.error("❌ FTP ERROR:", err.message);
    throw new Error("Image upload failed");
  }
};

/* ---------- CREATE BOOK ---------- */
export const createBook = async (req, res) => {
  try {
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("FILE:", req.file);

    const {
      bookName,
      description,
      mrp,
      discount,
      bookTypeId,   // ✅ changed
      count,
      authorName,
    } = req.body;

    // 🔒 Basic validation
    if (!bookName || !mrp || !bookTypeId) {
      return res.status(400).json({
        success: false,
        message: "Book name, MRP and Book Type are required",
      });
    }

    // 🔒 Ensure BookType exists
    const bookTypeExists = await BookType.findById(bookTypeId);
    if (!bookTypeExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid Book Type",
      });
    }

    let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadToHostinger(req.file);
    }

    const book = new Book({
      bookName,
      description,
      mrp: Number(mrp),
      discount: Number(discount || 0),
      count: Number(count || 0),
      bookTypeId, // ✅ stored as ObjectId
      authorName,
      imageUrl,
    });

    await book.save();

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book,
    });
  } catch (err) {
    console.error("❌ CREATE BOOK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = {};

    // 🔍 Search logic
    if (search) {
      // find matching book types
      const bookTypes = await BookType.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const bookTypeIds = bookTypes.map((bt) => bt._id);

      filter.$or = [
        { bookName: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
        { bookTypeId: { $in: bookTypeIds } },
      ];
    }

    const books = await Book.find(filter)
      .populate("bookTypeId", "name description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / pageSize);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        totalBooks,
        totalPages,
        currentPage: pageNumber,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
    });
  }
};


// ===== GET BOOK BY ID =====
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const book = await Book.findById(id).populate(
      "bookTypeId",
      "name description"
    );

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
    console.error("Get Book By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching book details",
    });
  }
};


export const updateBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const {
      bookName,
      description,
      mrp,
      discount,
      bookTypeId,
      count,
      authorName,
    } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // 🔒 Validate BookType if provided
    if (bookTypeId) {
      if (!mongoose.Types.ObjectId.isValid(bookTypeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Book Type ID",
        });
      }

      const bookTypeExists = await BookType.findById(bookTypeId);
      if (!bookTypeExists) {
        return res.status(400).json({
          success: false,
          message: "Book Type does not exist",
        });
      }

      book.bookTypeId = bookTypeId;
    }

    // 🔹 Upload new image if provided
    if (req.file) {
      book.imageUrl = await uploadToHostinger(req.file);
    }

    // 🔹 Update fields safely
    book.bookName = bookName ?? book.bookName;
    book.description = description ?? book.description;
    book.mrp = mrp ?? book.mrp;
    book.discount = discount ?? book.discount;
    book.count = count ?? book.count;
    book.authorName = authorName ?? book.authorName;

    await book.save();

    const updatedBook = await Book.findById(book._id).populate(
      "bookTypeId",
      "name description"
    );

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Book update error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};



const deleteFromHostinger = async (imageUrl) => {
  if (!imageUrl) return;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS.replace(/"/g, ""),
      secure: false,
      secureOptions: { rejectUnauthorized: false },
    });

    // Extract filename from URL
    const fileName = path.basename(imageUrl);
    const remoteDir = process.env.FTP_UPLOAD_DIR || "assets";
    const remotePath = `/${remoteDir}/${fileName}`;

    await client.remove(remotePath);
    client.close();
  } catch (error) {
    console.error("FTP delete error:", error.message);
    client.close();
  }
};

/* ----------------------------------
   Delete Book API
---------------------------------- */
export const deleteBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // 🗑 Delete image from FTP (if exists)
    if (book.imageUrl) {
      await deleteFromHostinger(book.imageUrl);
    }

    // 🗑 Delete book from DB
    await Book.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete Book Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting book",
    });
  }
};