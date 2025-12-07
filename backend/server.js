require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const getRawBody = require("raw-body");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const User = require("./models/User");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const portfolioRoutes = require("./routes/portfolio");
const paymentRoutes = require("./routes/payment");
const subscriptionRoutes = require("./routes/subscription");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ✅ 1. Razorpay Webhook (handle raw body first)
app.post("/api/subscription/webhook", async (req, res) => {
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RZP_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Invalid Razorpay signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString());


    if (event.event === "subscription.charged") {
      const sub = event.payload.subscription.entity;

      await User.findOneAndUpdate(
        { "subscription.subscriptionId": sub.id },
        {
          "subscription.status": sub.status,
          "subscription.endedAt": sub.ended_at
            ? new Date(sub.ended_at * 1000)
            : null,
        }
      );


    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ error: "Webhook handling failed" });
  }
});

// ✅ 2. Body parser for all other routes
app.use(express.json());

// ✅ 3. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/user", userRoutes); // includes /me/subscription

// ✅ 4. Connect to MongoDB with optimized connection pooling
mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections in the pool
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // Timeout for selecting a server
    family: 4 // Use IPv4, skip trying IPv6
  })
  .then(() => console.log("Connected to MongoDB with connection pooling"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ 5. Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});