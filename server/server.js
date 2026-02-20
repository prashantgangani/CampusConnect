import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔴 THIS LINE IS VERY IMPORTANT
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/quiz", quizRoutes);

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend + MongoDB running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
