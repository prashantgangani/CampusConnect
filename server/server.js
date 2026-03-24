import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import placementRoutes from "./routes/placementRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();

// middleware
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and local development by default.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', 1);

// 🔴 THIS LINE IS VERY IMPORTANT
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/resume", resumeRoutes);

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend + MongoDB running" });
});

app.get('/', (req, res) => {
  res.json({ message: 'CampusConnect API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
