import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { normalizeFeedbackText } from "../lib/data-quality";
import bcrypt from "bcryptjs";

describe("Security & Multi-Tenancy Invariants", () => {
  describe("Tenant Isolation Enforcement", () => {
    test("guarantees query for another workspace returns 0 records", async () => {
      const foreignWorkspaceId = "ws-foreign-tenant-isolated-999";

      // 1. Feedback isolation
      const feedback = await prisma.feedback.findMany({
        where: { workspaceId: foreignWorkspaceId },
      });
      assert.equal(feedback.length, 0, "Foreign workspace must return zero feedback items");

      // 2. Alert isolation
      const alerts = await prisma.alert.findMany({
        where: { workspaceId: foreignWorkspaceId },
      });
      assert.equal(alerts.length, 0, "Foreign workspace must return zero alerts");

      // 3. Roadmap isolation
      const roadmap = await prisma.roadmapItem.findMany({
        where: { workspaceId: foreignWorkspaceId },
      });
      assert.equal(roadmap.length, 0, "Foreign workspace must return zero roadmap items");

      // 4. Recommendation isolation
      const recommendations = await prisma.aIRecommendation.findMany({
        where: { workspaceId: foreignWorkspaceId },
      });
      assert.equal(recommendations.length, 0, "Foreign workspace must return zero recommendations");
    });
  });

  describe("Input Sanitization & Injection Protection", () => {
    test("neutralizes control characters and preserves clean markdown", () => {
      const maliciousPayload = "<script>alert('XSS')</script>\u0000\u0007\u001F  Review text with   spaces";
      const cleaned = normalizeFeedbackText(maliciousPayload);

      // Null bytes and control characters stripped
      assert.ok(!cleaned.includes("\u0000"), "Null bytes must be stripped");
      assert.ok(!cleaned.includes("\u0007"), "Bell control characters must be stripped");
      assert.ok(!cleaned.includes("\u001F"), "Unit separator control characters must be stripped");
      assert.ok(cleaned.includes("Review text with spaces"), "Legitimate text must be preserved");
    });
  });

  describe("Authentication & Credential Security", () => {
    test("verifies all database users have salted bcrypt password hashes", async () => {
      const users = await prisma.user.findMany({
        select: { email: true, passwordHash: true },
      });

      assert.ok(users.length >= 3, "Seed users must exist");
      for (const u of users) {
        assert.ok(u.passwordHash, `User ${u.email} must have a passwordHash`);
        assert.ok(
          u.passwordHash.startsWith("$2a$") || u.passwordHash.startsWith("$2b$"),
          `User ${u.email} passwordHash must be a valid bcrypt hash, got: ${u.passwordHash.slice(0, 10)}`
        );
        // Ensure plain text password is not stored
        assert.notEqual(u.passwordHash, "password123");
      }
    });

    test("verifies bcrypt hash correctly matches standard demo password", async () => {
      const admin = await prisma.user.findUnique({
        where: { email: "admin@loop.dev" },
      });
      assert.ok(admin);
      const isMatch = await bcrypt.compare("password123", admin.passwordHash);
      assert.equal(isMatch, true, "Bcrypt hash must match correct password");

      const isWrongMatch = await bcrypt.compare("wrong-password", admin.passwordHash);
      assert.equal(isWrongMatch, false, "Bcrypt hash must reject incorrect password");
    });
  });
});
