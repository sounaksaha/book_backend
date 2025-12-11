import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Book from "../models/Book.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { book_id, count, user_mobile, user_name, address, amount } =
      req.body;

    const rpOrder = await razorpay.orders.create({
      amount: amount * 100, // real amount
      currency: "INR",
    });

    const newOrder = await Order.create({
      book_id,
      count,
      user_mobile,
      user_name,
      address,
      amount, // store real amount
      order_id: rpOrder.id,
      metadata: { source: "mobile_app" },
    });

    res.json({
      success: true,
      order: newOrder,
      razorpay_order: rpOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Step 1: validate signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Invalid signature" });
    }

    // Step 2: Fetch real payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    const realAmount = payment.amount / 100; // convert paise → INR

    // Step 3: Update order in database
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: razorpay_order_id },
      {
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        amount: realAmount,
        status: payment.status,
        payment_method: payment.method,
        currency: payment.currency,
        isPaid: true,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Step 4: Success response
    res.json({
      success: true,
      message: "Payment verified successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.$or = [
        { user_name: { $regex: search, $options: "i" } },
        { user_mobile: { $regex: search, $options: "i" } }
      ];
    }

    let orders = await Order.find(query)
      .populate("book_id", "bookName authorName mrp imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // 🔍 Manual search on populated bookName
    if (search) {
      const lower = search.toLowerCase();

      orders = orders.filter(order =>
        order.book_id?.bookName?.toLowerCase().includes(lower) ||
        order.user_name?.toLowerCase().includes(lower) ||
        order.user_mobile?.toLowerCase().includes(lower)
      );
    }

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      total: totalOrders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / limit),
      data: orders
    });

  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ success: false });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order
    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Fetch book details
    const book = await Book.findById(order.book_id).lean();

    res.json({
      success: true,
      data: {
        _id: order._id,
        book_id: order.book_id,
        count: order.count, // 👈 Quantity
        user_mobile: order.user_mobile,
        user_name: order.user_name,
        address: order.address,
        amount: order.amount,
        order_id: order.order_id,
        status: order.status,
        book_details: book // 👈 merged book info
          ? {
              book_name: book.book_name,
              author: book.author,
              price: book.price,
            }
          : null,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
