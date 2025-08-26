import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PUTER_API = "https://api.puter.com/v1/chat/completions"; 
const API_KEY = process.env.PUTER_API_KEY; // stored securely on Render

// Fake endpoint JanitorAI will call
app.post("/v1/chat/completions", async (req, res) => {
  try {
    // Forward JanitorAI's request body to Puter
    const response = await fetch(PUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    // Send it back unchanged (so JanitorAI thinks it's the real API)
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fake API listening on port ${PORT}`);
});
