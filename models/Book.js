import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    mrp: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },

    // 🔹 Reference to BookType
    bookTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookType",
      required: true,
    },

    count: {
      type: Number,
      default: 0,
    },
    authorName: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
