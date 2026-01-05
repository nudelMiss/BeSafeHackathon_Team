import express from "express";
import { analyzeMessage } from "../controllers/analyzeController.js";
import { getOrCreateUserByNickname, getReportsByUser } from "../services/reportStore.js";

const router = express.Router();

/**
 * Create a new report (analyze)
 * POST /api/reports
 */
router.post("/", analyzeMessage);

/**
 * Get reports for a nickname
 * GET /api/reports?nickname=...
 */
router.get("/", async (req, res) => {
  try {
    const nickname = (req.query.nickname || "").toString().trim();

    if (!nickname) {
      return res.status(400).json({ error: "Missing nickname (query param)" });
    }

    const user = await getOrCreateUserByNickname(nickname);
    const reports = await getReportsByUser(user.id);

    return res.status(200).json({
      userId: user.id,
      nickname: user.nickname,
      reports,
    });
  } catch (error) {
    console.error("Reports GET error:", error);
    return res.status(500).json({ error: "Server error while fetching reports" });
  }
});

export default router;
