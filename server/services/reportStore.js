import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "reports.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf-8");
}

export async function addReport(report) {
  ensureStore();
  const raw = fs.readFileSync(filePath, "utf-8");
  const reports = JSON.parse(raw);
  reports.push(report);
  fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), "utf-8");
}

export async function getReportsByUser(userId, limit) {
  ensureStore();
  const raw = fs.readFileSync(filePath, "utf-8");
  const reports = JSON.parse(raw);

  const filtered = reports
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (limit && Number.isFinite(Number(limit))) {
    return filtered.slice(0, Number(limit));
  }
  return filtered;
}
