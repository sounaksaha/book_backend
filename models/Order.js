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

    // Amount sent from frontend
    amount: {
      type: Number,
      required: true
    },

    // Razorpay fields
    order_id: {
      type: String
    },
    payment_id: {
      type: String
    },
    signature: {
      type: String
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },

    metadata: {
      type: Object
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
