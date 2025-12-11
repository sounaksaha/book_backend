import mongoose from "mongoose";
import BookType from "../models/BookType.js";

// ===== ADD TYPE =====
export const addBookType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Type name is required" });
    }

    // Prevent duplicate
    const existing = await BookType.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Type already exists" });
    }

    const newType = await BookType.create({ name, description });

    res.status(201).json({
      success: true,
      message: "Book type added successfully",
      data: newType,
    });
  } catch (error) {
    console.error("Add type error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===== GET ALL TYPES =====
export const getAllBookTypes = async (req, res) => {
  try {
    const types = await BookType.find().sort({ createdAt: -1 });
    res.json({ success: true, data: types });
  } catch (error) {
    console.error("Fetch types error:", error);
    res.status(500).json({ success: false, message: "Error fetching book types" });
  }
};

// ===== GET BOOK TYPE BY ID =====
export const getBookTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const type = await BookType.findById(id);

    if (!type) {
      return res.status(404).json({ success: false, message: "Book type not found" });
    }

    res.json({
      success: true,
      data: type,
    });
  } catch (error) {
    console.error("Fetch type by ID error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===== UPDATE BOOK TYPE =====
export const updateBookType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // Prevent duplicate name (case insensitive)
    const existing = await BookType.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Another type with this name already exists",
      });
    }

    const updated = await BookType.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Book type not found" });
    }

    res.json({
      success: true,
      message: "Book type updated successfully",
      data: updated,
    });

  } catch (error) {
    console.error("Update type error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ===== DELETE TYPE =====
export const deleteBookType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BookType.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Type not found" });
    }
    res.json({ success: true, message: "Book type deleted successfully" });
  } catch (error) {
    console.error("Delete type error:", error);
    res.status(500).json({ success: false, message: "Error deleting type" });
  }
};
