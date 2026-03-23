import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Anthropic SDK initialization
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || "",
  });

  // API routes
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ error: "CLAUDE_API_KEY is not configured in the environment." });
    }

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: "You are NorthGuard AI, a specialized financial services security and compliance assistant. You help users with OSFI, FINTRAC, and PCMLTFA regulations, as well as general cyber threat intelligence and fraud detection. Be professional, concise, and highly technical.",
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      });

      res.json({ content: response.content[0] });
    } catch (error: any) {
      console.error("Claude API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Claude API" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
