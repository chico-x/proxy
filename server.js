import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Fake OpenAI-compatible endpoint
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, model } = req.body;

    // Forward to Puter API
    const puterRes = await fetch("https://api.puter.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PUTER_API_KEY}`
      },
      body: JSON.stringify({ messages, model })
    });

    const data = await puterRes.json();

    // Get Puter’s reply (adjust depending on their response shape)
    const reply =
      data.output ||
      data.choices?.[0]?.message?.content ||
      "⚠️ Error: no reply from Puter";

    // Wrap in OpenAI-style response
    const fakeResponse = {
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "puter-fake",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: reply
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: reply.split(" ").length,
        total_tokens: reply.split(" ").length
      }
    };

    res.json(fakeResponse);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Something went wrong with proxy" });
  }
});

app.listen(PORT, () => {
  console.log(`Fake API listening on port ${PORT}`);
});
