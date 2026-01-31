import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/db.js";

const app = express();

// middleware
app.use(express.json());

// 🔴 THIS LINE IS VERY IMPORTANT
connectDB();

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend + MongoDB running" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
