import { Router, type Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

const STORAGE_DIR = process.env.NZB_STORAGE_DIR || path.join(process.cwd(), "data", "nzb");

/** Ensure storage directory exists */
async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

/** Get full file path for a hash */
function getFilePath(hash: string): string {
  // Validate hash — only allow hex characters to prevent path traversal
  if (!/^[a-f0-9]+$/i.test(hash)) {
    throw new Error("Invalid hash format");
  }
  return path.join(STORAGE_DIR, `${hash}.nzb`);
}

// GET /files — list all stored NZB file hashes
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    await ensureStorageDir();
    const entries = await fs.readdir(STORAGE_DIR);
    const hashes = entries
      .filter((f) => f.endsWith(".nzb"))
      .map((f) => f.replace(".nzb", ""));

    res.json({ files: hashes, count: hashes.length });
  } catch (err) {
    console.error("[files] List error:", err);
    res.status(500).json({ error: "Fehler beim Auflisten der Dateien." });
  }
});

// GET /files/:hash — download NZB file by hash
router.get("/:hash", async (req: AuthRequest, res: Response) => {
  try {
    const hash = String(req.params.hash);
    const filePath = getFilePath(hash);

    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({ error: "Datei nicht gefunden." });
      return;
    }

    const content = await fs.readFile(filePath);
    const stat = await fs.stat(filePath);

    res.setHeader("Content-Type", "application/x-nzb");
    res.setHeader("Content-Disposition", `attachment; filename="${hash}.nzb"`);
    res.setHeader("Content-Length", stat.size);
    res.send(content);
  } catch (err: any) {
    if (err?.message === "Invalid hash format") {
      res.status(400).json({ error: "Ungültiges Hash-Format." });
      return;
    }
    console.error("[files] Get error:", err);
    res.status(500).json({ error: "Fehler beim Laden der Datei." });
  }
});

// HEAD /files/:hash — check if file exists
router.head("/:hash", async (req: AuthRequest, res: Response) => {
  try {
    const hash = String(req.params.hash);
    const filePath = getFilePath(hash);

    try {
      const stat = await fs.stat(filePath);
      res.setHeader("Content-Length", stat.size);
      res.status(200).end();
    } catch {
      res.status(404).end();
    }
  } catch (err: any) {
    if (err?.message === "Invalid hash format") {
      res.status(400).end();
      return;
    }
    res.status(500).end();
  }
});

// PUT /files/:hash — store NZB file
router.put("/:hash", async (req: AuthRequest, res: Response) => {
  try {
    const hash = String(req.params.hash);
    const filePath = getFilePath(hash);

    await ensureStorageDir();

    // Read raw body with size limit
    const MAX_NZB_BYTES = 50 * 1024 * 1024; // 50 MB
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > MAX_NZB_BYTES) {
        res.status(413).json({ error: "Datei zu groß (max 50 MB)." });
        return;
      }
      chunks.push(buf);
    }
    const content = Buffer.concat(chunks);

    if (content.length === 0) {
      res.status(400).json({ error: "Keine Datei-Daten empfangen." });
      return;
    }

    await fs.writeFile(filePath, content);
    const stat = await fs.stat(filePath);

    console.log(`[files] Stored: ${hash}.nzb (${stat.size} bytes)`);

    res.status(201).json({
      hash,
      size: stat.size,
      stored: true,
    });
  } catch (err: any) {
    if (err?.message === "Invalid hash format") {
      res.status(400).json({ error: "Ungültiges Hash-Format." });
      return;
    }
    console.error("[files] Store error:", err);
    res.status(500).json({ error: "Fehler beim Speichern der Datei." });
  }
});

// DELETE /files/:hash — delete NZB file
router.delete("/:hash", async (req: AuthRequest, res: Response) => {
  try {
    const hash = String(req.params.hash);
    const filePath = getFilePath(hash);

    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({ error: "Datei nicht gefunden." });
      return;
    }

    await fs.unlink(filePath);
    console.log(`[files] Deleted: ${hash}.nzb`);
    res.json({ hash, deleted: true });
  } catch (err: any) {
    if (err?.message === "Invalid hash format") {
      res.status(400).json({ error: "Ungültiges Hash-Format." });
      return;
    }
    console.error("[files] Delete error:", err);
    res.status(500).json({ error: "Fehler beim Löschen der Datei." });
  }
});

export default router;
