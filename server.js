import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// In-memory conversation store
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

    // Get the latest message (Puter.js expects just the current message)
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // Call Puter.js API (this is based on their documentation)
    const response = await fetch('https://api.puter.com/v2/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        model: model || 'gpt-4.1-nano' // Default to their nano model
      })
    });

    if (!response.ok) {
      throw new Error(`Puter API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.response || "No response from Puter";

    // Save assistant reply in conversation history
    conversations[sessionKey].push({ role: "assistant", content: reply });

    // Return OpenAI-compatible response
    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "gpt-4.1-nano",
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
    res.status(500).json({ error: "Something went wrong with Puter API" });
  }
});

app.listen(PORT, () => {
  console.log(`Puter OpenAI-style proxy listening on port ${PORT}`);
});
