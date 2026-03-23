import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import http from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const PORT = 3000;

  app.use(express.json());

  // Anthropic SDK initialization
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || "",
  });

  // WebSocket logic
  io.on("connection", (socket) => {
    console.log("Client connected to WebSocket");
    
    socket.on("disconnect", () => {
      console.log("Client disconnected from WebSocket");
    });
  });

  // Mock incident generation for real-time demonstration
  setInterval(() => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];
    const categories = ['Cyber', 'Fraud', 'Compliance', 'Identity', 'AML'];
    const assignees = ['M. Okonkwo', 'K. Patel', 'L. Tremblay', 'S. Chen', 'R. Singh'];
    
    const newIncident = {
      id: `INC-2025-${Math.floor(Math.random() * 9000) + 1000}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      title: 'Automated Threat Detection — Real-time Event',
      entity: `RDFI-NODE-${Math.floor(Math.random() * 99)}`,
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      status: 'Investigating',
      created: 'Just now',
      sla: '2h',
      correlatedAlerts: []
    };
    
    io.emit("incident:new", newIncident);
  }, 45000); // Emit every 45 seconds to keep it visible but not overwhelming

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
