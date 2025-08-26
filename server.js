import express from "express";
import Puter from "puter"; // assuming Puter.js SDK

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Initialize Puter
const puter = new Puter({ apiKey: process.env.PUTER_API_KEY });

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request: messages missing" });
    }

    // Convert OpenAI-style messages to Puter messages
    const userMessage = messages[messages.length - 1].content;

    // Call Puter
    const puterReply = await puter.chat({
      model: model || "default",
      message: userMessage
    });

    const reply = puterReply?.output || "⚠️ No reply from Puter";

    // Return OpenAI-compatible response
    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "puter-fake",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: reply },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: reply.split(" ").length,
        total_tokens: reply.split(" ").length
      }
    });

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Something went wrong with Puter" });
  }
});

app.listen(PORT, () => {
  console.log(`Puter OpenAI-style proxy listening on port ${PORT}`);
});
