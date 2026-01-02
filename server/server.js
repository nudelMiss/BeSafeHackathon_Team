import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

import analyzeRoutes from "./routes/analyze.js";
import historyRoutes from "./routes/history.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
console.log("CLIENT_URL =", process.env.CLIENT_URL);
console.log("PORT =", process.env.PORT);

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL, 
  })
);


app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api", analyzeRoutes);
app.use("/api", historyRoutes);


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



