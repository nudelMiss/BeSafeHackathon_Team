import fs from "fs";
import path from "path";
import crypto from "crypto";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "reports.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    const initialData = {
      usersByNickname: {},
      reportsByUser: {},
    };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

function normalizeNickname(nickname) {
  return nickname.trim().toLowerCase();
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  // Backward compatibility: old format was a flat array
  if (Array.isArray(parsed)) {
    const migrated = { usersByNickname: {}, reportsByUser: {} };

    for (const report of parsed) {
      if (!report?.userId) continue;

      if (!migrated.reportsByUser[report.userId]) {
        migrated.reportsByUser[report.userId] = [];
      }
      migrated.reportsByUser[report.userId].push(report);

      // Best-effort: if old report has nickname, map it to userId
      if (report.nickname) {
        const key = normalizeNickname(report.nickname);
        if (!migrated.usersByNickname[key]) {
          migrated.usersByNickname[key] = {
            id: report.userId,
            nickname: report.nickname,
            createdAt: new Date().toISOString(),
          };
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2), "utf-8");
    return migrated;
  }

  // If structure exists but missing new fields, patch it
  if (!parsed.usersByNickname) parsed.usersByNickname = {};
  if (!parsed.reportsByUser) parsed.reportsByUser = {};

  return parsed;
}

function writeStore(store) {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

/**
 * Returns an existing user for nickname or creates a new one with a unique id.
 */
export async function getOrCreateUserByNickname(nickname) {
  const store = readStore();
  const key = normalizeNickname(nickname);

  const existing = store.usersByNickname[key];
  if (existing?.id) {
    return { id: existing.id, nickname: existing.nickname };
  }

  const newUser = {
    id: crypto.randomUUID(),
    nickname: nickname.trim(),
    createdAt: new Date().toISOString(),
  };

  store.usersByNickname[key] = newUser;
  if (!store.reportsByUser[newUser.id]) {
    store.reportsByUser[newUser.id] = [];
  }

  writeStore(store);
  return { id: newUser.id, nickname: newUser.nickname };
}

export async function addReport(userId, report) {
  const store = readStore();

  if (!store.reportsByUser[userId]) {
    store.reportsByUser[userId] = [];
  }

  store.reportsByUser[userId].push(report);
  writeStore(store);
}

export async function getReportsByUser(userId, limit) {
  const store = readStore();

  const reports = store.reportsByUser[userId] ?? [];

  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (limit && Number.isFinite(Number(limit))) {
    return sorted.slice(0, Number(limit));
  }

  return sorted;
}
