import express from "express";
import { createOrder, getAllOrders, getOrderById, verifyPayment } from "../controllers/orderController.js";

const router = express.Router();

// Create Razorpay Order
router.post("/create-order", createOrder);

// Verify Payment
router.post("/verify-payment", verifyPayment);

// Get order by IDgetOrderById
router.get("/:id", getOrderById);

// // Get all orders (admin)
router.get("/", getAllOrders);




export default router;
