import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = "test-secret-for-nzb-tests";

function createToken(userId = "test-user-1", email = "test@test.de"): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

const token = createToken();
const nzbContent = Buffer.from("<nzb><file>test nzb content</file></nzb>");

describe("Files Routes", () => {
  describe("Health", () => {
    it("GET /health antwortet ohne Auth", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.service).toBe("openmedia-nzb");
    });
  });

  describe("Auth", () => {
    it("lehnt Requests ohne Token ab", async () => {
      const res = await request(app).get("/files");
      expect(res.status).toBe(401);
    });

    it("lehnt ungültigen Token ab", async () => {
      const res = await request(app)
        .get("/files")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("akzeptiert gültigen Token", async () => {
      const res = await request(app)
        .get("/files")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("PUT /files/:hash", () => {
    it("speichert eine NZB-Datei", async () => {
      const res = await request(app)
        .put("/files/abc123def456")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      expect(res.status).toBe(201);
      expect(res.body.hash).toBe("abc123def456");
      expect(res.body.stored).toBe(true);
      expect(res.body.size).toBeGreaterThan(0);
    });

    it("lehnt leere Datei ab", async () => {
      const res = await request(app)
        .put("/files/abc123")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(Buffer.alloc(0));

      expect(res.status).toBe(400);
    });

    it("lehnt ungültigen Hash ab", async () => {
      const res = await request(app)
        .put("/files/../../../etc/passwd")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      // Express routes with dots in params — this should be 400 or 404
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("GET /files/:hash", () => {
    it("gibt gespeicherte Datei zurück", async () => {
      // Store first
      await request(app)
        .put("/files/ae12bf34cd56")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      // Retrieve
      const res = await request(app)
        .get("/files/ae12bf34cd56")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/x-nzb");
      expect(res.text).toBe(nzbContent.toString());
    });

    it("gibt 404 für nicht existierende Datei", async () => {
      const res = await request(app)
        .get("/files/aabbccddee11")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("HEAD /files/:hash", () => {
    it("gibt 200 für existierende Datei", async () => {
      await request(app)
        .put("/files/be12cf34de56")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      const res = await request(app)
        .head("/files/be12cf34de56")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Number(res.headers["content-length"])).toBeGreaterThan(0);
    });

    it("gibt 404 für nicht existierende Datei", async () => {
      const res = await request(app)
        .head("/files/aabbccddee22")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /files", () => {
    it("listet alle gespeicherten Hashes", async () => {
      // Store two files
      await request(app)
        .put("/files/a1b2c3d4e5f6")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      await request(app)
        .put("/files/f6e5d4c3b2a1")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      const res = await request(app)
        .get("/files")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.files).toContain("a1b2c3d4e5f6");
      expect(res.body.files).toContain("f6e5d4c3b2a1");
    });

    it("gibt leere Liste wenn keine Dateien", async () => {
      const res = await request(app)
        .get("/files")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.files).toEqual([]);
    });
  });

  describe("DELETE /files/:hash", () => {
    it("löscht eine Datei", async () => {
      // Store first
      await request(app)
        .put("/files/de1e7e123456")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(nzbContent);

      // Delete
      const res = await request(app)
        .delete("/files/de1e7e123456")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);

      // Verify gone
      const check = await request(app)
        .get("/files/de1e7e123456")
        .set("Authorization", `Bearer ${token}`);
      expect(check.status).toBe(404);
    });

    it("gibt 404 für nicht existierende Datei", async () => {
      const res = await request(app)
        .delete("/files/aabbccddee33")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
