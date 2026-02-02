import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 🔴 THIS LINE IS VERY IMPORTANT
connectDB();

// routes
app.use("/api/auth", authRoutes);

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend + MongoDB running" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
