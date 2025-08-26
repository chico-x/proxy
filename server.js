import express from "express";
import Puter from "puter";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Initialize Puter
const puter = new Puter({ apiKey: process.env.PUTER_API_KEY });

// In-memory conversation store (simple)
const conversations = {};

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, model, session_id } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request: messages missing" });
    }

    // Use session_id to maintain conversation history
    const sessionKey = session_id || "default";
    if (!conversations[sessionKey]) conversations[sessionKey] = [];

    // Append new messages to session history
    conversations[sessionKey].push(...messages);

    // Convert OpenAI-style messages to Puter format
    const fullConversation = conversations[sessionKey].map(m => m.content).join("\n");

    // Call Puter
    const puterReply = await puter.chat({
      model: model || "default",
      message: fullConversation
    });

    const reply = puterReply?.output || "⚠️ No reply from Puter";

    // Save assistant reply in conversation history
    conversations[sessionKey].push({ role: "assistant", content: reply });

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
