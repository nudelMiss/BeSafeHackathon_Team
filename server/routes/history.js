import express from "express";
import { getReportsByUser } from "../services/reportStore.js";

const router = express.Router();

// Returns the history for a specific user
// GET /api/history/:userId
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const reports = await getReportsByUser(userId); 
    return res.status(200).json({ reports });
  } catch (error) {
    console.error("History error:", error);
    return res.status(500).json({ error: "Server error while fetching history" });
  }
});

export default router;
