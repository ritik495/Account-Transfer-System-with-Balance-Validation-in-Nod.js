// ================================
// Account Transfer System
// Node.js + Express + MongoDB
// ================================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// -------------------------------
// MongoDB Connection
// -------------------------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// -------------------------------
// User Schema & Model
// -------------------------------
const userSchema = new mongoose.Schema({
  name: String,
  balance: Number,
});

const User = mongoose.model("User", userSchema);

// -------------------------------
// Create Sample Users
// -------------------------------
app.post("/create-users", async (req, res) => {
  try {
    await User.deleteMany(); // reset users for testing
    const users = await User.insertMany([
      { name: "Alice", balance: 1000 },
      { name: "Bob", balance: 500 },
    ]);
    res.status(201).json({
      message: "Users created",
      users,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating users", error: err.message });
  }
});

// -------------------------------
// Transfer Endpoint
// -------------------------------
app.post("/transfer", async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  try {
    // Validate users
    const sender = await User.findById(fromUserId);
    const receiver = await User.findById(toUserId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update balances sequentially
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.status(200).json({
      message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Transfer failed", error: err.message });
  }
});

// -------------------------------
// Start Server
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
