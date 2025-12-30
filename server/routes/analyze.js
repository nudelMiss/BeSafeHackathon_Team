import express from "express";
import { analyzeMessage } from "../controllers/analyzeController.js";

const router = express.Router();

router.post("/analyze", analyzeMessage);

export default router;
