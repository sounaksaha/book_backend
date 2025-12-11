import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookTypeRoutes from "./routes/bookTypeRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import publicBookRoutes from "./routes/publicBookRoutes.js"
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("📚 Book API is running...");
});
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/book-types", bookTypeRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/public/books", publicBookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
