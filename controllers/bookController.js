import mongoose from "mongoose";

import Book from "../models/Book.js";
import ftp from "basic-ftp";
import dotenv from "dotenv";
import { Readable } from "stream";
dotenv.config();

/**
 * Upload file to Hostinger FTP and return its public URL
 */
const uploadToHostinger = async (file) => {
  const client = new ftp.Client();
  client.ftp.verbose = true; // Show detailed FTP logs for debugging

  try {
    // 🔹 Connect to FTP
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS.replace(/"/g, ""), // remove quotes if any
      secure: false,
      secureOptions: { rejectUnauthorized: false },
    });

    const timestamp = Date.now();
    const remoteDir = process.env.FTP_UPLOAD_DIR || "assets";
    const remoteFileName = `book_${timestamp}_${file.originalname}`;
    const remotePath = `/${remoteDir}/${remoteFileName}`;

    console.log("📤 Uploading to:", remotePath);

    // ✅ Convert file buffer to readable stream
    const stream = Readable.from(file.buffer);

    // ✅ Ensure the directory exists (creates it if missing)
    await client.ensureDir(remoteDir);

    // ✅ Upload file directly to that directory
    await client.uploadFrom(stream, remoteFileName);

    console.log("✅ FTP Upload Complete");
    client.close();

    // ✅ Return public URL
    return `${process.env.FTP_PUBLIC_URL}/${remoteFileName}`;
  } catch (err) {
    console.error("❌ FTP Upload Error:", err.message);
    client.close();
    throw new Error("Failed to upload image to Hostinger FTP");
  }
};


export const createBook = async (req, res) => {
  try {
    const { bookName, description, mrp, discount, type, count, authorName } = req.body;

    // 🔸 Validate mandatory fields
    if (!bookName || !mrp) {
      return res.status(400).json({
        success: false,
        message: "Book name and MRP are required",
      });
    }

    let imageUrl = null;

    // 🔹 Upload image if provided
    if (req.file) {
      imageUrl = await uploadToHostinger(req.file);
    }

    // 🔹 Create a new book document
    const newBook = new Book({
      bookName,
      description,
      mrp,
      discount,
      type,
      count,
      authorName,
      imageUrl,
    });

    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    console.error("Book creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};


export const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const filter = {};

    // 🔍 Unified search across multiple fields
    if (search) {
      filter.$or = [
        { bookName: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const books = await Book.find(filter)
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
    res.status(500).json({ success: false, message: "Error fetching books" });
  }
};

// ===== GET BOOK BY ID =====
// ===== GET BOOK BY ID =====
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const book = await Book.findById(id);

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

    // 🔹 Validate MongoDB ObjectId
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
      type,
      count,
      authorName,
    } = req.body;

    // 🔹 Find existing book
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // 🔹 Upload new image if provided
    let imageUrl = book.imageUrl;
    if (req.file) {
      imageUrl = await uploadToHostinger(req.file);
    }

    // 🔹 Update fields
    book.bookName = bookName ?? book.bookName;
    book.description = description ?? book.description;
    book.mrp = mrp ?? book.mrp;
    book.discount = discount ?? book.discount;
    book.type = type ?? book.type;
    book.count = count ?? book.count;
    book.authorName = authorName ?? book.authorName;
    book.imageUrl = imageUrl;

    await book.save();

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
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