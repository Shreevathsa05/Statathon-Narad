import express from "express";
import cors from "cors";
import { verifyWebhook, handleIncomingMessage } from "./controllers/whatsapp.controller.js";
import { runCampaignInvitations } from "./services/campaign.service.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook endpoints for WhatsApp Cloud API
app.get("/webhook", verifyWebhook);
app.post("/webhook", handleIncomingMessage);

// Campaign dispatch trigger endpoint
app.post("/api/campaign/dispatch", async (req, res) => {
  try {
    console.log("[HTTP Campaign Trigger] Initiating manual dispatch for pending targets...");
    const summary = await runCampaignInvitations();
    return res.status(200).json({
      success: true,
      message: "Campaign invitations processing completed.",
      data: summary
    });
  } catch (error) {
    console.error("Campaign manual dispatch error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error during campaign dispatch.",
      details: error.message
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "NARAD WhatsApp Bot" });
});

export default app;
