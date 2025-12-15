import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    books: [
      {
        book_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true
        },
        count: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    user_mobile: {
      type: String,
      required: true
    },

    user_name: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    // Amount calculated on backend
    amount: {
      type: Number,
      required: true
    },

    // Razorpay identifiers
    order_id: {
      type: String,
      unique: true
    },

    payment_id: {
      type: String
    },

    signature: {
      type: String
    },

    // Business status
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },

    // Razorpay raw status
    razorpay_status: {
      type: String
    },

    payment_method: {
      type: String
    },

    currency: {
      type: String,
      default: "INR"
    },

    metadata: {
      type: Object
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
