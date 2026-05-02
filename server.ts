import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import admin from "firebase-admin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// In this environment, we may not have a service account key file.
// We'll attempt to initialize with default credentials (likely available on Cloud Run)
// or skip backend writes if not available.
try {
  admin.initializeApp();
} catch (error) {
  console.warn("Firebase Admin failed to initialize with default credentials. API might be limited.", error);
}

const db = admin.apps.length ? admin.firestore() : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Webhook Endpoint
  app.post("/api/webhooks/leads", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    const { name, company, email, phone, status } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: "Missing X-API-KEY header" });
    }

    if (!db) {
      return res.status(503).json({ error: "Firebase Admin is not configured" });
    }

    try {
      // Find the user with this webhook key
      const settingsSnap = await db.collection("settings")
        .where("webhookKey", "==", apiKey)
        .limit(1)
        .get();

      if (settingsSnap.empty) {
        return res.status(403).json({ error: "Invalid API Key" });
      }

      const userId = settingsSnap.docs[0].id;
      
      const newLead = {
        name: name || "Unknown Lead",
        company: company || "Unknown Company",
        email: email || "",
        phone: phone || "",
        status: ["new", "qualified", "proposal", "closed"].includes(status) ? status : "new",
        ownerId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        externalId: "webhook-" + Date.now()
      };

      await db.collection("leads").add(newLead);
      
      res.status(201).json({ success: true, message: "Lead captured via webhook" });
    } catch (err) {
      console.error("Webhook Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
