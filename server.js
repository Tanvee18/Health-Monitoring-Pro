import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Load API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ES module helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data
app.use(express.static(path.join(__dirname, "public")));

// Serve login page at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Simple login POST route (for testing)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Very simple check (replace with real authentication later)
  if (email === "test@example.com" && password === "123456") {
    return res.json({ success: true, redirect: "/chat" });
  } else {
    return res.json({ success: false, message: "Invalid email or password" });
  }
});

// Serve chat page
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// POST /chat route for OpenAI messages
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "⚠️ No message provided." });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful health monitoring assistant. Remind users you are not a doctor."
          },
          { role: "user", content: userMessage }
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const replyText = response.data.choices[0].message.content;
    res.json({ reply: replyText });

  } catch (err) {
    console.error("OpenAI API error:", err.response?.data || err.message);
    res.status(500).json({ reply: "⚠️ AI API error. Check server console." });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
