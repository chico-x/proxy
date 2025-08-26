import express from "express";
import bodyParser from "body-parser";
import puter from "puter-js"; // npm install puter-js

const app = express();
app.use(bodyParser.json());

// Load secret API key from environment variables
const MY_SECRET = process.env.PROXY_KEY;

if (!MY_SECRET) {
  console.error("❌ ERROR: No PROXY_KEY set in environment variables!");
  process.exit(1);
}

// Middleware: check API key
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (key !== MY_SECRET) {
    return res.status(403).json({ error: "Forbidden - Invalid API key" });
  }
  next();
});

// OpenAI-compatible endpoint
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, model } = req.body;

    // Convert chat messages to a prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    // Call Puter.js AI
    const response = await puter.ai.chat(prompt, {
      model: model || "deepseek-chat"
    });

    // Format response like OpenAI
    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response.message.content
          },
          finish_reason: "stop"
        }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: err.message } });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy running at http://localhost:${PORT}/v1/chat/completions`);
});
