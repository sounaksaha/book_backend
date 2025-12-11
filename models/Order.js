import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    count: { type: Number, required: true },
    user_mobile: { type: String, required: true },
    user_name: { type: String, required: true },
    address: { type: String, required: true },

    // Store REAL amount after verification
    amount: { type: Number, required: true },

    // Store Razorpay details
    order_id: { type: String },
    payment_id: { type: String },
    signature: { type: String },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },

    metadata: { type: Object } // like Stripe
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
